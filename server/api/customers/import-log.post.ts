import { useDrizzle } from "../../utils/drizzle";
import { importLogs } from "../../database/schema";
import { createAuth } from "../../lib/auth";

/**
 * POST /api/customers/import-log
 * Create a consolidated import log entry after batch processing
 * Admin/Teamlead only
 */
export default eventHandler(async (event) => {
    // 1. Authentication
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

    // 2. Authorization: only Admin/Teamlead can import
    if (role === "Agent") {
        throw createError({
            statusCode: 403,
            statusMessage: "Verboten: Agenten können keine Kunden importieren.",
        });
    }

    const body = await readBody(event);
    const {
        targetTeamId,
        targetAgentId,
        projectName,
        totalRows,
        successCount,
        failedCount,
        createdCount,
        updatedCount,
        assignedCount
    } = body;

    const db = useDrizzle(event);
    const finalTeamId = targetTeamId ? Number(targetTeamId) : undefined;

    // Save consolidated import log
    try {
        await db.insert(importLogs).values({
            importedBy: currentUser.id,
            projectName: projectName || undefined,
            targetTeamId: finalTeamId,
            targetAgentId: targetAgentId || undefined,
            totalRows: totalRows || 0,
            successCount: successCount || 0,
            failedCount: failedCount || 0,
            createdCount: createdCount || 0,
            updatedCount: updatedCount || 0,
            assignedCount: assignedCount || 0,
        });

        return { success: true };
    } catch (logError) {
        console.error("Fehler beim Speichern des Import-Logs:", logError);
        throw createError({
            statusCode: 500,
            statusMessage: "Fehler beim Speichern des Import-Logs",
        });
    }
});
