import { useDrizzle } from "../../utils/drizzle";
import { companies, contacts, assignments, conversationNotes, users, teams, teamMembers } from "../../database/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { createAuth } from "../../lib/auth";
import { createAutoTask } from "../../utils/createAutoTask";

// Import-Funktion für Kunden
export default eventHandler(async (event) => {
    // 1. Authentifizierung
    const auth = createAuth(event);
    const session = await auth.api.getSession({ headers: event.headers });

    if (!session?.user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Nicht autorisiert",
        });
    }

    const currentUser = session.user;
    const role = (currentUser as any).role;

    // 2. Berechtigungsprüfung (Agenten können nicht importieren)
    if (role === "Agent") {
        throw createError({
            statusCode: 403,
            statusMessage: "Verboten: Agenten können keine Kunden importieren.",
        });
    }

    const body = await readBody(event);
    const { customers, targetTeamId, targetAgentId } = body;

    // 3. Validierung der Zielzuweisung
    const db = useDrizzle(event);

    let finalTeamId: number | null = targetTeamId ? parseInt(targetTeamId) : null;
    let finalAgentId: string | null = targetAgentId || null;

    if (role === "Teamlead") {
        // Teamleiter können nur an IHRE Teams oder IHRE Agenten (oder sich selbst) zuweisen

        // Teams abrufen, die von diesem Benutzer geleitet werden
        const myLedTeams = await db.select().from(teams).where(eq(teams.teamleadId, currentUser.id));
        const myLedTeamIds = myLedTeams.map(t => t.id);

        if (myLedTeamIds.length === 0) {
            // Teamleiter ohne Teams können nur an sich selbst zuweisen
            if (finalTeamId) {
                throw createError({
                    statusCode: 403,
                    statusMessage: "Verboten: Sie leiten keine Teams, können nicht an ein Team zuweisen.",
                });
            }
            if (finalAgentId && finalAgentId !== currentUser.id) {
                throw createError({
                    statusCode: 403,
                    statusMessage: "Verboten: Sie leiten keine Teams, können nur an sich selbst zuweisen.",
                });
            }
        } else {
            // Validierung der Team-Zuweisung
            if (finalTeamId && !myLedTeamIds.includes(finalTeamId)) {
                throw createError({
                    statusCode: 403,
                    statusMessage: "Verboten: Sie können Importe nur an Teams zuweisen, die Sie leiten.",
                });
            }

            // Validierung der Agenten-Zuweisung
            if (finalAgentId && finalAgentId !== currentUser.id) {
                // Wenn nicht sich selbst, muss Mitglied eines der eigenen Teams sein
                // Alle Mitglieder der eigenen Teams abrufen
                const members = await db.select()
                    .from(teamMembers)
                    .where(inArray(teamMembers.teamId, myLedTeamIds));
                const memberIds = members.map(m => m.userId);

                if (!memberIds.includes(finalAgentId)) {
                    throw createError({
                        statusCode: 403,
                        statusMessage: "Verboten: Sie können Importe nur an Agenten in Ihren Teams zuweisen.",
                    });
                }
            }
        }
    }

    // Administratoren können an jeden zuweisen - keine zusätzliche Prüfung erforderlich.

    if (!customers || !Array.isArray(customers)) {
        throw createError({
            statusCode: 400,
            statusMessage: "Ungültiges Datenformat. Array von Kunden erwartet.",
        });
    }

    const results = {
        success: 0,
        failed: 0,
        created: 0,
        updated: 0,
        errors: [] as string[],
        details: [] as Array<{ company: string; action: string; contactsAdded: number }>,
    };

    // Hilfsfunktion zur Zuordnung des Umsatzes zu Bereichen
    const mapRevenueToRange = (revenue: any): string => {
        if (!revenue) return "";
        // Wenn es bereits ein String ist, der wie ein Bereich aussieht (enthält '-'), zurückgeben
        if (typeof revenue === 'string' && revenue.includes('-')) return revenue;

        const amount = parseFloat(revenue.toString().replace(/[^0-9.]/g, ''));
        if (isNaN(amount)) return revenue.toString();

        if (amount < 50000) return "< 50.000 €";
        if (amount < 100000) return "50.000 € - 100.000 €";
        if (amount < 250000) return "100.000 € - 250.000 €";
        if (amount < 500000) return "250.000 € - 500.000 €";
        if (amount < 1000000) return "500.000 € - 1 Mio. €";
        if (amount < 5000000) return "1 Mio. € - 5 Mio. €";
        if (amount < 10000000) return "5 Mio. € - 10 Mio. €";
        if (amount < 50000000) return "10 Mio. € - 50 Mio. €";
        return "> 50 Mio. €";
    };

    // ZEILEN NACH FIRMENNAME GRUPPIEREN
    // Dies ermöglicht es, mehrere Zeilen mit derselben Firma zu einer Firma mit mehreren Kontakten zu erstellen
    const companyGroups = new Map<string, any[]>();

    for (const row of customers) {
        const companyName = row.Firma || row.name || row.companyName;

        // Zeilen ohne Firmenname überspringen
        if (!companyName) {
            results.failed++;
            results.errors.push("Fehlender Firmenname für eine Zeile");
            continue;
        }

        // Firmenname für Gruppierung normalisieren (Kleinbuchstaben, Leerzeichen entfernen)
        const companyKey = companyName.toLowerCase().trim();

        if (!companyGroups.has(companyKey)) {
            companyGroups.set(companyKey, []);
        }

        companyGroups.get(companyKey)!.push(row);
    }

    // JEDE FIRMENGRUPPE VERARBEITEN
    for (const [companyKey, rows] of companyGroups) {
        try {
            // Erste Zeile für Firmendaten verwenden
            const companyData = rows[0];
            const companyName = companyData.Firma || companyData.name || companyData.companyName;

            // 1. DUPLIKAT-PRÜFUNG: Firma mit gleichem Namen suchen (case-insensitive)
            const existingCompanies = await db
                .select()
                .from(companies)
                .where(sql`lower(trim(${companies.name})) = ${companyKey}`)
                .limit(1);

            const existingCompany = existingCompanies[0];
            let companyId: number;
            let isUpdate = false;
            let isNewAssignment = false;
            let contactsAddedCount = 0;

            if (existingCompany) {
                // FIRMA EXISTIERT BEREITS
                companyId = existingCompany.id;

                // Prüfen, ob diese Firma bereits diesem Agent zugewiesen ist
                let alreadyAssignedToThisAgent = false;
                if (finalAgentId) {
                    const existingAssignments = await db
                        .select()
                        .from(assignments)
                        .where(
                            sql`${assignments.companyId} = ${companyId} AND ${assignments.agentId} = ${finalAgentId}`
                        )
                        .limit(1);
                    alreadyAssignedToThisAgent = existingAssignments.length > 0;
                }

                // Entscheiden: Update oder neue Zuweisung?
                if (alreadyAssignedToThisAgent) {
                    isUpdate = true; // Gleicher Agent → Aktualisiert
                } else {
                    isNewAssignment = true; // Anderer/neuer Agent → Neue Zuweisung
                }

                // Firmendaten aktualisieren (neue Daten ersetzen alte)
                await db
                    .update(companies)
                    .set({
                        name: companyName,
                        industry: companyData.Branche || companyData.industry,
                        website: companyData.Webseite || companyData.website,
                        phone: companyData.Telefon || companyData.phone || companyData.phoneNumber,
                        email: companyData.Email || companyData.email,
                        street: companyData.Straße || companyData.street || companyData.streetAddress,
                        postalCode: companyData.PLZ || companyData.postalCode,
                        city: companyData.Stadt || companyData.Ort || companyData.city,
                        state: companyData.Bundesland || companyData.state,
                        employeeCount: parseInt(companyData.Mitarbeiter || companyData.employeeCount) || 0,
                        revenueSize: mapRevenueToRange(companyData.Umsatz || companyData.revenueSize),
                        legalForm: companyData.Rechtsform || companyData.companyForm,
                        description: companyData.Beschreibung || companyData.description,
                        foundingDate: companyData.Gründung || companyData.foundingDate,
                        project: companyData.Projekt || companyData.project,
                        openingHours: companyData.Öffnungszeiten || companyData.openingHours,
                        updatedAt: new Date(),
                    })
                    .where(eq(companies.id, companyId));

                // Existierende Kontakte abrufen
                const existingContacts = await db
                    .select()
                    .from(contacts)
                    .where(eq(contacts.companyId, companyId));

                // Neue Kontakte hinzufügen
                for (const row of rows) {
                    if (row.Vorname || row.firstName || row.Ansprechpartner) {
                        await db.insert(contacts).values({
                            companyId: companyId,
                            firstName: row.Vorname || row.firstName || row.Ansprechpartner || "Unbekannt",
                            lastName: row.Nachname || row.lastName || "",
                            email: row.KontaktEmail || row.contactEmail || row.Email || "",
                            phone: row.KontaktTelefon || row.contactPhone || row.Telefon || "",
                            position: row.Position || row.position,
                            isPrimary: existingContacts.length === 0 && contactsAddedCount === 0, // Erster Kontakt ist primär wenn noch keine existieren
                            birthDate: row.Geburtsdatum || row.birthDate,
                            linkedin: row.LinkedIn || row.linkedin,
                            xing: row.Xing || row.xing,
                            facebook: row.Facebook || row.facebook,
                        });
                        contactsAddedCount++;
                    }
                }

                if (isUpdate) {
                    results.updated++;
                }
                // isNewAssignment wird unten im Feedback unterschieden
            } else {
                // NEUE FIRMA → CREATE
                const newCompany = await db
                    .insert(companies)
                    .values({
                        name: companyName,
                        industry: companyData.Branche || companyData.industry,
                        website: companyData.Webseite || companyData.website,
                        phone: companyData.Telefon || companyData.phone || companyData.phoneNumber,
                        email: companyData.Email || companyData.email,
                        street: companyData.Straße || companyData.street || companyData.streetAddress,
                        postalCode: companyData.PLZ || companyData.postalCode,
                        city: companyData.Stadt || companyData.Ort || companyData.city,
                        state: companyData.Bundesland || companyData.state,
                        employeeCount: parseInt(companyData.Mitarbeiter || companyData.employeeCount) || 0,
                        revenueSize: mapRevenueToRange(companyData.Umsatz || companyData.revenueSize),
                        legalForm: companyData.Rechtsform || companyData.companyForm,
                        description: companyData.Beschreibung || companyData.description,
                        foundingDate: companyData.Gründung || companyData.foundingDate,
                        project: companyData.Projekt || companyData.project,
                        openingHours: companyData.Öffnungszeiten || companyData.openingHours,
                    })
                    .returning()
                    .get();

                if (!newCompany) {
                    throw new Error("Fehler beim Erstellen der Firma");
                }

                companyId = newCompany.id;

                // Kontakte erstellen
                for (const [index, row] of rows.entries()) {
                    if (row.Vorname || row.firstName || row.Ansprechpartner) {
                        await db.insert(contacts).values({
                            companyId: companyId,
                            firstName: row.Vorname || row.firstName || row.Ansprechpartner || "Unbekannt",
                            lastName: row.Nachname || row.lastName || "",
                            email: row.KontaktEmail || row.contactEmail || row.Email || "",
                            phone: row.KontaktTelefon || row.contactPhone || row.Telefon || "",
                            position: row.Position || row.position,
                            isPrimary: index === 0,
                            birthDate: row.Geburtsdatum || row.birthDate,
                            linkedin: row.LinkedIn || row.linkedin,
                            xing: row.Xing || row.xing,
                            facebook: row.Facebook || row.facebook,
                        });
                        contactsAddedCount++;
                    }
                }

                // Leere Gesprächsnotiz erstellen (nur für neue Firmen)
                await db.insert(conversationNotes).values({
                    companyId: companyId,
                    conversationHook: "",
                    researchResult: "",
                });

                results.created++;
            }

            // 2. Neue Zuweisung erstellen (auch für Updates - mehrfach möglich)
            await db.insert(assignments).values({
                companyId: companyId,
                status: isUpdate ? "Re-Importiert" : "Neu Importiert",
                agentId: finalAgentId || null,
                teamId: finalTeamId || null,
                assignedAt: new Date(),
                assignedBy: currentUser.id,
            });

            // 3. Auto-Task erstellen wenn Agent zugewiesen wurde
            if (finalAgentId) {
                await createAutoTask(
                    db,
                    companyId,
                    companyName,
                    finalAgentId,
                    currentUser.id
                );
            }

            // Detailliertes Feedback hinzufügen
            let actionText = "Neu erstellt";
            if (isUpdate) {
                actionText = "Aktualisiert";
            } else if (isNewAssignment) {
                actionText = "Neu zugewiesen";
            }

            results.details.push({
                company: companyName,
                action: actionText,
                contactsAdded: contactsAddedCount,
            });

            results.success++;
        } catch (error: any) {
            console.error("Fehler beim Importieren der Firmengruppe:", error);
            results.failed++;
            results.errors.push(`Import von ${companyKey} fehlgeschlagen: ${error.message}`);
        }
    }

    return results;
});
