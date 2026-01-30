import { useDrizzle } from "../../../utils/drizzle";
import { users } from "../../../database/schema";
import { createAuth } from "../../../lib/auth";
import { sql } from "drizzle-orm";

/**
 * GET /api/admin/users
 * Returns list of all users (admin only)
 */
export default eventHandler(async (event) => {
    // Check if user is authenticated and is admin
    const auth = createAuth(event);
    const session = await auth.api.getSession({ headers: event.headers });

    if (!session?.user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    // Check admin or teamlead role
    const userRole = (session.user as any).role;
    if (userRole !== "Admin" && userRole !== "Teamlead") {
        throw createError({
            statusCode: 403,
            statusMessage: "Forbidden - Admin or Teamlead access required",
        });
    }

    const db = useDrizzle(event);

    // Pagination params
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Get total count
    const [totalResult] = await (db as any).select({ count: sql<number>`count(*)` }).from(users);
    const total = Number(totalResult?.count) || 0;
    const totalPages = Math.ceil(total / limit);

    const allUsers = await db.query.users.findMany({
        columns: {
            id: true,
            email: true,
            name: true,
            role: true,
            emailVerified: true,
            createdAt: true,
        },
        orderBy: (users, { desc }) => [desc(users.createdAt)],
        limit,
        offset,
    });

    return {
        data: allUsers,
        pagination: {
            total,
            page,
            limit,
            pages: totalPages,
        },
    };
});
