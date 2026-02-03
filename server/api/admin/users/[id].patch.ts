import { useDrizzle } from "../../../utils/drizzle";
import { users } from "../../../database/schema";
import { eq } from "drizzle-orm";
import { createAuth } from "../../../lib/auth";
import { getUserRole, type UserRole } from "../../../utils/types";

/**
 * PATCH /api/admin/users/:id
 * Update user role (admin only)
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
    const session = await auth.api.getSession({ headers: event.headers });

    if (!session?.user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    // Only admins can change user roles (security: prevent privilege escalation)
    const userRole: UserRole | undefined = getUserRole(session.user);
    if (userRole !== "Admin") {
        throw createError({
            statusCode: 403,
            statusMessage: "Zugriff verweigert - Admin-Berechtigung erforderlich",
        });
    }

    // Cannot change your own role (prevents lock-out scenarios)
    if (session.user.id === userId) {
        throw createError({
            statusCode: 400,
            statusMessage: "Eigene Rolle kann nicht geändert werden",
        });
    }

    const body = await readBody(event);

    if (!body.role || !["Admin", "Teamlead", "Agent"].includes(body.role)) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid role. Must be Admin, Teamlead, or Agent",
        });
    }

    const db = useDrizzle(event);

    await db
        .update(users)
        .set({
            role: body.role,
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

    return { success: true };
});
