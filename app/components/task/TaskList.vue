<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 bg-white">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <div class="flex items-center gap-4">
          <h2 class="text-xl font-bold text-gray-800">Aufgaben</h2>
          <!-- Search/Filter -->
          <div class="relative w-64">
            <UInput
              v-model="searchQuery"
              icon="i-heroicons-magnifying-glass"
              placeholder="Suchen..."
            />
          </div>
        </div>
        <UButton
          icon="i-heroicons-plus"
          color="primary"
          variant="solid"
          size="sm"
          @click="$emit('create')"
        >
          Neu
        </UButton>
      </div>
    </div>

    <!-- Task Table -->
    <div class="flex-1 overflow-auto">
      <div class="max-w-7xl mx-auto p-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <!-- Modern Header -->
          <div class="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Aufgabenübersicht</h3>
                <p class="text-sm text-gray-500 mt-0.5">
                  {{ filteredTasks.length }} {{ filteredTasks.length === 1 ? 'Aufgabe' : 'Aufgaben' }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <div class="bg-white border border-gray-300 rounded-md px-3 py-1.5 shadow-sm">
                  <span class="text-gray-700 text-sm font-medium">Gesamt: {{ filteredTasks.length }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Aufgabe
                  </th>
                  <th class="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Kunde
                  </th>
                  <th class="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Beschreibung
                  </th>
                  <th class="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Priorität
                  </th>
                  <th class="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Fällig am
                  </th>
                  <th class="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {{ isHistory ? 'Erledigt am' : 'Wiedervorlage' }}
                  </th>
                  <th class="text-center px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                    Aktion
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="task in filteredTasks"
                  :key="task.id"
                  class="transition-all duration-150"
                  :class="getRowClass(task.priority)"
                >
                  <td class="px-6 py-4">
                    <div class="text-sm font-bold text-gray-900">{{ task.title }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm font-bold text-gray-800">{{ task.companyName }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-600 max-w-xs truncate" :title="task.description || ''">
                      {{ task.description || '-' }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {{ task.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getPriorityClass(task.priority)"
                    >
                      {{ task.priority }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-600">{{ formatDate(task.dueDate) }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-600">
                      {{ isHistory ? formatDate(task.completedAt) : formatDate(task.followUpDate) }}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <button
                      @click="$emit('select', task)"
                      class="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-150"
                      title="Bearbeiten"
                    >
                      <UIcon name="i-heroicons-pencil-square" class="w-5 h-5" />
                    </button>
                  </td>
                </tr>
                
                <!-- Empty State -->
                <tr v-if="filteredTasks.length === 0">
                  <td colspan="8" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center">
                      <UIcon name="i-heroicons-clipboard-document-list" class="w-12 h-12 text-gray-300 mb-3" />
                      <p class="text-gray-500 text-sm font-medium">Keine Aufgaben gefunden</p>
                      <p class="text-gray-400 text-xs mt-1">Erstellen Sie eine neue Aufgabe, um loszulegen</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from "~/composables/tasks/useTasks";

const props = defineProps<{
  tasks: Task[] | null;
  selectedTask: Task | null;
  isHistory?: boolean;
}>();

defineEmits<{
  (e: "select", task: Task): void;
  (e: "create"): void;
}>();

const searchQuery = ref("");

const filteredTasks = computed(() => {
  if (!props.tasks) return [];
  if (!searchQuery.value) return props.tasks;
  
  const query = searchQuery.value.toLowerCase();
  return props.tasks.filter(t => 
    t.title.toLowerCase().includes(query) || 
    t.companyName?.toLowerCase().includes(query)
  );
});

const getPriorityClass = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'high': return 'bg-red-100 text-red-700';
    case 'medium': return 'bg-yellow-100 text-yellow-700';
    case 'low': return 'bg-green-100 text-green-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getRowClass = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'high': 
      return 'bg-gradient-to-r from-red-50/50 via-white to-red-50/30 hover:from-red-50 hover:to-red-50/50 border-l-2 border-l-red-400';
    case 'medium': 
      return 'bg-gradient-to-r from-yellow-50/50 via-white to-yellow-50/30 hover:from-yellow-50 hover:to-yellow-50/50 border-l-2 border-l-yellow-400';
    case 'low': 
      return 'bg-gradient-to-r from-green-50/50 via-white to-green-50/30 hover:from-green-50 hover:to-green-50/50 border-l-2 border-l-green-400';
    default: 
      return 'bg-white hover:bg-gray-50 border-l-2 border-l-transparent';
  }
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('de-DE');
};
</script>
