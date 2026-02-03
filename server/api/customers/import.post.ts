import { useDrizzle } from "../../utils/drizzle";
import { companies, contacts, assignments, conversationNotes, users, teams, teamMembers, importLogs } from "../../database/schema";
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
    const { customers, targetTeamId, targetAgentId, projectName } = body;

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
        assigned: 0, // New assignments count
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

    // Helper function to parse employee count from "Staffel" format (e.g., "21 - 50" -> 35)
    const parseEmployeeCount = (value: any): number => {
        if (!value) return 0;
        const str = value.toString();
        // If it's already a number, return it
        if (!isNaN(parseFloat(str))) return parseInt(str);
        // If it's in "X - Y" format, take the middle value
        const match = str.match(/(\d+)\s*-\s*(\d+)/);
        if (match) {
            const min = parseInt(match[1]);
            const max = parseInt(match[2]);
            return Math.floor((min + max) / 2);
        }
        return 0;
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
                        industry: companyData["Branche-Text-1"] || companyData.Branche || companyData.industry,
                        website: companyData.Webseite || companyData.website,
                        phone: companyData.Telefon || companyData.phone || companyData.phoneNumber,
                        email: companyData["E-Mail-büro"] || companyData.Email || companyData.email,
                        street: companyData["STR. HNR"] || companyData.Straße || companyData.street || companyData.streetAddress,
                        postalCode: companyData.Plz || companyData.PLZ || companyData.postalCode,
                        city: companyData.Ort || companyData.Stadt || companyData.city,
                        state: companyData["Bundesland / Bezirk"] || companyData.Bundesland || companyData.state,
                        employeeCount: parseEmployeeCount(companyData["Mitarbeiter (Staffel)"] || companyData.Mitarbeiter || companyData.employeeCount),
                        revenueSize: companyData["Umsatz (Staffel)"] || mapRevenueToRange(companyData.Umsatz || companyData.revenueSize),
                        legalForm: companyData.Rechtsform || companyData.companyForm,
                        description: companyData.Gegenstand || companyData.Beschreibung || companyData.description,
                        foundingDate: companyData.Gründung || companyData.foundingDate,
                        project: projectName || companyData.Projekt || companyData.project,
                        openingHours: companyData.Öffnungszeiten || companyData.openingHours,
                        updatedAt: new Date(),
                    })
                    .where(eq(companies.id, companyId));

                // Existierende Kontakte abrufen
                const existingContacts = await db
                    .select()
                    .from(contacts)
                    .where(eq(contacts.companyId, companyId));

                // Neue Kontakte batch-insert (N+1 önleme)
                const contactValues: Array<Record<string, unknown>> = [];
                let isFirst = existingContacts.length === 0;
                for (const row of rows) {
                    if (row["Person-Vorname"] || row.Vorname || row.firstName || row.Ansprechpartner) {
                        const role = row["Person-Funktion"] || row.Position || row.position;
                        const activity = row["Person-Tätigkeit"];
                        const combinedPosition = role && activity ? `${role} – ${activity}` : role || activity || null;
                        contactValues.push({
                            companyId: companyId,
                            firstName: row["Person-Vorname"] || row.Vorname || row.firstName || row.Ansprechpartner || "Unbekannt",
                            lastName: row["Person-Nachname"] || row.Nachname || row.lastName || "",
                            email: row["Person-E-Mail"] || row.KontaktEmail || row.contactEmail || row.Email || "",
                            phone: row["Person-Telefon"] || row.KontaktTelefon || row.contactPhone || row.Telefon || "",
                            position: combinedPosition,
                            isPrimary: isFirst,
                            birthDate: row["Person-Geboren"] || row.Geburtsdatum || row.birthDate,
                            linkedin: row["Person-LinkedIn"] || row.LinkedIn || row.linkedin,
                            xing: row["Person-Xing"] || row.Xing || row.xing,
                            facebook: row.Facebook || row.facebook,
                        });
                        isFirst = false;
                        contactsAddedCount++;
                    }
                }
                if (contactValues.length > 0) {
                    await db.insert(contacts).values(contactValues as any);
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
                        industry: companyData["Branche-Text-1"] || companyData.Branche || companyData.industry,
                        website: companyData.Webseite || companyData.website,
                        phone: companyData.Telefon || companyData.phone || companyData.phoneNumber,
                        email: companyData["E-Mail-büro"] || companyData.Email || companyData.email,
                        street: companyData["STR. HNR"] || companyData.Straße || companyData.street || companyData.streetAddress,
                        postalCode: companyData.Plz || companyData.PLZ || companyData.postalCode,
                        city: companyData.Ort || companyData.Stadt || companyData.city,
                        state: companyData["Bundesland / Bezirk"] || companyData.Bundesland || companyData.state,
                        employeeCount: parseEmployeeCount(companyData["Mitarbeiter (Staffel)"] || companyData.Mitarbeiter || companyData.employeeCount),
                        revenueSize: companyData["Umsatz (Staffel)"] || mapRevenueToRange(companyData.Umsatz || companyData.revenueSize),
                        legalForm: companyData.Rechtsform || companyData.companyForm,
                        description: companyData.Gegenstand || companyData.Beschreibung || companyData.description,
                        foundingDate: companyData.Gründung || companyData.foundingDate,
                        project: projectName || companyData.Projekt || companyData.project,
                        openingHours: companyData.Öffnungszeiten || companyData.openingHours,
                    })
                    .returning()
                    .get();

                if (!newCompany) {
                    throw new Error("Fehler beim Erstellen der Firma");
                }

                companyId = newCompany.id;

                // Kontakte batch-insert (N+1 önleme)
                const newContactValues: Array<Record<string, unknown>> = [];
                rows.forEach((row, index) => {
                    if (row["Person-Vorname"] || row.Vorname || row.firstName || row.Ansprechpartner) {
                        const role = row["Person-Funktion"] || row.Position || row.position;
                        const activity = row["Person-Tätigkeit"];
                        const combinedPosition = role && activity ? `${role} – ${activity}` : role || activity || null;
                        newContactValues.push({
                            companyId: companyId,
                            firstName: row["Person-Vorname"] || row.Vorname || row.firstName || row.Ansprechpartner || "Unbekannt",
                            lastName: row["Person-Nachname"] || row.Nachname || row.lastName || "",
                            email: row["Person-E-Mail"] || row.KontaktEmail || row.contactEmail || row.Email || "",
                            phone: row["Person-Telefon"] || row.KontaktTelefon || row.contactPhone || row.Telefon || "",
                            position: combinedPosition,
                            isPrimary: index === 0,
                            birthDate: row["Person-Geboren"] || row.Geburtsdatum || row.birthDate,
                            linkedin: row["Person-LinkedIn"] || row.LinkedIn || row.linkedin,
                            xing: row["Person-Xing"] || row.Xing || row.xing,
                            facebook: row.Facebook || row.facebook,
                        });
                        contactsAddedCount++;
                    }
                });
                if (newContactValues.length > 0) {
                    await db.insert(contacts).values(newContactValues as any);
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
            
            // Count new assignments
            if (isNewAssignment) {
                results.assigned++;
            }

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

    // Save import log
    try {
        await db.insert(importLogs).values({
            importedBy: currentUser.id,
            projectName: projectName || null,
            targetTeamId: finalTeamId,
            targetAgentId: finalAgentId,
            totalRows: customers.length,
            successCount: results.success,
            failedCount: results.failed,
            createdCount: results.created,
            updatedCount: results.updated,
            assignedCount: results.assigned,
        });
    } catch (logError) {
        console.error("Fehler beim Speichern des Import-Logs:", logError);
        // Don't fail the import if log fails
    }

    return results;
});
