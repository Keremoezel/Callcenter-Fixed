import { useDrizzle } from "../../../utils/drizzle";
import { importLogs, companies, assignments, contacts, tasks, activities, conversationNotes } from "../../../database/schema";
import { createAuth } from "../../../lib/auth";
import { eq, sql, inArray, and, gte, lte } from "drizzle-orm";

export default eventHandler(async (event) => {
    // 1. Authentifizierung
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

    // 2. Nur Admin kann Import Logs löschen
    if (role !== "Admin") {
        throw createError({
            statusCode: 403,
            statusMessage: "Verboten: Nur Administratoren können Import-Logs löschen.",
        });
    }

    const db = useDrizzle(event);
    const logId = parseInt(getRouterParam(event, "id") || "0");

    if (!logId || isNaN(logId)) {
        throw createError({
            statusCode: 400,
            statusMessage: "Ungültige Import-Log-ID",
        });
    }

    // 3. Import Log abrufen
    const log = await db.query.importLogs.findFirst({
        where: eq(importLogs.id, logId),
    });

    if (!log) {
        throw createError({
            statusCode: 404,
            statusMessage: "Import-Log nicht gefunden",
        });
    }

    // 4. Find all companies belonging to this import
    // Use the import log's createdAt time to find companies created around that time
    let importStartTime: Date;

    if (log.createdAt instanceof Date) {
        importStartTime = log.createdAt;
    } else if (typeof log.createdAt === 'number') {
        importStartTime = new Date(log.createdAt);
    } else if (typeof log.createdAt === 'string') {
        importStartTime = new Date(log.createdAt);
    } else {
        // If createdAt is null or invalid, skip company deletion but still delete the log
        console.warn(`Import log ${logId} has invalid createdAt, skipping company deletion`);
        await db.delete(importLogs).where(eq(importLogs.id, logId));
        return {
            success: true,
            message: "Import-Log gelöscht (keine zugehörigen Firmen gefunden - ungültiger Timestamp)",
            deletedCompanies: 0,
        };
    }

    // Import log is created AFTER all batches complete, so look backward
    const importEndTime = importStartTime;
    const importStartWindow = new Date(importStartTime.getTime() - 300000); // Look back 5 minutes for batched imports

    // Validate dates
    if (isNaN(importStartWindow.getTime()) || isNaN(importEndTime.getTime())) {
        // If dates are invalid, skip company deletion but still delete the log
        console.warn(`Import log ${logId} has invalid timestamp, skipping company deletion`);
        await db.delete(importLogs).where(eq(importLogs.id, logId));
        return {
            success: true,
            message: "Import-Log gelöscht (keine zugehörigen Firmen gefunden - ungültiger Timestamp)",
            deletedCompanies: 0,
        };
    }

    // Find assignments created in the same time range by the same user
    // Use the import log's createdAt time and importedBy information to find assignments
    const relatedAssignments = await db
        .select()
        .from(assignments)
        .where(
            and(
                gte(assignments.assignedAt, importStartWindow),
                lte(assignments.assignedAt, importEndTime),
                eq(assignments.assignedBy, log.importedBy)
            )
        );

    const companyIds = [...new Set(relatedAssignments.map((a: { companyId: number }) => a.companyId))] as number[];

    let deletedCount = 0;

    if (companyIds.length > 0) {
        // 5. Delete related data (cascade order)

        // 5.1. Delete activities
        await db.delete(activities).where(inArray(activities.companyId, companyIds as number[]));

        // 5.2. Delete tasks
        await db.delete(tasks).where(inArray(tasks.companyId, companyIds as number[]));

        // 5.3. Delete conversation notes
        await db.delete(conversationNotes).where(inArray(conversationNotes.companyId, companyIds as number[]));

        // 5.4. Delete contacts
        await db.delete(contacts).where(inArray(contacts.companyId, companyIds as number[]));

        // 5.5. Delete assignments
        await db.delete(assignments).where(inArray(assignments.companyId, companyIds as number[]));

        // 5.6. Delete companies
        await db.delete(companies).where(inArray(companies.id, companyIds as number[]));

        deletedCount = companyIds.length;
    }

    // 6. Delete import log
    await db.delete(importLogs).where(eq(importLogs.id, logId));

    return {
        success: true,
        message: `Import-Log und ${deletedCount} zugehörige Firmen erfolgreich gelöscht`,
        deletedCompanies: deletedCount,
    };
});
