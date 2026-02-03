import { useDrizzle } from "../../utils/drizzle";
import {
  companies,
  contacts,
  assignments,
  conversationNotes,
  activities,
  tasks,
} from "../../database/schema";

/**
 * DEV ONLY - Reset Customers and Tasks Only
 *
 * This endpoint deletes ONLY customers (companies) and tasks data.
 * Teams and Users are preserved.
 *
 * Usage: GET /api/dev/reset-customers-tasks
 *
 * ⚠️ WARNING: DELETE THIS FILE BEFORE DEPLOYING TO PRODUCTION!
 */
export default eventHandler(async (event) => {
  // Production environment check for safety
  /* if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 403,
      statusMessage: "This endpoint is disabled in production"
    });
  } */

  const db = useDrizzle(event);

  try {
    console.log("🗑️ Resetting customers and tasks...");

    // Delete in correct order to respect foreign key constraints
    // Delete children first, parents last

    // 1. Delete activities (references companies)
    await db.delete(activities);
    console.log("✓ Deleted activities");

    // 2. Delete tasks (references companies)
    await db.delete(tasks);
    console.log("✓ Deleted tasks");

    // 3. Delete assignments (references companies)
    await db.delete(assignments);
    console.log("✓ Deleted assignments");

    // 4. Delete conversation notes (references companies)
    await db.delete(conversationNotes);
    console.log("✓ Deleted conversation notes");

    // 5. Delete contacts (references companies)
    await db.delete(contacts);
    console.log("✓ Deleted contacts");

    // 6. Delete companies (parent table)
    await db.delete(companies);
    console.log("✓ Deleted companies");

    console.log("✅ Customers and tasks reset complete!");
    console.log("ℹ️ Teams and Users were NOT deleted.");

    return {
      success: true,
      message: "Customers and tasks reset successfully! Teams and Users are preserved.",
      deleted: {
        activities: true,
        tasks: true,
        assignments: true,
        conversationNotes: true,
        contacts: true,
        companies: true,
        teamMembers: false,
        teams: false,
        users: false,
      },
    };
  } catch (error: any) {
    console.error("❌ Error resetting customers and tasks:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to reset customers and tasks: ${error.message}`,
    });
  }

  // link dafür ist http://localhost:3000/api/dev/reset-customers-tasks
  // fur wrangler: http://127.0.0.1:8787/api/dev/reset-customers-tasks
});
