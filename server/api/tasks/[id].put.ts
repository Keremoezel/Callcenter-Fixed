import { useDrizzle } from "../../utils/drizzle";
import { tasks } from "../../database/schema";
import { eq } from "drizzle-orm";

export default eventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    const db = useDrizzle(event);

    if (!id) {
        throw createError({ statusCode: 400, message: "Task ID is required" });
    }

    // Determine completedAt based on status
    let completedAt = body.completedAt;
    if (body.status === "Erledigt" && !completedAt) {
        // Task is being marked as completed, set timestamp
        completedAt = new Date();
    } else if (body.status !== "Erledigt") {
        // Task is being unmarked from completed, clear timestamp
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
        .where(eq(tasks.id, parseInt(id)))
        .returning();

    return updatedTask[0];
});
