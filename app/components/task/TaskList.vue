<template>
  <div class="min-h-screen bg-white flex flex-col">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <h2 class="text-base font-semibold text-gray-900">Aufgaben</h2>
          <!-- Search/Filter -->
          <div class="relative w-56">
            <UInput
              v-model="searchQuery"
              icon="i-heroicons-magnifying-glass"
              placeholder="Suchen..."
              size="xs"
            />
          </div>
        </div>
        <UButton
          icon="i-heroicons-plus"
          color="primary"
          variant="solid"
          size="xs"
          @click="$emit('create')"
        >
          Neue Aufgabe
        </UButton>
      </div>
    </div>

    <!-- Task Table -->
    <div class="flex-1 overflow-auto">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <!-- Modern Header -->
          <div class="bg-white border-b border-gray-200 px-5 py-3">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-900">Aufgabenübersicht</h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ filteredTasks.length }} {{ filteredTasks.length === 1 ? 'Aufgabe' : 'Aufgaben' }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <div class="bg-white border border-gray-200 rounded px-2.5 py-1">
                  <span class="text-gray-600 text-xs font-medium">Gesamt: {{ filteredTasks.length }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-white border-b border-gray-100">
                  <th class="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Aufgabe
                  </th>
                  <th class="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Kunde
                  </th>
                  <th class="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap min-w-[7rem]">
                    Zugewiesen an
                  </th>
                  <th class="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Beschreibung
                  </th>
                  <th class="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th class="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Priorität
                  </th>
                  <th class="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Fällig am
                  </th>
                  <th class="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {{ isHistory ? 'Erledigt am' : 'Wiedervorlage' }}
                  </th>
                  <th class="text-center px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide w-16">
                    Aktion
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white">
                <tr
                  v-for="task in filteredTasks"
                  :key="task.id"
                  class="transition-all duration-150"
                  :class="getRowClass(task.priority)"
                >
                  <td class="px-5 py-3 border-b border-gray-100">
                    <div class="text-sm font-medium text-gray-900">{{ task.title }}</div>
                  </td>
                  <td class="px-5 py-3 border-b border-gray-100">
                    <div class="text-sm font-medium text-gray-700">{{ task.companyName }}</div>
                  </td>
                  <td class="px-5 py-3 border-b border-gray-100">
                    <div class="text-sm text-gray-700">{{ task.assigneeName || '–' }}</div>
                  </td>
                  <td class="px-5 py-3 border-b border-gray-100">
                    <div class="text-xs text-gray-500 max-w-xs truncate" :title="task.description || ''">
                      {{ task.description || '-' }}
                    </div>
                  </td>
                  <td class="px-5 py-3 border-b border-gray-100">
                    <span 
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      :class="getStatusClass(task.status)"
                    >
                      {{ task.status }}
                    </span>
                  </td>
                  <td class="px-5 py-3 border-b border-gray-100">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      :class="getPriorityClass(task.priority)"
                    >
                      {{ task.priority }}
                    </span>
                  </td>
                  <td class="px-5 py-3 border-b border-gray-100">
                    <div class="text-xs text-gray-600">{{ formatDate(task.dueDate) }}</div>
                  </td>
                  <td class="px-5 py-3 border-b border-gray-100">
                    <div class="text-xs text-gray-600">
                      {{ isHistory ? formatDate(task.completedAt) : formatDate(task.followUpDate) }}
                    </div>
                  </td>
                  <td class="px-5 py-3 text-center border-b border-gray-100">
                    <button
                      @click="$emit('select', task)"
                      class="inline-flex items-center justify-center w-7 h-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all duration-150"
                      title="Bearbeiten"
                    >
                      <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                
                <!-- Empty State -->
                <tr v-if="filteredTasks.length === 0">
                  <td colspan="8" class="px-5 py-16 text-center">
                    <div class="flex flex-col items-center">
                      <UIcon name="i-heroicons-clipboard-document-list" class="w-10 h-10 text-gray-300 mb-2" />
                      <p class="text-gray-600 text-sm font-medium">Keine Aufgaben gefunden</p>
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

const getStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'nicht angefasst': return 'bg-gray-50 text-gray-700 border border-gray-200';
    case 'angefasst': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    case 'recherchiert': return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'bearbeitet': return 'bg-purple-50 text-purple-700 border border-purple-200';
    case 'liegt auf wiedervorlage': return 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'nicht erreicht': return 'bg-red-50 text-red-700 border border-red-200';
    case 'erledigt': return 'bg-green-50 text-green-700 border border-green-200';
    default: return 'bg-gray-50 text-gray-600 border border-gray-100';
  }
};

const getPriorityClass = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'hoch': return 'bg-red-50 text-red-700 border border-red-100';
    case 'mittel': return 'bg-yellow-50 text-yellow-700 border border-yellow-100';
    case 'niedrig': return 'bg-green-50 text-green-700 border border-green-100';
    default: return 'bg-gray-50 text-gray-600 border border-gray-100';
  }
};

const getRowClass = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'hoch': 
      return 'bg-red-50/30 hover:bg-red-50/50 border-l-2 border-l-red-300';
    case 'mittel': 
      return 'bg-yellow-50/30 hover:bg-yellow-50/50 border-l-2 border-l-yellow-300';
    case 'niedrig': 
      return 'bg-green-50/30 hover:bg-green-50/50 border-l-2 border-l-green-300';
    default: 
      return 'bg-white hover:bg-gray-50/50 border-l-2 border-l-transparent';
  }
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('de-DE');
};
</script>
