<template>
  <div class="min-h-screen bg-white">
    <!-- Tabs -->
    <div class="border-b border-gray-200 bg-white">
      <div class="max-w-7xl mx-auto px-6">
        <nav class="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            @click="activeTab = 'active'"
            :class="[
              activeTab === 'active'
                ? 'border-blue-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-700',
              'whitespace-nowrap border-b-2 py-3.5 px-1 text-sm font-normal transition-colors'
            ]"
          >
            Aktive Aufgaben
            <span
              :class="[
                activeTab === 'active' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600',
                'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'
              ]"
            >
              {{ activeTasks.length }}
            </span>
          </button>
          <button
            @click="activeTab = 'history'"
            :class="[
              activeTab === 'history'
                ? 'border-blue-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-700',
              'whitespace-nowrap border-b-2 py-3.5 px-1 text-sm font-normal transition-colors'
            ]"
          >
            Aufgaben-Historie
            <span
              :class="[
                activeTab === 'history' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600',
                'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'
              ]"
            >
              {{ historyTasks.length }}
            </span>
          </button>
        </nav>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="max-w-7xl mx-auto px-6 pt-4 pb-3">
      <div class="px-2.5 py-2 bg-gray-50/50 border border-gray-200/60 rounded-lg">
        <!-- Primary Filters Row -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <!-- Status Filter -->
          <div class="flex-shrink-0">
            <select
              v-model="filterStatus"
              @change="applyFilters"
              class="h-7 px-2.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400/40 focus:border-blue-400 focus:bg-white transition-all"
              :class="filterStatus ? 'border-blue-400/70 bg-blue-50/50 text-gray-900' : 'text-gray-600'"
            >
              <option value="">Status: Alle</option>
              <option value="Nicht angefasst">Nicht angefasst</option>
              <option value="angefasst">angefasst</option>
              <option value="Recherchiert">Recherchiert</option>
              <option value="Bearbeitet">Bearbeitet</option>
              <option value="Liegt auf Wiedervorlage">Liegt auf Wiedervorlage</option>
              <option value="Nicht erreicht">Nicht erreicht</option>
              <option value="Erledigt">Erledigt</option>
            </select>
          </div>

          <!-- Priority Filter -->
          <div class="flex-shrink-0">
            <select
              v-model="filterPriority"
              @change="applyFilters"
              class="h-7 px-2.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400/40 focus:border-blue-400 focus:bg-white transition-all"
              :class="filterPriority ? 'border-blue-400/70 bg-blue-50/50 text-gray-900' : 'text-gray-600'"
            >
              <option value="">Priorität: Alle</option>
              <option value="Hoch">Hoch</option>
              <option value="Mittel">Mittel</option>
              <option value="Niedrig">Niedrig</option>
            </select>
          </div>

          <!-- Assigned To Filter -->
          <div class="flex-shrink-0">
            <select
              v-model="filterAssignedTo"
              @change="applyFilters"
              class="h-7 px-2.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400/40 focus:border-blue-400 focus:bg-white transition-all"
              :class="filterAssignedTo ? 'border-blue-400/70 bg-blue-50/50 text-gray-900' : 'text-gray-600'"
            >
              <option value="">Zugewiesen an: Alle</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
          </div>

          <!-- More Filters Button -->
          <button
            @click="showMoreFilters = !showMoreFilters"
            class="h-7 px-2.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-1.5 border border-transparent hover:border-gray-200"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>{{ showMoreFilters ? 'Weniger' : 'Mehr' }} Filter</span>
          </button>

          <!-- Spacer -->
          <div class="flex-grow"></div>

          <!-- Pagination Info -->
          <div class="text-xs text-gray-400 flex-shrink-0">
            <span class="font-medium text-gray-600">{{ pagination?.total || 0 }}</span> Aufgaben
            <span class="mx-1.5 text-gray-300">•</span>
            Seite {{ currentPage || 1 }}/{{ pagination?.pages || 1 }}
          </div>

          <!-- Pagination Controls -->
          <div class="flex items-center gap-0.5 flex-shrink-0">
            <button
              @click="loadPage((currentPage || 1) - 1)"
              :disabled="(currentPage || 1) === 1"
              class="w-6 h-6 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-700 rounded disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              title="Vorherige Seite"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              @click="loadPage((currentPage || 1) + 1)"
              :disabled="(currentPage || 1) === (pagination?.pages || 1)"
              class="w-6 h-6 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-700 rounded disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              title="Nächste Seite"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Secondary Filters (Collapsible) -->
        <div v-if="showMoreFilters" class="mt-2 pt-2 border-t border-gray-100">
          <div class="flex items-center gap-1.5 flex-wrap">
            <!-- Company Filter -->
            <div class="flex-shrink-0">
              <select
                v-model="filterCompany"
                @change="applyFilters"
                class="h-7 px-2.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400/40 focus:border-blue-400 focus:bg-white transition-all"
                :class="filterCompany ? 'border-blue-400/70 bg-blue-50/50 text-gray-900' : 'text-gray-600'"
              >
                <option value="">Kunde: Alle</option>
                <option v-for="company in companies" :key="company.id" :value="company.id">
                  {{ company.companyName }}
                </option>
              </select>
            </div>

            <!-- Due Date Filter -->
            <div class="flex-shrink-0">
              <select
                v-model="filterDueDate"
                @change="applyFilters"
                class="h-7 px-2.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400/40 focus:border-blue-400 focus:bg-white transition-all"
                :class="filterDueDate ? 'border-blue-400/70 bg-blue-50/50 text-gray-900' : 'text-gray-600'"
              >
                <option value="">Fällig: Alle</option>
                <option value="overdue">Überfällig</option>
                <option value="today">Heute</option>
                <option value="week">Diese Woche</option>
                <option value="month">Dieser Monat</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Active Filter Chips -->
        <div v-if="hasActiveFilters" class="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100">
          <span class="text-xs text-gray-400 mr-0.5">Aktiv:</span>
          
          <button
            v-if="filterStatus"
            @click="filterStatus = ''; applyFilters()"
            class="inline-flex items-center gap-1.5 h-6 px-2 text-xs bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors group"
          >
            <span class="text-gray-600">{{ filterStatus }}</span>
            <svg class="w-2.5 h-2.5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            v-if="filterPriority"
            @click="filterPriority = ''; applyFilters()"
            class="inline-flex items-center gap-1.5 h-6 px-2 text-xs bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors group"
          >
            <span class="text-gray-600">{{ filterPriority }}</span>
            <svg class="w-2.5 h-2.5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            v-if="filterAssignedTo"
            @click="filterAssignedTo = ''; applyFilters()"
            class="inline-flex items-center gap-1.5 h-6 px-2 text-xs bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors group"
          >
            <span class="text-gray-600">{{ getUserName(filterAssignedTo) }}</span>
            <svg class="w-2.5 h-2.5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            v-if="filterCompany"
            @click="filterCompany = ''; applyFilters()"
            class="inline-flex items-center gap-1.5 h-6 px-2 text-xs bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors group"
          >
            <span class="text-gray-600">{{ getCompanyName(filterCompany) }}</span>
            <svg class="w-2.5 h-2.5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            v-if="filterDueDate"
            @click="filterDueDate = ''; applyFilters()"
            class="inline-flex items-center gap-1.5 h-6 px-2 text-xs bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors group"
          >
            <span class="text-gray-600">{{ getDueDateLabel(filterDueDate) }}</span>
            <svg class="w-2.5 h-2.5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            @click="clearFilters"
            class="ml-1 text-xs text-gray-400 hover:text-gray-600 underline decoration-dotted transition-colors"
          >
            Alle löschen
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="status === 'pending'" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Task Table -->
    <div v-else>
      <TaskList
        :tasks="displayedTasks"
        :selected-task="selectedTask"
        :is-history="activeTab === 'history'"
        @select="openEditModal"
        @create="openCreateModal"
      />
    </div>

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
import { useAuth } from "~/composables/auth/useAuth";

