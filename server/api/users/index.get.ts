import { useDrizzle } from "../../utils/drizzle";

export default eventHandler(async (event) => {
    const db = useDrizzle(event);

    const allUsers = await db.query.users.findMany({
        columns: {
            id: true,
            name: true,
            role: true,
            image: true,
        },
    });

    return allUsers;
});
