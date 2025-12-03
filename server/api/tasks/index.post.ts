import { useDrizzle } from "../../utils/drizzle";
import { tasks } from "../../database/schema";

export default eventHandler(async (event) => {
    const body = await readBody(event);
    const db = useDrizzle();

    // Validate required fields
    if (!body.title || !body.companyId) {
        throw createError({
            statusCode: 400,
            message: "Title and Company are required"
        });
    }

    // TODO: Get current user from session
    // const user = event.context.user;
    // For now, we'll assume the body contains the necessary IDs or handle it in the frontend
    // In a real app, we would validate permissions here:
    // if (user.role === 'Agent' && body.assignedTo !== user.id) {
    //   throw createError({ statusCode: 403, message: "Agents can only assign tasks to themselves" });
    // }

    const newTask = await db.insert(tasks).values({
        title: body.title,
        companyId: body.companyId,
        status: body.status || "Open",
        priority: body.priority || "Medium",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        assignedTo: body.assignedTo || null,
        assignedBy: body.assignedBy || null,
        description: body.description || null,
    }).returning();

    return newTask[0];
});
