import { useDrizzle } from "../../utils/drizzle";

export default eventHandler(async (event) => {
    const db = useDrizzle(event);

    const tasks = await db.query.tasks.findMany({
        orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
        with: {
            company: {
                columns: {
                    id: true,
                    name: true,
                },
            },
            assignee: {
                columns: {
                    id: true,
                    name: true,
                    avatar: true,
                },
            },
            assigner: {
                columns: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    return tasks.map((task) => ({
        ...task,
        companyName: task.company?.name,
        assigneeName: task.assignee?.name,
        assignerName: task.assigner?.name,
    }));
});
