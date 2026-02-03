import { useDrizzle } from "../../../utils/drizzle";
import { users, teams, teamMembers, assignments, tasks, companies } from "../../../database/schema";
import { createAuth } from "../../../lib/auth";
import { eq, inArray, and, gte, lte } from "drizzle-orm";

/**
 * GET /api/admin/analyse/:agentId
 * Returns detailed activity timeline for a specific agent
 * Admin: can view any agent
 * Teamlead: can only view their team members
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

    const agentId = getRouterParam(event, "agentId");
    if (!agentId) {
        throw createError({
            statusCode: 400,
            statusMessage: "Agent ID is required",
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
    const statusFilter = query.status as string | undefined; // z.B. "Nicht angefasst" | "angefasst" | "Erledigt"

    // 3. Authorization check - Teamlead can only view their team members
    if (role === "Teamlead") {
        // Get teams led by this user
        const myLedTeams = await db.query.teams.findMany({
            where: eq(teams.teamleadId, currentUser.id)
        });
        const myTeamIds = myLedTeams.map(t => t.id);

        let canView = false;

        if (agentId === currentUser.id) {
            canView = true;
        } else if (myTeamIds.length > 0) {
            // Check if agent is in one of my teams
            const memberRecords = await db.query.teamMembers.findMany({
                where: and(
                    eq(teamMembers.userId, agentId),
                    inArray(teamMembers.teamId, myTeamIds)
                )
            });
            
            canView = memberRecords.length > 0;
        }

        if (!canView) {
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden - Cannot view this agent",
            });
        }
    }

    // 4. Fetch agent info and team membership in parallel
    const [agent, teamMembership] = await Promise.all([
        db.query.users.findFirst({
            where: eq(users.id, agentId),
            columns: {
                id: true,
                name: true,
                email: true,
                role: true,
            }
        }),
        db.query.teamMembers.findFirst({
            where: eq(teamMembers.userId, agentId),
            with: {
                team: {
                    columns: {
                        name: true
                    }
                }
            }
        })
    ]);

    if (!agent) {
        throw createError({
            statusCode: 404,
            statusMessage: "Agent not found",
        });
    }
    
    const teamName = teamMembership?.team?.name || null;

    // 5. **FIX N+1: Fetch ALL data in parallel bulk queries**
    // Use ALL assigned companies (no date filter) so task status changes are never excluded
    const allAssignmentsForCompanies = await db.query.assignments.findMany({
        where: eq(assignments.agentId, agentId),
        columns: { companyId: true, assignedBy: true },
    });
    const companyIds = [...new Set(allAssignmentsForCompanies.map(a => a.companyId))];
    const assignerIds = [...new Set(allAssignmentsForCompanies.map(a => a.assignedBy).filter((id): id is string => id != null))];

    if (companyIds.length === 0) {
        return {
            agent: {
                id: agent.id,
                name: agent.name,
                email: agent.email,
                role: agent.role,
                teamName,
            },
            totalAssigned: 0,
            erledigtCount: 0,
            offenCount: 0,
            averageReactionTimeHours: null,
            timeline: [],
            pagination: {
                total: 0,
                page,
                limit,
                pages: 0
            }
        };
    }

    // D1/SQLite bind limit; chunk companyIds to avoid "too many SQL variables"
    const MAX_IN_CLAUSE = 400;
    const chunk = <T>(arr: T[], size: number): T[][] => {
        const out: T[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
    };
    const companyIdChunks = chunk(companyIds, MAX_IN_CLAUSE);

    // **Fetch ALL data** (companies + tasks in chunks; assigners once)
    type CompanyRow = { id: number; name: string };
    type TaskRow = { id: number; title: string; companyId: number; status: string; assignedBy: string | null; updatedAt: Date | null; createdAt: Date };
    const [companiesData, agentTasksArrays, assigners] = await Promise.all([
        (async (): Promise<CompanyRow[]> => {
            const all: CompanyRow[] = [];
            for (const ids of companyIdChunks) {
                const rows = await db.query.companies.findMany({
                    where: inArray(companies.id, ids),
                    columns: { id: true, name: true },
                });
                all.push(...rows);
            }
            return all;
        })(),
        (async (): Promise<TaskRow[]> => {
            const all: TaskRow[] = [];
            for (const ids of companyIdChunks) {
                const rows = await db.query.tasks.findMany({
                    where: and(
                        eq(tasks.assignedTo, agentId),
                        inArray(tasks.companyId, ids)
                    ),
                    columns: {
                        id: true,
                        title: true,
                        companyId: true,
                        status: true,
                        assignedBy: true,
                        updatedAt: true,
                        createdAt: true,
                    }
                });
                all.push(...rows);
            }
            return all;
        })(),
        assignerIds.length > 0
            ? db.query.users.findMany({
                where: inArray(users.id, assignerIds),
                columns: { id: true, name: true },
            })
            : Promise.resolve([])
    ]);
    const agentTasks = agentTasksArrays;

    // Build lookup maps
    const companyNamesMap: Record<number, string> = {};
    companiesData.forEach(c => {
        companyNamesMap[c.id] = c.name;
    });

    const assignerNamesMap: Record<string, string> = {};
    assigners.forEach(u => {
        assignerNamesMap[u.id] = u.name;
    });

    // Task assigners (who gave the task to the agent) – fetch if not already in assignerNamesMap
    const taskAssignerIds = [...new Set(agentTasks.map(t => t.assignedBy).filter((id): id is string => id != null))];
    const needTaskAssigners = taskAssignerIds.filter(id => !(id in assignerNamesMap));
    if (needTaskAssigners.length > 0) {
        const taskAssigners = await db.query.users.findMany({
            where: inArray(users.id, needTaskAssigners),
            columns: { id: true, name: true },
        });
        taskAssigners.forEach(u => {
            assignerNamesMap[u.id] = u.name;
        });
    }

    // 6. Build timeline events (pure JS) – nur Statusänderungen, keine Aktivitäten
    const timelineEvents: any[] = [];

    // Add task events (only if timestamp is in date range when filter is set)
    const dateFromTs = dateFrom ? new Date(dateFrom).getTime() : null;
    const dateToTs = dateTo ? new Date(dateTo).getTime() : null;
    agentTasks.forEach(task => {
        const eventTimestamp = task.updatedAt || task.createdAt;
        const ts = eventTimestamp.getTime();
        if (dateFromTs != null && ts < dateFromTs) return;
        if (dateToTs != null && ts > dateToTs) return;
        timelineEvents.push({
            type: "status_change",
            timestamp: eventTimestamp.toISOString(),
            companyId: task.companyId,
            companyName: companyNamesMap[task.companyId] || "Unknown",
            details: {
                oldStatus: null,
                newStatus: task.status,
                taskTitle: task.title,
                assignedBy: task.assignedBy ? assignerNamesMap[task.assignedBy] ?? null : null,
            }
        });
    });

    // 6b. Status-Filter: nur Einträge mit diesem Aufgaben-Status
    const filteredByStatus = statusFilter && statusFilter.trim() !== ""
        ? timelineEvents.filter((e: any) => e.type === "status_change" && e.details?.newStatus === statusFilter)
        : timelineEvents;

    // 7. Sort timeline by timestamp (descending - most recent first)
    filteredByStatus.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // 8. Apply pagination
    const total = filteredByStatus.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedTimeline = filteredByStatus.slice(offset, offset + limit);

    // KPI: aktuelle Aufgaben-Status (aus agentTasks)
    const erledigtCount = agentTasks.filter(t => t.status === "Erledigt").length;
    const offenCount = agentTasks.filter(t => t.status !== "Erledigt").length;

    // KPI: Ø Reaktionszeit = Zeit von Erstzuweisung (Task erstellt) bis erste Reaktion (Status ≠ Nicht angefasst)
    const reactionTimesHours: number[] = [];
    agentTasks.forEach(task => {
        if (task.status !== "Nicht angefasst" && task.createdAt && task.updatedAt) {
            const created = new Date(task.createdAt).getTime();
            const updated = new Date(task.updatedAt).getTime();
            if (updated >= created) reactionTimesHours.push((updated - created) / (1000 * 60 * 60));
        }
    });
    const averageReactionTimeHours = reactionTimesHours.length > 0
        ? reactionTimesHours.reduce((a, b) => a + b, 0) / reactionTimesHours.length
        : null;

    return {
        agent: {
            id: agent.id,
            name: agent.name,
            email: agent.email,
            role: agent.role,
            teamName,
        },
        totalAssigned: companyIds.length,
        erledigtCount,
        offenCount,
        averageReactionTimeHours,
        timeline: paginatedTimeline,
        pagination: {
            total,
            page,
            limit,
            pages: totalPages
        }
    };
});
