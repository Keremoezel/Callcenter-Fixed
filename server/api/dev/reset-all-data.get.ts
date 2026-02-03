import { useDrizzle } from "../../utils/drizzle";
import {
  activities,
  tasks,
  assignments,
  conversationNotes,
  contacts,
  companies,
  teamMembers,
  teams,
  sessions,
  account,
  verification,
  users,
} from "../../database/schema";

/**
 * Development endpoint: Reset ALL data (keep table structure)
 * URL: http://127.0.0.1:8787/api/dev/reset-all-data
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
    console.log("🗑️ Resetting ALL data...");

    // Delete in correct order (to avoid foreign key constraints)
    await db.delete(activities);
    await db.delete(tasks);
    await db.delete(assignments);
    await db.delete(conversationNotes);
    await db.delete(contacts);
    await db.delete(companies);

    await db.delete(teamMembers);
    await db.delete(teams);

    await db.delete(sessions);
    await db.delete(account);
    await db.delete(verification);
    await db.delete(users);

    console.log("✅ All data deleted!");
    console.log("ℹ️ Table structures are intact.");

    return {
      success: true,
      message: "All data has been reset successfully! Tables are intact.",
    };
  } catch (error: any) {
    console.error("❌ Error resetting data:", error);
    return {
      success: false,
      message: "Failed to reset data.",
      error: error.message,
    };
  }
});
