import { useDrizzle } from "../../utils/drizzle";
import {
  importLogs,
  companies,
  assignments,
  contacts,
  tasks,
  activities,
  conversationNotes,
} from "../../database/schema";
import { sql, inArray, and, gte, lte, eq } from "drizzle-orm";

/**
 * DEV ONLY - Clear All Import Logs Endpoint
 *
 * This endpoint deletes ALL import logs and all related data (companies, contacts, tasks, etc.)
 * that were created through imports.
 *
 * Usage: GET /api/dev/clear-import-logs
 *
 * ⚠️ WARNING: DELETE THIS FILE BEFORE DEPLOYING TO PRODUCTION!
 */
export default eventHandler(async (event) => {
  // Production environment check for safety
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 403,
      statusMessage: "This endpoint is disabled in production"
    });
  }

  const db = useDrizzle(event);

  try {
    console.log("🗑️ Clearing all import logs and related data...");

    // 1. Get all import logs
    const allLogs = await db.select().from(importLogs);
    console.log(`Found ${allLogs.length} import logs`);

    let totalDeletedCompanies = 0;
    let totalDeletedActivities = 0;
    let totalDeletedTasks = 0;
    let totalDeletedConversationNotes = 0;
    let totalDeletedContacts = 0;
    let totalDeletedAssignments = 0;

    // 2. For each import log, find and delete related companies
    for (const log of allLogs) {
      const importStartTime = log.createdAt instanceof Date ? log.createdAt : new Date(log.createdAt);
      const importEndTime = new Date(importStartTime.getTime() + 10000); // 10 seconds tolerance

      // Validate dates
      if (isNaN(importStartTime.getTime()) || isNaN(importEndTime.getTime())) {
        console.warn(`Skipping import log ${log.id} - invalid timestamp`);
        continue;
      }

      // Find assignments created in the same time range by the same user
      const relatedAssignments = await db
        .select()
        .from(assignments)
        .where(
          and(
            gte(assignments.assignedAt, importStartTime),
            lte(assignments.assignedAt, importEndTime),
            eq(assignments.assignedBy, log.importedBy)
          )
        );

      const companyIds = [...new Set(relatedAssignments.map((a: { companyId: number }) => a.companyId))] as number[];

      if (companyIds.length > 0) {
        // Delete related data (cascade order)
        await db.delete(activities).where(inArray(activities.companyId, companyIds));
        totalDeletedActivities += companyIds.length; // Approximate count

        await db.delete(tasks).where(inArray(tasks.companyId, companyIds));
        totalDeletedTasks += companyIds.length; // Approximate count

        await db.delete(conversationNotes).where(inArray(conversationNotes.companyId, companyIds));
        totalDeletedConversationNotes += companyIds.length; // Approximate count

        await db.delete(contacts).where(inArray(contacts.companyId, companyIds));
        totalDeletedContacts += companyIds.length; // Approximate count

        await db.delete(assignments).where(inArray(assignments.companyId, companyIds));
        totalDeletedAssignments += companyIds.length; // Approximate count

        await db.delete(companies).where(inArray(companies.id, companyIds));
        totalDeletedCompanies += companyIds.length;
      }
    }

    // 3. Delete all import logs
    await db.delete(importLogs);
    console.log(`✓ Deleted ${allLogs.length} import logs`);

    console.log("✅ Import logs and related data cleared!");

    return {
      success: true,
      message: "All import logs and related data cleared successfully!",
      deleted: {
        importLogs: allLogs.length,
        companies: totalDeletedCompanies,
        activities: totalDeletedActivities,
        tasks: totalDeletedTasks,
        conversationNotes: totalDeletedConversationNotes,
        contacts: totalDeletedContacts,
        assignments: totalDeletedAssignments,
      },
    };
  } catch (error: any) {
    console.error("❌ Error clearing import logs:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to clear import logs: ${error.message}`,
    });
  }

  // Usage: GET http://localhost:3000/api/dev/clear-import-logs
  // For wrangler: GET http://127.0.0.1:8787/api/dev/clear-import-logs
});
