<template>
  <div class="bg-white p-6">
    <!-- Header Actions -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold text-gray-900">
        {{ isNew ? 'Neue Aufgabe' : 'Aufgabe bearbeiten' }}
      </h2>
      <div class="flex gap-2">
        <UButton
          v-if="!isNew && formData.status !== 'Erledigt'"
          color="success"
          variant="solid"
          icon="i-heroicons-check-circle"
          size="sm"
          @click="markAsComplete"
        >
          Als Erledigt markieren
        </UButton>
        <UButton
          v-if="!isNew"
          color="error"
          variant="ghost"
          icon="i-heroicons-trash"
          size="sm"
          @click="$emit('delete', task!.id)"
        >
          Löschen
        </UButton>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-x-mark"
          size="sm"
          @click="$emit('close')"
        >
          Abbrechen
        </UButton>
        <UButton
          color="primary"
          icon="i-heroicons-check"
          size="sm"
          :loading="saving"
          @click="save"
        >
          Speichern
        </UButton>
      </div>
    </div>

    <!-- Form -->
    <div class="space-y-6">
      <!-- Title -->
      <div>
        <label class="text-sm font-medium text-gray-700 mb-2 block">Titel / Kategorie *</label>
        <UInput v-model="formData.title" placeholder="z.B. Rückruf vereinbaren" size="lg" />
      </div>

      <!-- Company Selection -->
      <div>
        <label class="text-sm font-medium text-gray-700 mb-2 block">Kunde *</label>
        <select
          v-model="formData.companyId"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option :value="undefined">Kunde auswählen</option>
          <option v-for="company in companies" :key="company.id" :value="company.id">
            {{ company.companyName }}
          </option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <!-- Status -->
        <div>
          <label class="text-sm font-medium text-gray-700 mb-2 block">Status</label>
          <select
            v-model="formData.status"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Nicht angefasst">Nicht angefasst</option>
            <option value="angefasst">angefasst</option>
            <option value="Recherchiert">Recherchiert</option>
            <option value="Bearbeitet">Bearbeitet</option>
            <option value="Liegt auf Wiedervorlage">Liegt auf Wiedervorlage</option>
            <option value="Nicht erreicht">Nicht erreicht</option>
            <option value="Erledigt">Erledigt</option>
          </select>
        </div>

        <!-- Priority -->
        <div>
          <label class="text-sm font-medium text-gray-700 mb-2 block">Priorität</label>
          <select
            v-model="formData.priority"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Niedrig">Niedrig</option>
            <option value="Mittel">Mittel</option>
            <option value="Hoch">Hoch</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <!-- Due Date -->
        <div>
          <label class="text-sm font-medium text-gray-700 mb-2 block">Zu erledigen bis</label>
          <UInput type="date" v-model="formData.dueDate" />
        </div>

        <!-- Follow Up Date -->
        <div>
          <label class="text-sm font-medium text-gray-700 mb-2 block">Wiedervorlage am</label>
          <UInput type="date" v-model="formData.followUpDate" />
        </div>
      </div>

      <!-- Assignment -->
      <div class="grid grid-cols-2 gap-6">
        <div>
          <label class="text-sm font-medium text-gray-700 mb-2 block">Zugewiesen an</label>
          <select
            v-model="formData.assignedTo"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option :value="undefined">Benutzer auswählen</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.name }}
            </option>
          </select>
          <p class="text-xs text-gray-500 mt-1">
            Agents können Aufgaben nur sich selbst zuweisen.
          </p>
        </div>
        
        <div v-if="!isNew">
          <label class="text-sm font-medium text-gray-700 mb-2 block">Zugewiesen von</label>
          <UInput :model-value="task?.assignerName || '-'" disabled />
        </div>
      </div>

      <!-- Description -->
      <div>
        <label class="text-sm font-medium text-gray-700 mb-2 block">Beschreibung</label>
        <UTextarea v-model="formData.description" :rows="5" placeholder="Details zur Aufgabe..." />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from "~/composables/tasks/useTasks";

const props = defineProps<{
  task: Task | null;
  isNew: boolean;
  saving: boolean;
  companies: any[];
  users: any[];
}>();

const emit = defineEmits<{
  (e: "save", data: any): void;
  (e: "delete", id: number): void;
  (e: "close"): void;
}>();

const formData = ref({
  title: "",
  companyId: undefined as number | undefined,
  status: "angefasst",
  priority: "Mittel",
  dueDate: "",
  followUpDate: "",
  assignedTo: undefined as string | undefined,
  description: "",
});

// Watch for task changes to update form data
watch(() => props.task, (newTask) => {
  if (newTask && !props.isNew) {
    formData.value = {
      title: newTask.title,
      companyId: newTask.companyId,
      status: newTask.status,
      priority: newTask.priority,
      dueDate: (newTask.dueDate ? new Date(newTask.dueDate).toISOString().split('T')[0] : "") || "",
      followUpDate: (newTask.followUpDate ? new Date(newTask.followUpDate).toISOString().split('T')[0] : "") || "",
      assignedTo: newTask.assignedTo || undefined,
      description: newTask.description || "",
    };
  } else if (props.isNew) {
    formData.value = {
      title: "",
      companyId: undefined,
      status: "angefasst",
      priority: "Mittel",
      dueDate: "",
      followUpDate: "",
      assignedTo: undefined,
      description: "",
    };
  }
}, { immediate: true });

const markAsComplete = () => {
  formData.value.status = "Erledigt";
  save();
};

const save = () => {
  if (!formData.value.title || !formData.value.companyId) {
    alert("Bitte füllen Sie alle erforderlichen Felder aus (Titel und Kunde)");
    return;
  }
  
  emit("save", formData.value);
};
</script>
