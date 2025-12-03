<template>
  <div class="min-h-screen bg-white">
    <!-- Tabs -->
    <div class="border-b border-gray-200 bg-white">
      <div class="max-w-7xl mx-auto px-6">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            @click="activeTab = 'active'"
            :class="[
              activeTab === 'active'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
              'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors'
            ]"
          >
            Aktive Aufgaben
            <span
              :class="[
                activeTab === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600',
                'ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
              ]"
            >
              {{ activeTasks.length }}
            </span>
          </button>
          <button
            @click="activeTab = 'history'"
            :class="[
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
              'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors'
            ]"
          >
            Aufgaben-Historie
            <span
              :class="[
                activeTab === 'history' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600',
                'ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
              ]"
            >
              {{ historyTasks.length }}
            </span>
          </button>
        </nav>
      </div>
    </div>

    <!-- Task Table -->
    <TaskList
      :tasks="displayedTasks"
      :selected-task="selectedTask"
      :is-history="activeTab === 'history'"
      @select="openEditModal"
      @create="openCreateModal"
    />

    <!-- Task Edit/Create Modal -->
    <Teleport to="body">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="closeModal"
      >
        <div class="fixed inset-0 bg-gray-900 bg-opacity-30 transition-opacity"></div>
        
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            @click.stop
          >
            <TaskDetail
              :task="selectedTask"
              :is-new="isNewTask"
              :saving="saving"
              :companies="companies || []"
              :users="users || []"
              @save="handleSave"
              @delete="handleDelete"
              @close="closeModal"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import TaskList from "~/components/task/TaskList.vue";
import TaskDetail from "~/components/task/TaskDetail.vue";
import { useTasks } from "~/composables/tasks/useTasks";

const {
  tasks,
  selectedTask,
  selectTask,
  createTask,
  updateTask,
  deleteTask,
  refresh
} = useTasks();

const { data: companies } = await useFetch("/api/customers");
const { data: users } = await useFetch<any[]>("/api/users");

const activeTab = ref<'active' | 'history'>('active');
const isModalOpen = ref(false);
const isNewTask = ref(false);
const saving = ref(false);

const activeTasks = computed(() => {
  return (tasks.value || []).filter(task => task.status !== 'Erledigt');
});

const historyTasks = computed(() => {
  return (tasks.value || []).filter(task => task.status === 'Erledigt');
});

const displayedTasks = computed(() => {
  return activeTab.value === 'active' ? activeTasks.value : historyTasks.value;
});

const openCreateModal = () => {
  selectedTask.value = null;
  isNewTask.value = true;
  isModalOpen.value = true;
};

const openEditModal = (task: any) => {
  isNewTask.value = false;
  selectTask(task);
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedTask.value = null;
};

const handleSave = async (data: any) => {
  saving.value = true;
  try {
    if (isNewTask.value) {
      const currentUserId = users.value && users.value.length > 0 ? users.value[0].id : null;
      await createTask({
        ...data,
        assignedBy: currentUserId
      });
      isNewTask.value = false;
    } else if (selectedTask.value) {
      await updateTask(selectedTask.value.id, data);
    }
    closeModal();
  } catch (e) {
    console.error("Failed to save task", e);
    alert("Fehler beim Speichern der Aufgabe");
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (id: number) => {
  if (!confirm("Möchten Sie diese Aufgabe wirklich löschen?")) return;
  
  try {
    await deleteTask(id);
    closeModal();
  } catch (e) {
    console.error("Failed to delete task", e);
    alert("Fehler beim Löschen der Aufgabe");
  }
};

watch(isModalOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

onUnmounted(() => {
  document.body.style.overflow = '';
});
</script>