import { useDrizzle, sql } from "../../utils/drizzle";

/**
 * DEV ONLY - Clear Database Endpoint
 *
 * This endpoint clears ALL data from all tables while preserving the schema.
 * Includes users deletion (unlike reset-db).
 *
 * Usage: GET /api/dev/clear-db
 *
 * ⚠️ WARNING: Consider disabling this endpoint in production!
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

    console.log("🗑️  Starting database cleanup...");

    try {
        // Delete in reverse order of dependencies (to avoid foreign key constraint errors)

        // 0. Delete tasks (references companies, users)
        const tasksResult = await db.run(sql`DELETE FROM tasks`);
        console.log(`✅ Deleted tasks: ${tasksResult.meta.changes} rows`);

        // 1. Delete activities (references companies, contacts, users)
        const activitiesResult = await db.run(sql`DELETE FROM activities`);
        console.log(`✅ Deleted activities: ${activitiesResult.meta.changes} rows`);

        // 2. Delete assignments (references companies, teams, users)
        const assignmentsResult = await db.run(sql`DELETE FROM assignments`);
        console.log(`✅ Deleted assignments: ${assignmentsResult.meta.changes} rows`);

        // 3. Delete conversation_notes (references companies)
        const notesResult = await db.run(sql`DELETE FROM conversation_notes`);
        console.log(`✅ Deleted conversation notes: ${notesResult.meta.changes} rows`);

        // 4. Delete contacts (references companies)
        const contactsResult = await db.run(sql`DELETE FROM contacts`);
        console.log(`✅ Deleted contacts: ${contactsResult.meta.changes} rows`);

        // 5. Delete companies (no dependencies)
        const companiesResult = await db.run(sql`DELETE FROM companies`);
        console.log(`✅ Deleted companies: ${companiesResult.meta.changes} rows`);

        // 6. Delete team_members (references teams, users)
        const teamMembersResult = await db.run(sql`DELETE FROM team_members`);
        console.log(`✅ Deleted team members: ${teamMembersResult.meta.changes} rows`);

        // 7. Delete teams (references users)
        const teamsResult = await db.run(sql`DELETE FROM teams`);
        console.log(`✅ Deleted teams: ${teamsResult.meta.changes} rows`);

        // 8. Delete users (no dependencies now)
        const usersResult = await db.run(sql`DELETE FROM users`);
        console.log(`✅ Deleted users: ${usersResult.meta.changes} rows`);

        console.log("🎉 Database cleared successfully!");

        return {
            success: true,
            message: "All database tables cleared successfully!",
            deleted: {
                tasks: tasksResult.meta.changes,
                activities: activitiesResult.meta.changes,
                assignments: assignmentsResult.meta.changes,
                conversationNotes: notesResult.meta.changes,
                contacts: contactsResult.meta.changes,
                companies: companiesResult.meta.changes,
                teamMembers: teamMembersResult.meta.changes,
                teams: teamsResult.meta.changes,
                users: usersResult.meta.changes,
            },
        };
    } catch (error: any) {
        console.error("❌ Error clearing database:", error);
        throw createError({
            statusCode: 500,
            statusMessage: `Failed to clear database: ${error.message}`,
        });
    }
});
