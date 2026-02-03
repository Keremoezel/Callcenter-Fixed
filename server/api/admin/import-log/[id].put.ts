import { useDrizzle } from "../../../utils/drizzle";
import { importLogs, companies, assignments } from "../../../database/schema";
import { createAuth } from "../../../lib/auth";
import { eq, sql, and, gte, lte } from "drizzle-orm";

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

    // 2. Nur Admin kann Import Logs bearbeiten
    if (role !== "Admin") {
        throw createError({
            statusCode: 403,
            statusMessage: "Verboten: Nur Administratoren können Import-Logs bearbeiten.",
        });
    }

    const db = useDrizzle(event);
    const logId = parseInt(getRouterParam(event, "id") || "0");
    const body = await readBody(event);
    const { projectName } = body;

    if (!logId || isNaN(logId)) {
        throw createError({
            statusCode: 400,
            statusMessage: "Ungültige Import-Log-ID",
        });
    }

    // 3. Import Log abrufen
    const log = await db.query.importLogs.findFirst({
        where: eq(importLogs.id, logId),
    });

    if (!log) {
        throw createError({
            statusCode: 404,
            statusMessage: "Import-Log nicht gefunden",
        });
    }

    // 4. Projektname im Log aktualisieren
    await db
        .update(importLogs)
        .set({
            projectName: projectName || null,
        })
        .where(eq(importLogs.id, logId));

    // 5. Alle zu diesem Import gehörenden Firmen finden und Projektname aktualisieren
    // Wir müssen über assignments gehen, um die Firmen zu finden
    // Da wir keine direkte Verbindung haben, müssen wir über created_at Zeitraum gehen
    
    // Find all assignments created at the same time (within 5 seconds)
    const importStartTime = log.createdAt instanceof Date ? log.createdAt : new Date(log.createdAt);
    const importEndTime = new Date(importStartTime.getTime() + 5000); // 5 seconds tolerance
    
    // Validate dates
    if (isNaN(importStartTime.getTime()) || isNaN(importEndTime.getTime())) {
        throw createError({
            statusCode: 500,
            statusMessage: "Invalid import log timestamp",
        });
    }
    
    const relatedAssignments = await db
        .select({ companyId: assignments.companyId })
        .from(assignments)
        .where(
            and(
                gte(assignments.assignedAt, importStartTime),
                lte(assignments.assignedAt, importEndTime),
                eq(assignments.assignedBy, log.importedBy)
            )
        );

    const companyIds = [...new Set(relatedAssignments.map(a => a.companyId))];

    if (companyIds.length > 0) {
        // Update project name für alle betroffenen Firmen
        await db
            .update(companies)
            .set({
                project: projectName || null,
            })
            .where(sql`${companies.id} IN (${companyIds.join(",")})`);
    }

    return {
        success: true,
        message: "Projektname erfolgreich aktualisiert",
        updatedCompanies: companyIds.length,
    };
});
