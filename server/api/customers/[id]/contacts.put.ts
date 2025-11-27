import { contacts } from "../../../database/schema";
import { eq, and, notInArray } from "drizzle-orm";
import { useDrizzle } from "../../../utils/drizzle";

export default eventHandler(async (event) => {
    const companyId = parseInt(getRouterParam(event, 'id') || '0');
    const body = await readBody(event); // Expects array of contacts
    const db = useDrizzle();

    if (!companyId) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing company ID",
        });
    }

    const incomingContacts = body;
    //console.log('Incoming contacts for update:', incomingContacts);

    const incomingIds = incomingContacts
        .filter((c: any) => c.id)
        .map((c: any) => parseInt(c.id)); // Ensure number

    //console.log('Incoming IDs:', incomingIds);

    // 1. Delete contacts that are not in the incoming list
    if (incomingIds.length > 0) {
        await db.delete(contacts)
            .where(and(
                eq(contacts.companyId, companyId),
                notInArray(contacts.id, incomingIds)
            ));
    } else {
        // If no IDs provided, it means all existing contacts should be deleted (or it's a fresh set of new contacts)
        // But we should be careful. If the array is empty, we delete all?
        // The UI validation ensures at least one primary contact, so array won't be empty.
        // However, if all are new (no IDs), we delete all existing.
        await db.delete(contacts).where(eq(contacts.companyId, companyId));
    }

    // 2. Upsert (Update existing, Insert new)
    for (const contact of incomingContacts) {
        const contactData = {
            companyId: companyId,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phoneNumber, // UI uses phoneNumber, DB uses phone
            position: contact.position,
            birthDate: contact.birthDate,
            isPrimary: contact.isPrimary,
            linkedin: contact.social?.linkedin,
            xing: contact.social?.xing,
            facebook: contact.social?.facebook,
            notes: contact.notizen, // Map frontend 'notizen' to DB 'notes'
        };

        if (contact.id) {
            // Update
            await db.update(contacts)
                .set(contactData)
                .where(and(eq(contacts.id, contact.id), eq(contacts.companyId, companyId)));
        } else {
            // Insert
            await db.insert(contacts).values(contactData);
        }
    }

    return { success: true };
});
