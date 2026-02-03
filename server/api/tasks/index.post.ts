import { useDrizzle } from "../../utils/drizzle";
import { tasks } from "../../database/schema";
import { createAuth } from "../../lib/auth";

export default eventHandler(async (event) => {
    // Auth check - require authenticated user
    const auth = createAuth(event);
    const session = await auth.api.getSession({ headers: event.headers });
    if (!session?.user) {
        throw createError({ statusCode: 401, statusMessage: "Nicht autorisiert" });
    }
    const currentUser = session.user;

    const body = await readBody(event);
    const db = useDrizzle(event);

    // Validate required fields
    if (!body.title || !body.companyId) {
        throw createError({
            statusCode: 400,
            message: "Titel und Firma sind erforderlich"
        });
    }

    // Validate enum values (security: prevent arbitrary values)
    const validStatuses = ["Open", "In Progress", "Erledigt", "Cancelled"];
    const validPriorities = ["Low", "Medium", "High"];

    const status = validStatuses.includes(body.status) ? body.status : "Open";
    const priority = validPriorities.includes(body.priority) ? body.priority : "Medium";

    // Validate and sanitize inputs
    const title = String(body.title).slice(0, 255); // Limit length
    const description = body.description ? String(body.description).slice(0, 2000) : null;

    const newTask = await db.insert(tasks).values({
        title,
        companyId: parseInt(body.companyId, 10),
        status,
        priority,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        assignedTo: body.assignedTo || null,
        assignedBy: currentUser.id, // Use authenticated user, not body input
        description,
    }).returning();

    return newTask[0];
});
