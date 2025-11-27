import { companies } from "../../database/schema";
import { eq } from "drizzle-orm";
import { useDrizzle } from "../../utils/drizzle";

export default eventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    const body = await readBody(event);
    const db = useDrizzle();

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing customer ID",
        });
    }

    // Update company info
    const updatedCompany = await db.update(companies)
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
        .where(eq(companies.id, parseInt(id)))
        .returning()
        .get();

    return updatedCompany;
});
