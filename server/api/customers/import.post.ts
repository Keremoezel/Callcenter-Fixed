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

    const db = useDrizzle();
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

    for (const customerData of customers) {
        try {
            // Basic validation
            if (!customerData.Firma && !customerData.name && !customerData.companyName) {
                results.failed++;
                results.errors.push("Missing company name for a row");
                continue;
            }

            const companyName = customerData.Firma || customerData.name || customerData.companyName;

            // 1. Insert Company
            const newCompany = await db.insert(companies).values({
                name: companyName,
                industry: customerData.Branche || customerData.industry,
                website: customerData.Webseite || customerData.website,
                phone: customerData.Telefon || customerData.phone || customerData.phoneNumber,
                email: customerData.Email || customerData.email,
                street: customerData.Straße || customerData.street || customerData.streetAddress,
                postalCode: customerData.PLZ || customerData.postalCode,
                city: customerData.Stadt || customerData.Ort || customerData.city,
                state: customerData.Bundesland || customerData.state,
                employeeCount: parseInt(customerData.Mitarbeiter || customerData.employeeCount) || 0,
                revenueSize: mapRevenueToRange(customerData.Umsatz || customerData.revenueSize),
                legalForm: customerData.Rechtsform || customerData.companyForm,
                description: customerData.Beschreibung || customerData.description,
                foundingDate: customerData.Gründung || customerData.foundingDate,
                project: customerData.Projekt || customerData.project,
                openingHours: customerData.Öffnungszeiten || customerData.openingHours,
            }).returning().get();

            if (!newCompany) {
                throw new Error("Failed to create company");
            }

            // 2. Insert Primary Contact (if data exists)
            if (customerData.Vorname || customerData.firstName || customerData.Ansprechpartner) {
                await db.insert(contacts).values({
                    companyId: newCompany.id,
                    firstName: customerData.Vorname || customerData.firstName || customerData.Ansprechpartner || "Unknown",
                    lastName: customerData.Nachname || customerData.lastName || "",
                    email: customerData.KontaktEmail || customerData.contactEmail || customerData.Email || "", // Fallback to company email
                    phone: customerData.KontaktTelefon || customerData.contactPhone || customerData.Telefon || "", // Fallback to company phone
                    position: customerData.Position || customerData.position,
                    isPrimary: true,
                    birthDate: customerData.Geburtsdatum || customerData.birthDate,
                    linkedin: customerData.LinkedIn || customerData.linkedin,
                    xing: customerData.Xing || customerData.xing,
                    facebook: customerData.Facebook || customerData.facebook,
                });
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
            console.error("Error importing customer:", error);
            results.failed++;
            results.errors.push(`Failed to import ${customerData.Firma || 'unknown'}: ${error.message}`);
        }
    }

    return results;
});
