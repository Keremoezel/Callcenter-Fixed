import { ref, type Ref } from "vue";

export interface Task {
    id: number;
    title: string;
    companyId: number;
    companyName?: string;
    status: string;
    priority: string;
    dueDate: string | null;
    followUpDate: string | null;
    assignedBy: string | null;
    assignedTo: string | null;
    assignerName?: string | null;
    assigneeName?: string | null;
    description: string | null;
    completedAt?: string | null;
    createdAt: string;
    updatedAt?: string | null;
}

export function useTasks() {
    const { data: tasks, error, status, refresh } = useFetch<Task[]>("/api/tasks");
    const selectedTask: Ref<Task | null> = ref(null);

    const selectTask = (task: Task) => {
        selectedTask.value = task;
    };

    const createTask = async (taskData: Partial<Task>) => {
        await $fetch("/api/tasks", {
            method: "POST",
            body: taskData,
        });
        await refresh();
    };

    const updateTask = async (id: number, taskData: Partial<Task>) => {
        await $fetch(`/api/tasks/${id}`, {
            method: "PUT",
            body: taskData,
        });
        await refresh();
        // Update selected task if it's the one being updated
        if (selectedTask.value && selectedTask.value.id === id) {
            const updated = tasks.value?.find((t) => t.id === id);
            if (updated) selectedTask.value = updated;
        }
    };

    const deleteTask = async (id: number) => {
        await $fetch(`/api/tasks/${id}`, {
            method: "DELETE",
        });
        await refresh();
        if (selectedTask.value && selectedTask.value.id === id) {
            selectedTask.value = null;
        }
    };

    return {
        tasks,
        selectedTask,
        selectTask,
        createTask,
        updateTask,
        deleteTask,
        status,
        error,
        refresh,
    };
}
