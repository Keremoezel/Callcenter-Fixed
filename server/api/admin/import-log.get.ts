import { useDrizzle } from "../../utils/drizzle";
import { importLogs, users, teams } from "../../database/schema";
import { createAuth } from "../../lib/auth";
import { desc, sql, inArray, eq, and, gte, lte, like } from "drizzle-orm";

export default eventHandler(async (event) => {
    // 1. Authentifizierung
    const auth = createAuth(event);
    const session = await auth.api.getSession({ headers: event.headers });

    if (!session?.user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Nicht autorisiert",
        });
    }

    const currentUser = session.user;
    const role = (currentUser as any).role;

    // 2. Nur Admin kann Import Logs sehen
    if (role !== "Admin") {
        throw createError({
            statusCode: 403,
            statusMessage: "Verboten: Nur Administratoren können Import-Logs einsehen.",
        });
    }

    const db = useDrizzle(event);

    // 3. Pagination params
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // 4. Filter params
    const dateFrom = query.dateFrom as string | undefined;
    const dateTo = query.dateTo as string | undefined;
    const importedBy = query.importedBy as string | undefined;
    const projectName = query.projectName as string | undefined;
    const targetTeamId = query.targetTeamId ? parseInt(query.targetTeamId as string) : undefined;
    const targetAgentId = query.targetAgentId as string | undefined;

    // 5. Build where conditions
    const whereConditions: any[] = [];

    if (dateFrom) {
        whereConditions.push(gte(importLogs.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
        const dateToEnd = new Date(dateTo);
        dateToEnd.setHours(23, 59, 59, 999);
        whereConditions.push(lte(importLogs.createdAt, dateToEnd));
    }
    if (importedBy) {
        whereConditions.push(eq(importLogs.importedBy, importedBy));
    }
    if (projectName) {
        // Handle null projectName: use sql for case-insensitive search
        whereConditions.push(sql`COALESCE(${importLogs.projectName}, '') LIKE ${`%${projectName}%`}`);
    }
    if (targetTeamId) {
        whereConditions.push(eq(importLogs.targetTeamId, targetTeamId));
    }
    if (targetAgentId) {
        whereConditions.push(eq(importLogs.targetAgentId, targetAgentId));
    }

    const whereClause = whereConditions.length > 0 
        ? (whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions))
        : undefined;

    // 6. Total count (with filters)
    let totalQuery = (db as any).select({ count: sql<number>`count(*)` }).from(importLogs);
    if (whereClause) {
        totalQuery = totalQuery.where(whereClause);
    }
    const [totalResult] = await totalQuery;
    const total = Number(totalResult?.count) || 0;
    const totalPages = Math.ceil(total / limit);

    // 7. Import Logs abrufen (paginated with filters)
    let logsQuery = db
        .select()
        .from(importLogs)
        .orderBy(desc(importLogs.createdAt))
        .limit(limit)
        .offset(offset);
    
    if (whereClause) {
        logsQuery = logsQuery.where(whereClause) as any;
    }
    
    const logs = await logsQuery;

    // 8. Fetch User and Team information with separate queries
    const userIds = [...new Set([
        ...logs.map(l => l.importedBy).filter(Boolean) as string[],
        ...logs.map(l => l.targetAgentId).filter(Boolean) as string[],
    ])];
    const teamIds = [...new Set(logs.map(l => l.targetTeamId).filter(Boolean) as number[])];

    const usersMap = new Map<string, { name: string; email: string }>();
    const teamsMap = new Map<number, { name: string }>();

    if (userIds.length > 0) {
        const usersData = await db.query.users.findMany({
            where: (users, { inArray: inArrayFn }) => inArrayFn(users.id, userIds),
            columns: {
                id: true,
                name: true,
                email: true,
            },
        });
        
        usersData.forEach((u) => {
            usersMap.set(u.id, { name: u.name, email: u.email });
        });
    }

    if (teamIds.length > 0) {
        const teamsData = await db.query.teams.findMany({
            where: (teams, { inArray: inArrayFn }) => inArrayFn(teams.id, teamIds),
            columns: {
                id: true,
                name: true,
            },
        });
        
        teamsData.forEach((t) => {
            teamsMap.set(t.id, { name: t.name });
        });
    }

    return {
        data: logs.map((log) => {
            // Ensure createdAt is a valid Date and convert to ISO string
            let createdAtDate: Date;
            if (log.createdAt instanceof Date) {
                createdAtDate = log.createdAt;
            } else if (typeof log.createdAt === 'number') {
                createdAtDate = new Date(log.createdAt);
            } else if (typeof log.createdAt === 'string') {
                createdAtDate = new Date(log.createdAt);
            } else {
                createdAtDate = new Date(); // Fallback to current date
            }
            
            // Validate the date
            if (isNaN(createdAtDate.getTime())) {
                createdAtDate = new Date(); // Fallback to current date if invalid
            }
            
            return {
                id: log.id,
                importedBy: usersMap.get(log.importedBy)?.name || "Unbekannt",
                importedByEmail: usersMap.get(log.importedBy)?.email || "",
                projectName: log.projectName || "-",
                targetTeam: log.targetTeamId ? (teamsMap.get(log.targetTeamId)?.name || "-") : "-",
                targetAgent: log.targetAgentId ? (usersMap.get(log.targetAgentId)?.name || "-") : "-",
                totalRows: log.totalRows,
                successCount: log.successCount,
                failedCount: log.failedCount,
                createdCount: log.createdCount,
                updatedCount: log.updatedCount,
                assignedCount: log.assignedCount,
                createdAt: createdAtDate.toISOString(), // Return as ISO string for consistent parsing
            };
        }),
        pagination: {
            total,
            page,
            limit,
            pages: totalPages,
        },
    };
});
