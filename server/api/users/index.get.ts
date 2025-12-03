import { useDrizzle } from "../../utils/drizzle";

export default eventHandler(async () => {
    const db = useDrizzle();

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
