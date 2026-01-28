import { useDrizzle } from "../../utils/drizzle";
import {
  companies,
  contacts,
  assignments,
  conversationNotes,
  activities,
  tasks,
  teamMembers,
  teams,
  users,
} from "../../database/schema";
import { sql } from "drizzle-orm";

/**
 * DEV ONLY - Database Reset Endpoint
 *
 * This endpoint clears ALL data from the database while preserving the schema.
 *
 * Usage: GET /api/dev/reset-db
 *
 * ⚠️ WARNING: DELETE THIS FILE BEFORE DEPLOYING TO PRODUCTION!
 */
export default eventHandler(async (event) => {
  // Optional: Add environment check for extra safety
  // if (process.env.NODE_ENV === 'production') {
  //   throw createError({
  //     statusCode: 403,
  //     statusMessage: "This endpoint is disabled in production"
  //   });
  // }

  const db = useDrizzle(event);

  try {
    // Delete in correct order to respect foreign key constraints
    // Delete children first, parents last

    console.log("🗑️ Resetting database...");

    // 1. Delete activities (references companies, contacts, users)
    await db.delete(activities);
    console.log("✓ Deleted activities");

    // 2. Delete tasks (references companies, users)
    await db.delete(tasks);
    console.log("✓ Deleted tasks");

    // 3. Delete assignments (references companies, teams, users)
    await db.delete(assignments);
    console.log("✓ Deleted assignments");

    // 4. Delete conversation notes (references companies, users)
    await db.delete(conversationNotes);
    console.log("✓ Deleted conversation notes");

    // 5. Delete contacts (references companies)
    await db.delete(contacts);
    console.log("✓ Deleted contacts");

    // 6. Delete companies (parent table)
    await db.delete(companies);
    console.log("✓ Deleted companies");

    // 7. Delete team members (references teams, users)
    await db.delete(teamMembers);
    console.log("✓ Deleted team members");

    // 8. Delete teams (references users)
    await db.delete(teams);
    console.log("✓ Deleted teams");

    // 9. Delete users (parent table) - OPTIONAL: Comment this out if you want to keep users
    // await db.delete(users);
    // console.log("✓ Deleted users");

    console.log("✅ Database reset complete!");

    return {
      success: true,
      message: "Database reset successfully! All data has been cleared.",
      deleted: {
        activities: true,
        tasks: true,
        assignments: true,
        conversationNotes: true,
        contacts: true,
        companies: true,
        teamMembers: true,
        teams: true,
        users: false, // Set to true if you uncommented the users deletion
      },
    };
  } catch (error: any) {
    console.error("❌ Error resetting database:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to reset database: ${error.message}`,
    });
  }
});
