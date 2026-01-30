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
    const body = await readBody(event);
    const db = useDrizzle(event);

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: "Missing customer ID" });
    }
    const companyId = parseInt(id, 10);
    if (Number.isNaN(companyId)) {
        throw createError({ statusCode: 400, statusMessage: "Invalid customer ID" });
    }

    const auth = createAuth(event);
    const session = await auth.api.getSession({ headers: event.headers });
    const userId = session?.user?.id ?? null;

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

    const updatedCompany = await db
        .update(companies)
        .set({
            name: body.companyName,
            legalForm: body.companyForm,
            industry: body.industry,
            employeeCount: parseInt(body.employeeCount) || 0,
            website: body.website,
            phone: body.phoneNumber,
            email: body.email,
            openingHours: body.openingHours,
            revenueSize: body.revenueSize,
            street: body.streetAddress,
            postalCode: body.postalCode,
            city: body.city,
            state: body.state,
            foundingDate: body.foundingDate,
            description: body.description,
            updatedAt: new Date(),
        })
        .where(eq(companies.id, companyId))
        .returning()
        .get();

    const bodyMap: Record<string, string | number> = {
        name: body.companyName ?? "",
        legalForm: body.companyForm ?? "",
        industry: body.industry ?? "",
        employeeCount: parseInt(body.employeeCount) || 0,
        website: body.website ?? "",
        phone: body.phoneNumber ?? "",
        email: body.email ?? "",
        openingHours: body.openingHours ?? "",
        revenueSize: body.revenueSize ?? "",
        street: body.streetAddress ?? "",
        postalCode: body.postalCode ?? "",
        city: body.city ?? "",
        state: body.state ?? "",
        foundingDate: body.foundingDate ?? "",
        description: body.description ?? "",
    };
    for (const [field, label] of Object.entries(FIELD_LABELS)) {
        const oldVal = String((oldRow as any)[field] ?? "");
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
    return updatedCompany;
});
