import { conversationNotes, companyChangeLog } from "../../../database/schema";
import { eq } from "drizzle-orm";
import { useDrizzle } from "../../../utils/drizzle";
import { createAuth } from "../../../lib/auth";

export default eventHandler(async (event) => {
    const companyId = parseInt(getRouterParam(event, "id") || "0", 10);
    const body = await readBody(event);
    const db = useDrizzle(event);

    if (!companyId || Number.isNaN(companyId)) {
        throw createError({ statusCode: 400, statusMessage: "Missing company ID" });
    }

    const auth = createAuth(event);
    const session = await auth.api.getSession({ headers: event.headers });
    const userId = session?.user?.id ?? null;

    const existing = await db.query.conversationNotes.findFirst({
        where: eq(conversationNotes.companyId, companyId),
        columns: { conversationHook: true, researchResult: true },
    });

    await db
        .insert(conversationNotes)
        .values({
            companyId,
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
            },
        });

    const changed =
        (existing?.conversationHook !== (body.conversationHook ?? "")) ||
        (existing?.researchResult !== (body.researchResult ?? ""));
    if (changed) {
        await db.insert(companyChangeLog).values({
            companyId,
            entityType: "notes",
            action: existing ? "updated" : "created",
            label: existing ? "Notiz aktualisiert" : "Notiz angelegt",
            userId,
            createdAt: new Date(),
        });
    }
    return { success: true };
});
