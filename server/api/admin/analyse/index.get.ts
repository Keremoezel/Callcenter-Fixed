import { useDrizzle } from "../../../utils/drizzle";
import { users, teams, teamMembers, assignments, tasks, activities } from "../../../database/schema";
import { createAuth } from "../../../lib/auth";
import { eq, inArray, and, gte, lte, sql } from "drizzle-orm";

/**
 * GET /api/admin/analyse
 * Returns aggregated agent statistics
 * Admin: sees all agents
 * Teamlead: sees only their team members
 */
export default eventHandler(async (event) => {
    // 1. Authentication
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

    // Check admin or teamlead role
    if (role !== "Admin" && role !== "Teamlead") {
        throw createError({
            statusCode: 403,
            statusMessage: "Forbidden - Admin or Teamlead access required",
        });
    }

    const db = useDrizzle(event);

    // 2. Query parameters
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const dateFrom = query.dateFrom as string | undefined;
    const dateTo = query.dateTo as string | undefined;
    const filterTeamId = query.teamId ? parseInt(query.teamId as string) : undefined;
    const roleFilter = query.role as string | undefined; // "Admin" | "Teamlead" | "Agent"

    // 3. Get allowed agent IDs based on role
    let allowedAgentIds: string[] | undefined;

    if (role === "Teamlead") {
        // Get teams led by this user
        const myLedTeams = await db.query.teams.findMany({
            where: eq(teams.teamleadId, currentUser.id)
        });
        const myTeamIds = myLedTeams.map(t => t.id);

        if (myTeamIds.length === 0) {
            allowedAgentIds = [currentUser.id];
        } else {
            const memberRecords = await db.query.teamMembers.findMany({
                where: inArray(teamMembers.teamId, myTeamIds)
            });

            allowedAgentIds = memberRecords.map(m => m.userId);

            if (!allowedAgentIds.includes(currentUser.id)) {
                allowedAgentIds.push(currentUser.id);
            }
        }
    }

    // 4. Get all agents (or filtered agents)
    let allAgents;

    if (filterTeamId && role === "Admin") {
        const teamMemberRecords = await db.query.teamMembers.findMany({
            where: eq(teamMembers.teamId, filterTeamId)
        });
        const teamAgentIds = teamMemberRecords.map(m => m.userId);

        if (teamAgentIds.length === 0) {
            return {
                data: [],
                pagination: { total: 0, page, limit, pages: 0 }
            };
        }

        allAgents = await db.query.users.findMany({
            where: allowedAgentIds
                ? and(inArray(users.id, allowedAgentIds), inArray(users.id, teamAgentIds))
                : inArray(users.id, teamAgentIds),
            columns: {
                id: true,
                name: true,
                email: true,
                role: true,
            }
        });
    } else if (allowedAgentIds) {
        allAgents = await db.query.users.findMany({
            where: inArray(users.id, allowedAgentIds),
            columns: {
                id: true,
                name: true,
                email: true,
                role: true,
            }
        });
    } else {
        allAgents = await db.query.users.findMany({
            columns: {
                id: true,
                name: true,
                email: true,
                role: true,
            }
        });
    }

    // Filter by role (Admin / Teamlead / Agent) if requested
    const roleFilteredAgents = roleFilter && ["Admin", "Teamlead", "Agent"].includes(roleFilter)
        ? allAgents.filter((a: any) => a.role === roleFilter)
        : allAgents;

    const total = roleFilteredAgents.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedAgents = roleFilteredAgents.slice(offset, offset + limit);
    const paginatedAgentIds = paginatedAgents.map(a => a.id);

    // 5. **FIX N+1: Fetch ALL data in bulk queries**

    // Bulk fetch team memberships for all agents
    const allTeamMemberships = await db.query.teamMembers.findMany({
        where: inArray(teamMembers.userId, paginatedAgentIds),
        with: {
            team: {
                columns: {
                    name: true
                }
            }
        }
    });
    const teamMap = new Map(allTeamMemberships.map(tm => [tm.userId, tm.team?.name || null]));

    // Bulk fetch assignments with date filters
    const assignmentFilters = [inArray(assignments.agentId, paginatedAgentIds)];
    if (dateFrom) {
        assignmentFilters.push(gte(assignments.assignedAt, new Date(dateFrom)));
    }
    if (dateTo) {
        assignmentFilters.push(lte(assignments.assignedAt, new Date(dateTo)));
    }

    const allAssignments = await db.query.assignments.findMany({
        where: assignmentFilters.length > 1 ? and(...assignmentFilters) : assignmentFilters[0],
        columns: {
            id: true,
            agentId: true,
            companyId: true,
            assignedAt: true,
        }
    });

    // Group assignments by agent
    const assignmentsByAgent = new Map<string, typeof allAssignments>();
    allAssignments.forEach(assignment => {
        const agentId = assignment.agentId;
        if (agentId == null) return;
        if (!assignmentsByAgent.has(agentId)) {
            assignmentsByAgent.set(agentId, []);
        }
        assignmentsByAgent.get(agentId)!.push(assignment);
    });

    // Get all company IDs
    const allCompanyIds = [...new Set(allAssignments.map(a => a.companyId))];


    // D1 has a strict parameter limit (~100 params). Be conservative.
    const SQL_VAR_LIMIT = 50;
    const maxCompanyIdsPerChunk = Math.max(1, SQL_VAR_LIMIT - paginatedAgentIds.length - 5); // Extra buffer
    const chunk = <T>(arr: T[], size: number): T[][] => {
        if (size <= 0) size = 1;
        const out: T[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
    };
    const companyIdChunks = allCompanyIds.length > 0 ? chunk(allCompanyIds, maxCompanyIdsPerChunk) : [];

    // Bulk fetch tasks for all companies and agents (in chunks)
    type TaskRow = { assignedTo: string | null; status: string; companyId: number; createdAt: Date };
    let allTasks: TaskRow[] = [];
    if (allCompanyIds.length > 0) {
        for (const companyIds of companyIdChunks) {
            const rows = await db.query.tasks.findMany({
                where: and(
                    inArray(tasks.assignedTo, paginatedAgentIds),
                    inArray(tasks.companyId, companyIds)
                ),
                columns: {
                    assignedTo: true,
                    status: true,
                    companyId: true,
                    createdAt: true,
                }
            });
            allTasks = allTasks.concat(rows);
        }
    }

    // Group tasks by agent
    const tasksByAgent = new Map<string, TaskRow[]>();
    allTasks.forEach(task => {
        const assignedTo = task.assignedTo;
        if (assignedTo == null) return;
        if (!tasksByAgent.has(assignedTo)) {
            tasksByAgent.set(assignedTo, []);
        }
        tasksByAgent.get(assignedTo)!.push(task);
    });

    // Bulk fetch activities for all companies and agents (in chunks)
    type ActivityRow = { userId: string; type: string; companyId: number; createdAt: Date };
    let allActivities: ActivityRow[] = [];
    if (allCompanyIds.length > 0) {
        for (const companyIds of companyIdChunks) {
            const rows = await db.query.activities.findMany({
                where: and(
                    inArray(activities.userId, paginatedAgentIds),
                    inArray(activities.companyId, companyIds)
                ),
                columns: {
                    userId: true,
                    type: true,
                    companyId: true,
                    createdAt: true,
                }
            });
            allActivities = allActivities.concat(rows);
        }
    }

    // Group activities by agent
    const activitiesByAgent = new Map<string, ActivityRow[]>();
    allActivities.forEach(activity => {
        if (!activitiesByAgent.has(activity.userId)) {
            activitiesByAgent.set(activity.userId, []);
        }
        activitiesByAgent.get(activity.userId)!.push(activity);
    });

    // 6. Calculate statistics for each agent (no more DB queries!)
    const agentStats = paginatedAgents.map(agent => {
        const teamName = teamMap.get(agent.id) || null;
        const agentAssignments = assignmentsByAgent.get(agent.id) || [];
        const totalAssigned = agentAssignments.length;
        const companyIds = agentAssignments.map(a => a.companyId);

        const agentTasks = tasksByAgent.get(agent.id) || [];

        // Count tasks by status
        const statusBreakdown: Record<string, number> = {};
        let nichtAngefasst = 0;

        agentTasks.forEach(task => {
            statusBreakdown[task.status] = (statusBreakdown[task.status] || 0) + 1;
            if (task.status === "Nicht angefasst") {
                nichtAngefasst++;
            }
        });

        const agentActivities = activitiesByAgent.get(agent.id) || [];
        const totalActivities = agentActivities.length;

        // Count activities by type
        const activitiesByType: Record<string, number> = {
            CALL: 0,
            EMAIL: 0,
            MEETING: 0,
            NOTE: 0
        };

        agentActivities.forEach(activity => {
            if (activity.type in activitiesByType) {
                activitiesByType[activity.type]++;
            }
        });

        // Calculate average time to first contact (in hours)
        let avgTimeToContact: number | null = null;

        if (agentAssignments.length > 0 && agentActivities.length > 0) {
            const timeDiffs: number[] = [];

            agentAssignments.forEach(assignment => {
                const firstActivity = agentActivities
                    .filter(a => a.companyId === assignment.companyId)
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

                if (firstActivity) {
                    const assignedTime = new Date(assignment.assignedAt).getTime();
                    const contactTime = new Date(firstActivity.createdAt).getTime();
                    const diffHours = (contactTime - assignedTime) / (1000 * 60 * 60);

                    if (diffHours >= 0) {
                        timeDiffs.push(diffHours);
                    }
                }
            });

            if (timeDiffs.length > 0) {
                avgTimeToContact = Math.round(timeDiffs.reduce((sum, t) => sum + t, 0) / timeDiffs.length * 10) / 10;
            }
        }

        // Get most recent assignment date
        const recentAssignment = agentAssignments.length > 0
            ? agentAssignments.reduce((latest, current) =>
                new Date(current.assignedAt) > new Date(latest.assignedAt) ? current : latest
            ).assignedAt.toISOString()
            : null;

        const totalTasks = agentTasks.length;
        const erledigtCount = statusBreakdown["Erledigt"] ?? 0;
        const offenCount = totalTasks - erledigtCount;

        return {
            agentId: agent.id,
            agentName: agent.name,
            agentEmail: agent.email,
            agentRole: agent.role,
            teamName,
            statistics: {
                totalAssigned,
                nichtAngefasst,
                erledigtCount,
                offenCount,
                avgTimeToContact,
                statusBreakdown,
                totalActivities,
                activitiesByType,
                recentAssignment,
            }
        };
    });

    return {
        data: agentStats,
        pagination: {
            total,
            page,
            limit,
            pages: totalPages
        }
    };
});
