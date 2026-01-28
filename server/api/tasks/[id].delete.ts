import { useDrizzle } from "../../utils/drizzle";
import { tasks } from "../../database/schema";
import { eq } from "drizzle-orm";

export default eventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    const db = useDrizzle(event);

    if (!id) {
        throw createError({ statusCode: 400, message: "Missing task ID" });
    }

    await db.delete(tasks).where(eq(tasks.id, Number(id)));

    return { success: true };
});
