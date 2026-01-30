import { companies, companyChangeLog } from "../../database/schema";
import { eq } from "drizzle-orm";
import { useDrizzle } from "../../utils/drizzle";
import { createAuth } from "../../lib/auth";

const FIELD_LABELS: Record<string, string> = {
    name: "Kundenname",
    legalForm: "Rechtsform",
    industry: "Branche",
    employeeCount: "Mitarbeiteranzahl",
    website: "Webseite",
    phone: "Telefon",
    email: "E-Mail",
    openingHours: "Öffnungszeiten",
    revenueSize: "Umsatz",
    street: "Straße",
    postalCode: "PLZ",
    city: "Stadt",
    state: "Bundesland",
    foundingDate: "Gründungsdatum",
    description: "Beschreibung",
};

export default eventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    let body: Record<string, unknown> = {};
    try {
        body = (await readBody(event)) as Record<string, unknown> || {};
    } catch {
        throw createError({ statusCode: 400, statusMessage: "Invalid request body" });
    }
    const db = useDrizzle(event);

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: "Missing customer ID" });
    }
    const companyId = parseInt(id, 10);
    if (Number.isNaN(companyId)) {
        throw createError({ statusCode: 400, statusMessage: "Invalid customer ID" });
    }

    let userId: string | null = null;
    try {
        const auth = createAuth(event);
        const session = await auth.api.getSession({ headers: event.headers });
        userId = session?.user?.id ?? null;
    } catch {
        // Auth not configured (e.g. preview env) – continue without userId
    }

    const oldRow = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
        columns: {
            name: true,
            legalForm: true,
            industry: true,
            employeeCount: true,
            website: true,
            phone: true,
            email: true,
            openingHours: true,
            revenueSize: true,
            street: true,
            postalCode: true,
            city: true,
            state: true,
            foundingDate: true,
            description: true,
        },
    });
    if (!oldRow) {
        throw createError({ statusCode: 404, statusMessage: "Customer not found" });
    }

    const name = String(body.companyName ?? oldRow.name ?? "");
    const legalForm = String(body.companyForm ?? oldRow.legalForm ?? "");
    const industry = String(body.industry ?? oldRow.industry ?? "");
    const employeeCount = typeof body.employeeCount === "number" ? body.employeeCount : parseInt(String(body.employeeCount || oldRow.employeeCount || 0), 10) || 0;
    const website = String(body.website ?? oldRow.website ?? "");
    const phone = String(body.phoneNumber ?? body.phone ?? oldRow.phone ?? "");
    const email = String(body.email ?? oldRow.email ?? "");
    const openingHours = String(body.openingHours ?? oldRow.openingHours ?? "");
    const revenueSize = String(body.revenueSize ?? oldRow.revenueSize ?? "");
    const street = String(body.streetAddress ?? body.street ?? oldRow.street ?? "");
    const postalCode = String(body.postalCode ?? oldRow.postalCode ?? "");
    const city = String(body.city ?? oldRow.city ?? "");
    const state = String(body.state ?? oldRow.state ?? "");
    const foundingDate = String(body.foundingDate ?? oldRow.foundingDate ?? "");
    const description = String(body.description ?? oldRow.description ?? "");

    const updatedCompany = await db
        .update(companies)
        .set({
            name,
            legalForm,
            industry,
            employeeCount,
            website,
            phone,
            email,
            openingHours,
            revenueSize,
            street,
            postalCode,
            city,
            state,
            foundingDate,
            description,
            updatedAt: new Date(),
        })
        .where(eq(companies.id, companyId))
        .returning()
        .get();

    const bodyMap: Record<string, string | number> = {
        name,
        legalForm,
        industry,
        employeeCount,
        website,
        phone,
        email,
        openingHours,
        revenueSize,
        street,
        postalCode,
        city,
        state,
        foundingDate,
        description,
    };
    try {
        for (const [field, label] of Object.entries(FIELD_LABELS)) {
            const oldVal = String((oldRow as Record<string, unknown>)[field] ?? "");
            const newVal = String(bodyMap[field] ?? "");
            if (oldVal !== newVal) {
                await db.insert(companyChangeLog).values({
                    companyId,
                    entityType: "company",
                    action: "updated",
                    label: `${label} geändert`,
                    oldValue: oldVal || null,
                    newValue: newVal || null,
                    userId,
                    createdAt: new Date(),
                });
            }
        }
    } catch (logErr) {
        // Change log insert failed (e.g. table missing on preview) – still return success
        console.error("Change log insert failed:", logErr);
    }
    return updatedCompany;
});
