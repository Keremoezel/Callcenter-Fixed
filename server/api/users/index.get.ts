import { useDrizzle } from "../../utils/drizzle";

export default eventHandler(async (event) => {
    const db = useDrizzle(event);

    const users = await db.query.user.findMany({
        columns: {
            id: true,
            name: true,
            role: true,
            image: true,
        },
    });

    return users;
});
