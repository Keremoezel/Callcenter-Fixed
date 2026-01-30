import { useDrizzle } from "../../../../utils/drizzle";
import { companyChangeLog, assignments, teams, teamMembers } from "../../../../database/schema";
import { createAuth } from "../../../../lib/auth";
import { eq, inArray, and, desc } from "drizzle-orm";

/**
 * GET /api/admin/analyse/:agentId/change-log
 * Returns Änderungsverlauf for all customers (companies) assigned to this agent.
 */
export default eventHandler(async (event) => {
    const auth = createAuth(event);
    const session = await auth.api.getSession({ headers: event.headers });
    if (!session?.user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
    const currentUser = session.user;
    const role = (currentUser as any).role;
    if (role !== "Admin" && role !== "Teamlead") {
        throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }

    const agentId = getRouterParam(event, "agentId");
    if (!agentId) {
        throw createError({ statusCode: 400, statusMessage: "Agent ID required" });
    }

    const db = useDrizzle(event);

    if (role === "Teamlead") {
        const myLedTeams = await db.query.teams.findMany({
            where: eq(teams.teamleadId, currentUser.id),
        });
        const myTeamIds = myLedTeams.map((t) => t.id);
        let canView = agentId === currentUser.id;
        if (!canView && myTeamIds.length > 0) {
            const memberRecords = await db.query.teamMembers.findMany({
                where: and(
                    eq(teamMembers.userId, agentId),
                    inArray(teamMembers.teamId, myTeamIds)
                ),
            });
            canView = memberRecords.length > 0;
        }
        if (!canView) {
            throw createError({ statusCode: 403, statusMessage: "Forbidden" });
        }
    }

    const agentAssignments = await db.query.assignments.findMany({
        where: eq(assignments.agentId, agentId),
        columns: { companyId: true },
    });
    const companyIds = [...new Set(agentAssignments.map((a) => a.companyId))];
    if (companyIds.length === 0) {
        return [];
    }

    const logs = await db.query.companyChangeLog.findMany({
        where: inArray(companyChangeLog.companyId, companyIds),
        orderBy: [desc(companyChangeLog.createdAt)],
        with: {
            user: { columns: { id: true, name: true } },
            company: { columns: { id: true, name: true } },
        },
    });

    return logs.map((log) => {
        const raw = log.createdAt;
        let createdAt: string | null = null;
        if (raw != null) {
            let d: Date;
            if (raw instanceof Date) {
                d = raw;
            } else if (typeof raw === "number") {
                // SQLite integer: seconds (10 digits) or milliseconds (13 digits)
                d = raw < 1e12 ? new Date(raw * 1000) : new Date(raw);
            } else {
                d = new Date(raw as string);
            }
            if (!Number.isNaN(d.getTime())) createdAt = d.toISOString();
        }
        return {
            id: log.id,
            companyId: log.companyId,
            companyName: log.company?.name ?? null,
            entityType: log.entityType,
            entityId: log.entityId,
            action: log.action,
            label: log.label,
            oldValue: log.oldValue,
            newValue: log.newValue,
            userId: log.userId,
            userName: log.user?.name ?? null,
            createdAt,
        };
    });
});
