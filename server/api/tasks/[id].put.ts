import { useDrizzle } from "../../utils/drizzle";
import { tasks, companyChangeLog } from "../../database/schema";
import { eq } from "drizzle-orm";
import { createAuth } from "../../lib/auth";

export default eventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    const db = useDrizzle(event);

    if (!id) {
        throw createError({ statusCode: 400, message: "Task ID is required" });
    }
    const taskId = parseInt(id, 10);
    if (Number.isNaN(taskId)) {
        throw createError({ statusCode: 400, message: "Invalid task ID" });
    }

    // Auth check - require authenticated user
    const auth = createAuth(event);
    const session = await auth.api.getSession({ headers: event.headers });
    if (!session?.user) {
        throw createError({ statusCode: 401, statusMessage: "Nicht autorisiert" });
    }
    const userId = session.user.id;

    const oldTask = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
        columns: { companyId: true, status: true, title: true },
    });

    if (!oldTask) {
        throw createError({ statusCode: 404, message: "Aufgabe nicht gefunden" });
    }

    // Validate enum values (security: prevent arbitrary values)
    // Accept both English and German values to support frontend
    const validStatuses = [
        "Open", "In Progress", "Erledigt", "Cancelled",
        "Nicht angefasst", "angefasst", "Recherchiert", "Bearbeitet",
        "Liegt auf Wiedervorlage", "Nicht erreicht"
    ];
    const validPriorities = ["Low", "Medium", "High", "Niedrig", "Mittel", "Hoch"];

    const status = validStatuses.includes(body.status) ? body.status : oldTask.status;
    const priority = validPriorities.includes(body.priority) ? body.priority : "Medium";


    // Validate and sanitize inputs
    const title = body.title ? String(body.title).slice(0, 255) : oldTask.title;
    const description = body.description ? String(body.description).slice(0, 2000) : null;

    let completedAt = body.completedAt;
    if (status === "Erledigt" && !completedAt) {
        completedAt = new Date();
    } else if (status !== "Erledigt") {
        completedAt = null;
    }

    const updatedTask = await db
        .update(tasks)
        .set({
            title,
            companyId: body.companyId,
            status,
            priority,
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
            assignedTo: body.assignedTo,
            description,
            completedAt: completedAt,
            updatedAt: new Date(),
        })
        .where(eq(tasks.id, taskId))
        .returning();

    const newTask = updatedTask[0];
    if (oldTask && newTask && oldTask.companyId && oldTask.status !== body.status) {
        await db.insert(companyChangeLog).values({
            companyId: newTask.companyId,
            entityType: "task",
            entityId: String(taskId),
            action: "updated",
            label: `Aufgabe: Status → ${body.status}`,
            oldValue: oldTask.status,
            newValue: body.status,
            userId,
            createdAt: new Date(),
        });
    }
    return newTask;
});
