import { useDrizzle } from "../../../utils/drizzle";
import { companyChangeLog, users } from "../../../database/schema";
import { createAuth } from "../../../lib/auth";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/customers/:id/change-log
 * Returns Änderungsverlauf (change log) for the customer (company).
 */
export default eventHandler(async (event) => {
    const auth = createAuth(event);
    const session = await auth.api.getSession({ headers: event.headers });
    if (!session?.user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const id = getRouterParam(event, "id");
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: "Missing customer ID" });
    }
    const companyId = parseInt(id, 10);
    if (Number.isNaN(companyId)) {
        throw createError({ statusCode: 400, statusMessage: "Invalid customer ID" });
    }

    const db = useDrizzle(event);
    const logs = await db.query.companyChangeLog.findMany({
        where: eq(companyChangeLog.companyId, companyId),
        orderBy: [desc(companyChangeLog.createdAt)],
        with: {
            user: {
                columns: { id: true, name: true },
            },
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
                d = raw < 1e12 ? new Date(raw * 1000) : new Date(raw);
            } else {
                d = new Date(raw as string);
            }
            if (!Number.isNaN(d.getTime())) createdAt = d.toISOString();
        }
        return {
            id: log.id,
            companyId: log.companyId,
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
