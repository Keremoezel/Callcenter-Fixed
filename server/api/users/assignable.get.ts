import { useDrizzle } from "../../utils/drizzle";
import { users, teams, teamMembers } from "../../database/schema";
import { createAuth } from "../../lib/auth";
import { eq, inArray, or } from "drizzle-orm";

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
        // Admin: Return ALL users
        return await db.query.users.findMany({
            columns: {
                id: true,
                name: true,
                role: true,
            },
            orderBy: (users, { asc }) => [asc(users.name)],
        });
    } else if (role === "Teamlead") {
        // Teamlead: Return Self + Team Members
        // Get teams led by this user
        const myLedTeams = await db.select().from(teams).where(eq(teams.teamleadId, currentUser.id));
        const myTeamIds = myLedTeams.map(t => t.id);

        if (myTeamIds.length === 0) {
            // Leading no teams -> Only return self
            return [
                { id: currentUser.id, name: currentUser.name, role: role }
            ];
        }

        // Get members of these teams
        // Logic: Users who are members of teams I lead OR myself
        // JOIN: teamMembers -> user

        // Simpler: Fetch user IDs from teamMembers
        const memberRecords = await db.select()
            .from(teamMembers)
            .where(inArray(teamMembers.teamId, myTeamIds));

        const memberIds = memberRecords.map(m => m.userId);
        // Add self
        if (!memberIds.includes(currentUser.id)) {
            memberIds.push(currentUser.id);
        }

        return await db.query.users.findMany({
            where: inArray(users.id, memberIds),
            columns: {
                id: true,
                name: true,
                role: true,
            },
            orderBy: (users, { asc }) => [asc(users.name)],
        });

    } else {
        // Agent (or others): Return ONLY self
        return [
            { id: currentUser.id, name: currentUser.name, role: role }
        ];
    }
});
