import { useDrizzle } from "../../utils/drizzle";
import { teams } from "../../database/schema";
import { createAuth } from "../../lib/auth";
import { eq, asc } from "drizzle-orm";

export default eventHandler(async (event) => {
    // 1. Authenticate
    const auth = createAuth(event);
    const session = await auth.api.getSession({ headers: event.headers });

    if (!session?.user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const currentUser = session.user;
    const role = (currentUser as any).role;
    const db = useDrizzle(event);

    // 2. Logic based on Role
    if (role === "Admin") {
        // Admin: Return ALL teams
        return await db.select()
            .from(teams)
            .orderBy(asc(teams.name));
    } else if (role === "Teamlead") {
        // Teamlead: Return ONLY teams they lead
        return await db.select()
            .from(teams)
            .where(eq(teams.teamleadId, currentUser.id))
            .orderBy(asc(teams.name));
    } else {
        // Agent: Return empty (Agents shouldn't be assigning to teams)
        return [];
    }
});
