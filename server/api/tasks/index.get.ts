import { useDrizzle } from "../../utils/drizzle";
import { tasks, teams, teamMembers } from "../../database/schema";
import { createAuth } from "../../lib/auth";
import { getUserRole, type UserRole } from "../../utils/types";
import { eq, inArray, and, type SQL, sql } from "drizzle-orm";

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
    const role: UserRole | undefined = getUserRole(currentUser);
    const db = useDrizzle(event);

    // Pagination params
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Filter params
    const filterStatus = query.status as string | undefined;
    const filterPriority = query.priority as string | undefined;
    const filterAssignedTo = query.assignedTo as string | undefined;
    const filterCompany = query.company as string | undefined;
    const filterDueDate = query.dueDate as string | undefined;

    let whereClause: SQL | undefined;
    const additionalConditions: SQL[] = [];

    // 2. Logic based on Role
    if (role === "Admin") {
        // Admin: See ALL tasks (no filter)
        whereClause = undefined;
    } else if (role === "Teamlead") {
        // Teamlead: See Self + Team Members tasks

        // Get teams led by this user
        const myLedTeams = await db.select().from(teams).where(eq(teams.teamleadId, currentUser.id));
        const myTeamIds = myLedTeams.map(t => t.id);

        let memberIds = [currentUser.id]; // Always include self

        if (myTeamIds.length > 0) {
            // Get members of these teams
            const memberRecords = await db.select()
                .from(teamMembers)
                .where(inArray(teamMembers.teamId, myTeamIds));

            const teamMemberIds = memberRecords.map(m => m.userId);
            // Combine and unique
            memberIds = [...new Set([...memberIds, ...teamMemberIds])];
        }

        // Filter tasks where assignedTo is in memberIds
        // Also optionally include tasks assignedBy me? 
        // Strict interpretation: "Teamleaders the task from his own teams" -> Assigned TO team.
        whereClause = inArray(tasks.assignedTo, memberIds);

    } else {
        // Agent: See ONLY tasks assigned to self
        // (User said "only her own tasks")
        whereClause = eq(tasks.assignedTo, currentUser.id);
    }

    // Apply additional filters
    if (filterStatus) {
        additionalConditions.push(eq(tasks.status, filterStatus));
    }
    if (filterPriority) {
        additionalConditions.push(eq(tasks.priority, filterPriority));
    }
    if (filterAssignedTo) {
        additionalConditions.push(eq(tasks.assignedTo, filterAssignedTo));
    }
    if (filterCompany) {
        additionalConditions.push(eq(tasks.companyId, parseInt(filterCompany)));
    }
    if (filterDueDate) {
        const now = new Date();
        if (filterDueDate === 'overdue') {
            additionalConditions.push(sql`${tasks.dueDate} < ${now.toISOString()} AND ${tasks.status} != 'Erledigt'`);
        } else if (filterDueDate === 'today') {
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayEnd = new Date(todayStart);
            todayEnd.setDate(todayEnd.getDate() + 1);
            additionalConditions.push(sql`${tasks.dueDate} >= ${todayStart.toISOString()} AND ${tasks.dueDate} < ${todayEnd.toISOString()}`);
        } else if (filterDueDate === 'week') {
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() + 7);
            additionalConditions.push(sql`${tasks.dueDate} <= ${weekEnd.toISOString()}`);
        } else if (filterDueDate === 'month') {
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            additionalConditions.push(sql`${tasks.dueDate} <= ${monthEnd.toISOString()}`);
        }
    }

    // Combine role-based filter with additional filters
    if (additionalConditions.length > 0) {
        if (whereClause) {
            // Combine role-based with additional filters using AND
            whereClause = and(whereClause, ...additionalConditions);
        } else {
            // Only additional filters
            whereClause = additionalConditions.length > 1
                ? and(...additionalConditions)
                : additionalConditions[0];
        }
    }

    // Get total count
    let totalQuery = (db as any).select({ count: sql<number>`count(*)` }).from(tasks);
    if (whereClause) {
        totalQuery = totalQuery.where(whereClause);
    }
    const [totalResult] = await totalQuery;

    const total = Number(totalResult?.count) || 0;
    const totalPages = Math.ceil(total / limit);

    const tasksList = await db.query.tasks.findMany({
        where: whereClause,
        orderBy: (t: any, { desc }: any) => [desc(t.createdAt)],
        limit,
        offset,
        with: {
            company: {
                columns: {
                    id: true,
                    name: true,
                },
            },
            assignee: {
                columns: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            assigner: {
                columns: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    return {
        data: tasksList.map((task: any) => ({
            ...task,
            companyName: task.company?.name,
            assigneeName: task.assignee?.name,
            assignerName: task.assigner?.name,
        })),
        pagination: {
            total,
            page,
            limit,
            pages: totalPages,
        },
    };
});
