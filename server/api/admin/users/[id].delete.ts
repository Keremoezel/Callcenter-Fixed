import { useDrizzle } from "../../../utils/drizzle";
import { users, sessions, account } from "../../../database/schema";
import { eq } from "drizzle-orm";
import { createAuth } from "../../../lib/auth";

/**
 * DELETE /api/admin/users/:id
 * Delete a user (admin only)
 */
export default eventHandler(async (event) => {
    const userId = getRouterParam(event, "id");

    if (!userId) {
        throw createError({
            statusCode: 400,
            statusMessage: "User ID is required",
        });
    }

    // Check if user is authenticated and is admin
    const auth = createAuth(event);
    const currentSession = await auth.api.getSession({ headers: event.headers });

    if (!currentSession?.user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    // Check admin or teamlead role
    const userRole = (currentSession.user as any).role;
    if (userRole !== "Admin" && userRole !== "Teamlead") {
        throw createError({
            statusCode: 403,
            statusMessage: "Forbidden - Admin or Teamlead access required",
        });
    }

    // Cannot delete yourself
    if (currentSession.user.id === userId) {
        throw createError({
            statusCode: 400,
            statusMessage: "Cannot delete your own account",
        });
    }

    const db = useDrizzle(event);

    // Delete user's sessions and accounts first (cascade should handle this but just in case)
    await db.delete(sessions).where(eq(sessions.userId, userId));
    await db.delete(account).where(eq(account.userId, userId));

    // Delete the user
    await db.delete(users).where(eq(users.id, userId));

    return { success: true };
});
