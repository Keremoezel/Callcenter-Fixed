import { contacts } from "../../../database/schema";
import { eq, and, notInArray } from "drizzle-orm";
import { useDrizzle } from "../../../utils/drizzle";
import { createAuth } from "../../../lib/auth";

export default eventHandler(async (event) => {
    // Auth check - require authenticated user
    const auth = createAuth(event);
    const session = await auth.api.getSession({ headers: event.headers });
    if (!session?.user) {
        throw createError({ statusCode: 401, statusMessage: "Nicht autorisiert" });
    }

    const companyId = parseInt(getRouterParam(event, 'id') || '0');
    const body = await readBody(event); // Expects array of contacts
    const db = useDrizzle(event);

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

    // 2. Upsert (Update existing, Insert new) – Batch insert für neue Kontakte
    // Using type from contacts schema for proper typing
    type ContactData = typeof contacts.$inferInsert;

    const toUpdate: Array<{ id: number; data: Partial<ContactData> }> = [];
    const toInsert: Omit<ContactData, 'id'>[] = [];

    for (const contact of incomingContacts) {
        const contactData: Omit<ContactData, 'id'> = {
            companyId: companyId,
            firstName: contact.firstName ?? "",
            lastName: contact.lastName ?? undefined,
            email: contact.email ?? undefined,
            phone: contact.phoneNumber ?? undefined,
            position: contact.position ?? undefined,
            birthDate: contact.birthDate ?? undefined,
            isPrimary: contact.isPrimary ?? undefined,
            linkedin: contact.social?.linkedin ?? undefined,
            xing: contact.social?.xing ?? undefined,
            facebook: contact.social?.facebook ?? undefined,
            notes: contact.notizen ?? undefined,
        };
        if (contact.id) {
            toUpdate.push({ id: parseInt(contact.id, 10), data: contactData });
        } else {
            toInsert.push(contactData);
        }
    }

    // Update existing contacts (N+1 leider unvermeidbar bei individuellen Updates)
    for (const { id, data } of toUpdate) {
        await db.update(contacts)
            .set(data)
            .where(and(eq(contacts.id, id), eq(contacts.companyId, companyId)));
    }

    // Batch insert new contacts
    if (toInsert.length > 0) {
        await db.insert(contacts).values(toInsert);
    }

    return { success: true };
});
