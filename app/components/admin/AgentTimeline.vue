<template>
  <div class="space-y-4">
    <div
      v-for="(event, index) in events"
      :key="index"
      class="relative pl-8 pb-8"
      :class="{ 'pb-0': index === events.length - 1 }"
    >
      <!-- Timeline line -->
      <div
        v-if="index !== events.length - 1"
        class="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200"
      ></div>

      <!-- Event card -->
      <div class="relative">
        <!-- Icon -->
        <div
          class="absolute left-0 flex items-center justify-center w-8 h-8 rounded-full"
          :class="getIconClass(event.type, event.details)"
        >
          <span class="text-sm">{{ getIcon(event.type, event.details) }}</span>
        </div>

        <!-- Event content -->
        <div class="ml-4 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <!-- Header -->
          <div class="flex items-start justify-between mb-2">
            <div>
              <h4 class="text-sm font-semibold text-gray-900">
                {{ getEventTitle(event) }}
              </h4>
              <p class="text-sm text-gray-600 mt-1">
                {{ event.companyName }}
              </p>
            </div>
            <span class="text-xs text-gray-500 whitespace-nowrap ml-4">
              {{ formatTimestamp(event.timestamp) }}
            </span>
          </div>

          <!-- Details -->
          <div class="mt-3 space-y-2">
            <!-- Assignment details -->
            <template v-if="event.type === 'assignment'">
              <div class="flex items-center space-x-2 text-sm">
                <span class="text-gray-600">Status:</span>
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="event.details.status === 'Neu Importiert' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'"
                >
                  {{ event.details.status }}
                </span>
              </div>
              <div v-if="event.details.assignedBy" class="text-sm text-gray-600">
                Zugewiesen von: <span class="font-medium">{{ event.details.assignedBy }}</span>
              </div>
            </template>

            <!-- Status change details -->
            <template v-if="event.type === 'status_change'">
              <div class="text-sm text-gray-600">
                Task: <span class="font-medium">{{ event.details.taskTitle }}</span>
              </div>
              <div class="flex items-center space-x-2 text-sm">
                <span class="text-gray-600">Neuer Status:</span>
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusBadgeClass(event.details.newStatus)"
                >
                  {{ event.details.newStatus }}
                </span>
              </div>
            </template>

            <!-- Activity details -->
            <template v-if="event.type === 'activity'">
              <div class="flex items-center space-x-2 text-sm">
                <span class="text-gray-600">Typ:</span>
                <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {{ getActivityTypeName(event.details.activityType) }}
                </span>
              </div>
              <div v-if="event.details.subject" class="text-sm text-gray-700">
                <span class="font-medium">Betreff:</span> {{ event.details.subject }}
              </div>
              <div v-if="event.details.content" class="text-sm text-gray-600 line-clamp-2">
                {{ event.details.content }}
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="events.length === 0" class="text-center py-12 text-gray-500">
      Keine Aktivitäten gefunden
    </div>
  </div>
</template>

<script setup lang="ts">
interface TimelineEvent {
  type: "assignment" | "status_change" | "activity";
  timestamp: string;
  companyId: number;
  companyName: string;
  details: any;
}

interface Props {
  events: TimelineEvent[];
}

defineProps<Props>();

const getIcon = (type: string, details: any) => {
  if (type === "assignment") return "👤";
  if (type === "status_change") return "📝";
  if (type === "activity") {
    if (details.activityType === "CALL") return "📞";
    if (details.activityType === "EMAIL") return "✉️";
    if (details.activityType === "MEETING") return "🤝";
    if (details.activityType === "NOTE") return "📌";
  }
  return "•";
};

const getIconClass = (type: string, details: any) => {
  if (type === "assignment") return "bg-blue-100 text-blue-600";
  if (type === "status_change") return "bg-yellow-100 text-yellow-600";
  if (type === "activity") {
    if (details.activityType === "CALL") return "bg-green-100 text-green-600";
    if (details.activityType === "EMAIL") return "bg-purple-100 text-purple-600";
    if (details.activityType === "MEETING") return "bg-orange-100 text-orange-600";
    if (details.activityType === "NOTE") return "bg-gray-100 text-gray-600";
  }
  return "bg-gray-100 text-gray-600";
};

const getEventTitle = (event: TimelineEvent) => {
  if (event.type === "assignment") {
    return "Kunde zugewiesen";
  }
  if (event.type === "status_change") {
    return "Task Status geändert";
  }
  if (event.type === "activity") {
    const activityType = event.details.activityType;
    if (activityType === "CALL") return "Anruf getätigt";
    if (activityType === "EMAIL") return "E-Mail gesendet";
    if (activityType === "MEETING") return "Meeting durchgeführt";
    if (activityType === "NOTE") return "Notiz hinzugefügt";
  }
  return "Aktivität";
};

const getActivityTypeName = (type: string) => {
  const names: Record<string, string> = {
    CALL: "Anruf",
    EMAIL: "E-Mail",
    MEETING: "Meeting",
    NOTE: "Notiz",
  };
  return names[type] || type;
};

const getStatusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    "Nicht angefasst": "bg-orange-100 text-orange-800",
    "angefasst": "bg-blue-100 text-blue-800",
    "Recherchiert": "bg-indigo-100 text-indigo-800",
    "Bearbeitet": "bg-purple-100 text-purple-800",
    "Liegt auf Wiedervorlage": "bg-yellow-100 text-yellow-800",
    "Nicht erreicht": "bg-red-100 text-red-800",
    "Erledigt": "bg-green-100 text-green-800",
  };
  return classes[status] || "bg-gray-100 text-gray-800";
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>
