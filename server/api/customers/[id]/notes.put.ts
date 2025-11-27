import { conversationNotes } from "../../../database/schema";
import { eq } from "drizzle-orm";
import { useDrizzle } from "../../../utils/drizzle";

export default eventHandler(async (event) => {
    const companyId = parseInt(getRouterParam(event, 'id') || '0');
    const body = await readBody(event);
    const db = useDrizzle();

    if (!companyId) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing company ID",
        });
    }

    // Upsert conversation notes
    // We try to insert, if conflict on companyId, we update.
    await db.insert(conversationNotes)
        .values({
            companyId: companyId,
            conversationHook: body.conversationHook,
            researchResult: body.researchResult,
            updatedAt: new Date(),
        })
        .onConflictDoUpdate({
            target: conversationNotes.companyId,
            set: {
                conversationHook: body.conversationHook,
                researchResult: body.researchResult,
                updatedAt: new Date(),
            }
        });

    return { success: true };
});
