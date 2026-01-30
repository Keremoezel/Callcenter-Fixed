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

    const auth = createAuth(event);
    const session = await auth.api.getSession({ headers: event.headers });
    const userId = session?.user?.id ?? null;

    const oldTask = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
        columns: { companyId: true, status: true, title: true },
    });

    let completedAt = body.completedAt;
    if (body.status === "Erledigt" && !completedAt) {
        completedAt = new Date();
    } else if (body.status !== "Erledigt") {
        completedAt = null;
    }

    const updatedTask = await db
        .update(tasks)
        .set({
            title: body.title,
            companyId: body.companyId,
            status: body.status,
            priority: body.priority,
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
            assignedTo: body.assignedTo,
            description: body.description,
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
