import { useDrizzle } from "../../utils/drizzle";
import { companies, contacts, assignments, conversationNotes, users } from "../../database/schema";
import { eq } from "drizzle-orm";


//import funktion
export default eventHandler(async (event) => {
    const body = await readBody(event);
    const { customers } = body;

    if (!customers || !Array.isArray(customers)) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid data format. Expected an array of customers.",
        });
    }

    const db = useDrizzle(event);
    const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
    };

    // Helper function to map revenue to range
    const mapRevenueToRange = (revenue: any): string => {
        if (!revenue) return "";
        // If it's already a string that looks like a range (contains '-'), return it
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

    // GROUP ROWS BY COMPANY NAME
    // This allows multiple rows with the same company to create one company with multiple contacts
    const companyGroups = new Map<string, any[]>();

    for (const row of customers) {
        const companyName = row.Firma || row.name || row.companyName;

        // Skip rows without company name
        if (!companyName) {
            results.failed++;
            results.errors.push("Missing company name for a row");
            continue;
        }

        // Normalize company name for grouping (lowercase, trim whitespace)
        const companyKey = companyName.toLowerCase().trim();

        if (!companyGroups.has(companyKey)) {
            companyGroups.set(companyKey, []);
        }

        companyGroups.get(companyKey)!.push(row);
    }

    // PROCESS EACH COMPANY GROUP
    for (const [companyKey, rows] of companyGroups) {
        try {
            // Use first row for company data
            const companyData = rows[0];
            const companyName = companyData.Firma || companyData.name || companyData.companyName;

            // 1. Insert Company (once per group)
            const newCompany = await db.insert(companies).values({
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
            }).returning().get();

            if (!newCompany) {
                throw new Error("Failed to create company");
            }

            // 2. Insert ALL contacts from ALL rows in this group
            let contactsCreated = 0;
            for (const [index, row] of rows.entries()) {
                // Check if this row has contact information
                if (row.Vorname || row.firstName || row.Ansprechpartner) {
                    await db.insert(contacts).values({
                        companyId: newCompany.id,
                        firstName: row.Vorname || row.firstName || row.Ansprechpartner || "Unknown",
                        lastName: row.Nachname || row.lastName || "",
                        email: row.KontaktEmail || row.contactEmail || row.Email || "",
                        phone: row.KontaktTelefon || row.contactPhone || row.Telefon || "",
                        position: row.Position || row.position,
                        isPrimary: index === 0, // First contact is primary
                        birthDate: row.Geburtsdatum || row.birthDate,
                        linkedin: row.LinkedIn || row.linkedin,
                        xing: row.Xing || row.xing,
                        facebook: row.Facebook || row.facebook,
                    });
                    contactsCreated++;
                }
            }

            // 3. Create Empty Conversation Note
            await db.insert(conversationNotes).values({
                companyId: newCompany.id,
                conversationHook: "",
                researchResult: "",
            });

            // 4. Create Initial Assignment
            await db.insert(assignments).values({
                companyId: newCompany.id,
                status: "Neu Importiert",
                agentId: null,
                assignedAt: new Date(),
            });

            results.success++;
        } catch (error: any) {
            console.error("Error importing company group:", error);
            results.failed++;
            results.errors.push(`Failed to import ${companyKey}: ${error.message}`);
        }
    }

    return results;
});
