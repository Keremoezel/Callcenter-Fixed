import { useDrizzle } from "../../utils/drizzle";

export default eventHandler(async (event) => {
    const db = useDrizzle(event);

    const users = await db.query.users.findMany({
        columns: {
            id: true,
            name: true,
            role: true,
            avatar: true,
        },
    });

    return users;
});
