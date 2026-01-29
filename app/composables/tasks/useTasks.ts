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
    // Pagination state
    const page = ref(1);
    const limit = ref(10);
    
    // Filter state
    const filters = ref({
        status: '',
        priority: '',
        assignedTo: '',
        company: '',
        dueDate: '',
    });
    
    const { data: response, error, status, refresh } = useFetch("/api/tasks", {
        query: computed(() => ({
            page: page.value,
            limit: limit.value,
            status: filters.value.status || undefined,
            priority: filters.value.priority || undefined,
            assignedTo: filters.value.assignedTo || undefined,
            company: filters.value.company || undefined,
            dueDate: filters.value.dueDate || undefined,
        })),
    });

    // Extract tasks from paginated response
    const tasks = computed(() => response.value?.data || []);
    const pagination = computed(() => response.value?.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        pages: 0,
    });

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

    const loadPage = (newPage: number) => {
        page.value = newPage;
    };

    const setFilters = (newFilters: typeof filters.value) => {
        filters.value = newFilters;
        page.value = 1; // Reset to first page when filters change
    };

    return {
        tasks,
        pagination,
        selectedTask,
        selectTask,
        createTask,
        updateTask,
        deleteTask,
        status,
        error,
        refresh,
        loadPage,
        page,
        setFilters,
    };
}