const {
  tasks,
  pagination,
  loadPage,
  page: currentPage,
  selectedTask,
  selectTask,
  createTask,
  updateTask,
  deleteTask,
  refresh,
  status,
  setFilters,
} = useTasks();

const { user } = useAuth();
const { data: companiesResponse } = await useFetch("/api/customers");
const companies = computed(() => companiesResponse.value?.data || []);
const { data: users } = await useFetch<any[]>("/api/users/assignable");

// Filter state
const filterStatus = ref('');
const filterPriority = ref('');
const filterAssignedTo = ref('');
const filterCompany = ref('');
const filterDueDate = ref('');
const showMoreFilters = ref(false);

// Active filters check
const hasActiveFilters = computed(() => {
  return filterStatus.value || filterPriority.value || filterAssignedTo.value || 
         filterCompany.value || filterDueDate.value;
});

// Apply filters
const applyFilters = () => {
  setFilters({
    status: filterStatus.value,
    priority: filterPriority.value,
    assignedTo: filterAssignedTo.value,
    company: filterCompany.value,
    dueDate: filterDueDate.value,
  });
};

// Clear all filters
const clearFilters = () => {
  filterStatus.value = '';
  filterPriority.value = '';
  filterAssignedTo.value = '';
  filterCompany.value = '';
  filterDueDate.value = '';
  applyFilters();
};

// Helper functions for chips
const getUserName = (userId: string) => {
  const foundUser = users.value?.find((u: any) => u.id === userId);
  return foundUser?.name || userId;
};

const getCompanyName = (companyId: string) => {
  const company = companies.value.find((c: any) => c.id === parseInt(companyId));
  return company?.companyName || companyId;
};

const getDueDateLabel = (value: string) => {
  const labels: Record<string, string> = {
    overdue: 'Überfällig',
    today: 'Heute',
    week: 'Diese Woche',
    month: 'Dieser Monat',
  };
  return labels[value] || value;
};

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
      // FIX: Use actual logged-in user ID for assignedBy
      const assignerId = user.value?.id; 
      await createTask({
        ...data,
        assignedBy: assignerId
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