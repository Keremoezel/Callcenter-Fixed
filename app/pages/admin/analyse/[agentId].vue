<template>
  <div class="min-h-screen p-4 sm:p-6" style="background-color: #F8FAFC;">
    <!-- Header + Back -->
    <div class="mb-4">
      <button
        @click="navigateTo('/admin/analyse')"
        class="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-3"
      >
        <span class="i-heroicons-arrow-left mr-1.5 text-base"></span>
        Zurück zur Übersicht
      </button>
      <div v-if="agent" class="flex flex-wrap items-center gap-x-4 gap-y-1">
        <h1 class="text-2xl font-bold text-gray-900">{{ agent.name }}</h1>
        <span class="text-sm text-gray-500">{{ agent.email }}</span>
        <span v-if="agent.teamName" class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">{{ agent.teamName }}</span>
        <span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">{{ agent.role }}</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white rounded-lg border border-gray-200/80 p-8 text-center">
      <div class="inline-block animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
      <p class="mt-3 text-sm text-gray-500">Lade Aktivitäten...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-white rounded-lg border border-red-200 p-4">
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>

    <!-- Content -->
    <div v-else-if="agent" :key="agentId" class="space-y-4">
      <!-- KPI row with trend + sparkline -->
      <div class="bg-white rounded-lg border border-gray-200/80 p-3 sm:p-4">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-gray-400 text-lg leading-none">👥</span>
              <span class="text-sm text-gray-500">Kunden zugewiesen</span>
              <span class="text-sm font-semibold text-gray-900">{{ summaryStats.totalAssigned }}</span>
              <span v-if="kpiTrends.totalAssigned != null" class="flex items-center text-xs font-medium" :class="kpiTrends.totalAssigned >= 0 ? 'text-emerald-600' : 'text-red-600'">
                <span v-if="kpiTrends.totalAssigned >= 0">↑</span><span v-else>↓</span>
                {{ Math.abs(kpiTrends.totalAssigned) }}%
              </span>
            </div>
            <AdminMiniSparkline :data="sparklineData.assignments" :width="120" :height="24" />
          </div>
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-gray-400 text-lg leading-none">⏸️</span>
              <span class="text-sm text-gray-500">Nicht angefasst</span>
              <span class="text-sm font-semibold text-gray-900">{{ summaryStats.nichtAngefasst }}</span>
              <span v-if="kpiTrends.nichtAngefasst != null" class="flex items-center text-xs font-medium" :class="kpiTrends.nichtAngefasst <= 0 ? 'text-emerald-600' : 'text-red-600'">
                <span v-if="kpiTrends.nichtAngefasst <= 0">↓</span><span v-else>↑</span>
                {{ Math.abs(kpiTrends.nichtAngefasst) }}%
              </span>
            </div>
            <AdminMiniSparkline :data="sparklineData.statusChanges" :width="120" :height="24" />
          </div>
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-gray-400 text-lg leading-none">✅</span>
              <span class="text-sm text-gray-500">Erledigt</span>
              <span class="text-sm font-semibold text-gray-900">{{ summaryStats.erledigtCount }}</span>
            </div>
            <AdminMiniSparkline :data="sparklineData.erledigt" :width="120" :height="24" />
          </div>
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-gray-400 text-lg leading-none">⏱️</span>
              <span class="text-sm text-gray-500">Reaktionszeit</span>
              <span class="text-sm font-semibold text-gray-900">{{ formatReactionTime(averageReactionTimeHours) }}</span>
            </div>
            <div class="h-6 w-[120px]" />
          </div>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="bg-white rounded-lg border border-gray-200/80 px-3 py-2 flex flex-wrap items-center gap-3">
        <select
          v-model="selectedDateRange"
          @change="handleDateRangeChange"
          class="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[140px]"
        >
          <option value="">Alle Zeit</option>
          <option value="today">Heute</option>
          <option value="week">Letzte 7 Tage</option>
          <option value="month">Letzter Monat</option>
          <option value="quarter">Letztes Quartal</option>
        </select>
        <select
          v-model="statusFilter"
          @change="handleStatusFilterChange"
          class="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[200px]"
        >
          <option value="">Alle Status</option>
          <option value="Nicht angefasst">Nicht angefasst</option>
          <option value="angefasst">angefasst</option>
          <option value="Recherchiert">Recherchiert</option>
          <option value="Bearbeitet">Bearbeitet</option>
          <option value="Liegt auf Wiedervorlage">Liegt auf Wiedervorlage</option>
          <option value="Nicht erreicht">Nicht erreicht</option>
          <option value="Erledigt">Erledigt</option>
        </select>
        <input
          v-model="companySearch"
          type="text"
          placeholder="Kunde suchen..."
          class="flex-1 min-w-[120px] text-sm border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      
      <Teleport to="body">
        <div
          v-if="showChangeLogModal"
          class="fixed inset-0 z-50 overflow-y-auto"
          @click.self="showChangeLogModal = false"
        >
          <div class="fixed inset-0 bg-gray-900/50 transition-opacity" />
          <div class="flex min-h-full items-center justify-center p-4">
            <div
              class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
              @click.stop
            >
              <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 gap-2">
                <h3 class="text-lg font-semibold text-gray-900">Änderungsverlauf</h3>
                <button
                  type="button"
                  class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  @click="showChangeLogModal = false"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Schließen
                </button>
              </div>
              
              <div v-if="!changeLogLoading && changeLogEntries.length > 0" class="px-4 py-2 border-b border-gray-100 bg-gray-50/50">
                <label class="text-xs font-medium text-gray-600 block mb-1">Kunde</label>
                <select
                  v-model="changeLogSelectedCompanyId"
                  class="w-full text-sm border border-gray-200 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option :value="null">Alle Kunden</option>
                  <option
                    v-for="opt in changeLogCompanyOptions"
                    :key="opt.id"
                    :value="opt.id"
                  >
                    {{ opt.name }}
                  </option>
                </select>
              </div>
              <div class="px-4 py-3 overflow-y-auto flex-1 min-h-0">
                <div v-if="changeLogLoading" class="py-8 text-center text-gray-500">
                  Lade Einträge…
                </div>
                <div v-else-if="!filteredChangeLogEntries.length" class="py-8 text-center text-gray-500">
                  {{ changeLogSelectedCompanyId != null ? 'Keine Änderungen für diesen Kunden.' : 'Keine Änderungen erfasst.' }}
                </div>
                <ul v-else class="space-y-3">
                  <li
                    v-for="entry in filteredChangeLogEntries"
                    :key="entry.id"
                    class="flex flex-col gap-1 py-2 px-3 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                      <span class="text-sm font-medium text-gray-800">{{ entry.label }}</span>
                      <span class="text-xs text-gray-600 shrink-0" :title="entry.createdAt ? new Date(entry.createdAt).toLocaleString('de-DE') : ''">
                        <span class="text-gray-500 font-medium">Änderung am:</span>
                        {{ formatChangeLogDate(entry.createdAt) }}
                      </span>
                    </div>
                    <div v-if="entry.companyName && changeLogSelectedCompanyId == null" class="text-xs text-blue-600 font-medium">
                      {{ entry.companyName }}
                    </div>
                    <div v-if="entry.oldValue != null && entry.newValue != null" class="text-xs text-gray-600">
                      <span class="line-through">{{ entry.oldValue }}</span>
                      <span class="mx-1">→</span>
                      <span>{{ entry.newValue }}</span>
                    </div>
                    <div v-if="entry.userName" class="text-xs text-gray-500">
                      von {{ entry.userName }}
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Status filter pills above timeline -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="pill in activityTypePills"
          :key="pill.value"
          type="button"
          class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
          :class="activityTypeFilter === pill.value
            ? pill.activeClass
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          @click="activityTypeFilter = pill.value"
        >
          {{ pill.label }}
        </button>
      </div>

      <!-- Timeline -->
      <div class="bg-white rounded-lg border border-gray-200/80 overflow-hidden">
        <div class="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-800">Aktivitäts-Timeline</h2>
          <span v-if="pagination" class="text-xs text-gray-500">{{ pagination.total }} Einträge</span>
        </div>
        <div v-if="(filteredTimeline || []).length === 0" class="px-3 py-8 text-center text-sm text-gray-500">
          Keine Aktivitäten gefunden
        </div>
        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="(event, index) in (filteredTimeline || [])"
            :key="`${event.timestamp}-${event.companyId}-${index}`"
            class="group flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 sm:py-2.5 hover:bg-gray-50/80 transition-colors"
          >
            <span class="text-xs text-gray-500 tabular-nums shrink-0 w-[100px] sm:w-[120px]">
              {{ formatTimestamp(event.timestamp) }}
            </span>
            <!-- Einheitliche Zeile: Badge · von [Name] · Kunde: [Firma] · Aufgabe/Aktivität -->
            <span
              class="shrink-0 px-2 py-0.5 rounded text-xs font-medium"
              :class="getEventBadgeClass(event)"
            >
              {{ event.type === 'status_change' ? (event.details?.newStatus || '–') : getEventLabel(event) }}
            </span>
            <span v-if="getTimelineAssignedBy(event)" class="text-xs text-gray-500 shrink-0">
              von {{ getTimelineAssignedBy(event) }}
            </span>
            <span class="text-sm text-gray-800 shrink-0 font-medium">
              {{ event.companyName }}
            </span>
            <span v-if="getTimelineTaskOrSubject(event)" class="text-xs text-gray-600 truncate min-w-0 flex-1" :title="getTimelineTaskOrSubject(event) ?? undefined">
              {{ event.type === 'activity' ? getTimelineTaskOrSubject(event) : 'Aufgabe: ' + getTimelineTaskOrSubject(event) }}
            </span>
            <!-- Änderungsverlauf (nur dieser Kunde) + Kunde anzeigen (Auge) -->
            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                class="p-1.5 rounded text-gray-500 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                title="Änderungsverlauf für diesen Kunden"
                @click="openChangeLogForCompany(event.companyId)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <NuxtLink
                :to="`/kunden?company=${event.companyId}`"
                class="p-1.5 rounded text-gray-500 hover:bg-blue-100 hover:text-blue-700"
                title="Kunde anzeigen"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Footer pagination: "Showing X-Y of Z" + controls -->
        <div
          v-if="pagination"
          class="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 border-t border-gray-100 bg-gray-50/50"
        >
          <div class="flex items-center gap-3 text-sm text-gray-600">
            <span class="whitespace-nowrap">
              {{ showingRangeText }}
            </span>
            <span class="text-gray-400">|</span>
            <span>Pro Seite</span>
            <select
              :value="timelineLimit"
              @change="onLimitChange"
              class="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="25">25</option>
            </select>
          </div>
          <Pagination
            v-if="pagination.pages > 1"
            :current-page="pagination.page"
            :total-pages="pagination.pages"
            :total="pagination.total"
            @page-change="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Pagination from "~/components/ui/Pagination.vue";
import AdminMiniSparkline from "~/components/admin/MiniSparkline.vue";

definePageMeta({
  middleware: ["admin-only"],
});

const route = useRoute();
const agentId = route.params.agentId as string;

const defaultLimit = 10;
const loading = ref(true);
const error = ref<string | null>(null);
const agent = ref<any>(null);
const timeline = ref<any[]>([]);
const pagination = ref<any>(null);
const totalAssignedCount = ref<number>(0);
const erledigtCount = ref<number>(0);
const offenCount = ref<number>(0);
const averageReactionTimeHours = ref<number | null>(null);

const selectedDateRange = ref("");
const statusFilter = ref("");
const companySearch = ref("");
const activityTypeFilter = ref<string>("all");
const currentPage = ref(1);
const timelineLimit = ref(defaultLimit);


const showChangeLogModal = ref(false);
const changeLogEntries = ref<Array<{
  id: number;
  companyId: number;
  label: string;
  companyName: string | null;
  oldValue: string | null;
  newValue: string | null;
  userName: string | null;
  createdAt: string;
}>>([]);
const changeLogLoading = ref(false);
const changeLogSelectedCompanyId = ref<number | null>(null);

const changeLogCompanyOptions = computed(() => {
  const seen = new Map<number, string>();
  changeLogEntries.value.forEach((e) => {
    if (e.companyId != null && e.companyName != null && !seen.has(e.companyId)) {
      seen.set(e.companyId, e.companyName);
    }
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
});

const filteredChangeLogEntries = computed(() => {
  const list = changeLogEntries.value;
  const companyId = changeLogSelectedCompanyId.value;
  if (companyId == null) return list;
  return list.filter((e) => e.companyId === companyId);
});

async function loadChangeLogData() {
  if (!agentId) return;
  changeLogLoading.value = true;
  changeLogEntries.value = [];
  try {
    const data = await $fetch<typeof changeLogEntries.value>(`/api/admin/analyse/${agentId}/change-log`, {
      credentials: "include",
    });
    changeLogEntries.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(e);
    changeLogEntries.value = [];
  } finally {
    changeLogLoading.value = false;
  }
}

async function openChangeLog() {
  if (!agentId) return;
  showChangeLogModal.value = true;
  changeLogSelectedCompanyId.value = null;
  await loadChangeLogData();
}

/** Änderungsverlauf nur für diesen Kunden (aus Timeline-Zeile) */
async function openChangeLogForCompany(companyId: number) {
  if (!agentId) return;
  changeLogSelectedCompanyId.value = companyId;
  showChangeLogModal.value = true;
  if (changeLogEntries.value.length === 0) {
    await loadChangeLogData();
  }
}

function formatChangeLogDate(createdAt: string | null): string {
  if (!createdAt) return "Datum unbekannt";
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "Datum unbekannt";
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const activityTypePills = [
  { value: "all", label: "Alle", activeClass: "bg-gray-800 text-white" },
  { value: "status_change", label: "Aktueller Status", activeClass: "bg-amber-100 text-amber-800" },
];

const summaryStats = computed(() => {
  const statusChanges = timeline.value.filter((e: any) => e.type === "status_change");
  const nichtAngefasst = statusChanges.filter((e: any) => e.details?.newStatus === "Nicht angefasst").length;
  return {
    totalAssigned: totalAssignedCount.value,
    nichtAngefasst,
    erledigtCount: erledigtCount.value,
    offenCount: offenCount.value,
  };
});

function getEventTypeKey(event: any) {
  if (event.type === "activity") return event.details?.activityType || "activity";
  return event.type;
}

const filteredTimeline = computed(() => {
  let list = timeline.value;
  if (companySearch.value) {
    const q = companySearch.value.toLowerCase();
    list = list.filter(e => e.companyName?.toLowerCase().includes(q));
  }
  if (activityTypeFilter.value !== "all") {
    list = list.filter(e => getEventTypeKey(e) === activityTypeFilter.value);
  }
  return list;
});

const showingRangeText = computed(() => {
  const p = pagination.value;
  if (!p) return "";
  const total = p.total;
  const page = p.page;
  const limit = timelineLimit.value;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return `Zeige ${from}–${to} von ${total} Einträgen`;
});

function bucketLast24h(events: any[], typeFilter: (e: any) => boolean) {
  const now = Date.now();
  const buckets = Array(24).fill(0);
  const oneHour = 60 * 60 * 1000;
  events.filter(typeFilter).forEach((e: any) => {
    const t = new Date(e.timestamp).getTime();
    if (t >= now - 24 * oneHour) {
      const idx = Math.min(23, Math.floor((t - (now - 24 * oneHour)) / oneHour));
      buckets[idx]++;
    }
  });
  const max = Math.max(1, ...buckets);
  return buckets.map(v => (v / max) * 100);
}

const sparklineData = computed(() => ({
  assignments: bucketLast24h(timeline.value, (e: any) => e.type === "status_change" && e.details?.newStatus === "Nicht angefasst"),
  statusChanges: bucketLast24h(timeline.value, (e: any) => e.type === "status_change"),
  erledigt: bucketLast24h(timeline.value, (e: any) => e.type === "status_change" && e.details?.newStatus === "Erledigt"),
}));

function trendFromHalves(events: any[], typeFilter: (e: any) => boolean) {
  const filtered = events.filter(typeFilter);
  if (filtered.length < 2) return null;
  const sorted = [...filtered].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const mid = Math.floor(sorted.length / 2);
  const first = sorted.slice(0, mid).length;
  const second = sorted.slice(mid).length;
  if (first === 0) return second > 0 ? 100 : 0;
  return Math.round(((second - first) / first) * 100);
}

const kpiTrends = computed(() => {
  const list = timeline.value;
  return {
    totalAssigned: trendFromHalves(list, (e: any) => e.type === "status_change" && e.details?.newStatus === "Nicht angefasst"),
    nichtAngefasst: (() => {
      const statusChanges = list.filter((e: any) => e.type === "status_change");
      if (statusChanges.length < 2) return null;
      const sorted = [...statusChanges].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const mid = Math.floor(sorted.length / 2);
      const firstHalf = sorted.slice(0, mid).filter((e: any) => e.details?.newStatus === "Nicht angefasst").length;
      const secondHalf = sorted.slice(mid).filter((e: any) => e.details?.newStatus === "Nicht angefasst").length;
      const first = firstHalf || 1;
      return Math.round(((secondHalf - firstHalf) / first) * 100);
    })(),
  };
});

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Reaktionszeit: Ø Stunden → "Ø 2,5 h" oder "Ø 1,2 Tage" oder "–" */
function formatReactionTime(hours: number | null): string {
  if (hours == null || hours < 0) return "–";
  if (hours < 24) return `Ø ${(Math.round(hours * 10) / 10).toLocaleString("de-DE")} h`;
  const days = Math.round((hours / 24) * 10) / 10;
  return `Ø ${days.toLocaleString("de-DE")} Tage`;
}

function getEventLabel(event: any) {
  if (event.type === "assignment") return "Zuweisung";
  if (event.type === "status_change") return "Aktueller Status";
  if (event.type === "activity") {
    const t = event.details?.activityType;
    if (t === "CALL") return "Anruf";
    if (t === "EMAIL") return "E-Mail";
    if (t === "MEETING") return "Meeting";
    if (t === "NOTE") return "Notiz";
  }
  return "Aktivität";
}

function getEventBadgeClass(event: any) {
  if (event.type === "assignment") return "bg-blue-100 text-blue-800";
  if (event.type === "status_change") return "bg-amber-100 text-amber-800";
  if (event.type === "activity") {
    const t = event.details?.activityType;
    if (t === "CALL") return "bg-emerald-100 text-emerald-800";
    if (t === "EMAIL") return "bg-violet-100 text-violet-800";
    if (t === "MEETING") return "bg-orange-100 text-orange-800";
    if (t === "NOTE") return "bg-gray-100 text-gray-700";
  }
  return "bg-gray-100 text-gray-700";
}

function getActionSource(event: any) {
  if (event.type === "assignment" && event.details?.assignedBy) return `von ${event.details.assignedBy}`;
  if (event.type === "status_change" && event.details?.newStatus) return event.details.newStatus;
  if (event.type === "activity" && event.details?.subject) return event.details.subject;
  return "–";
}

/** Für einheitliche Timeline-Zeile: Wer hat zugewiesen / geändert (von …). */
function getTimelineAssignedBy(event: any): string | null {
  if (event.type === "assignment" || event.type === "status_change") return event.details?.assignedBy ?? null;
  return null;
}

/** Für einheitliche Timeline-Zeile: Aufgabentitel oder Aktivitäts-Beschreibung. */
function getTimelineTaskOrSubject(event: any): string | null {
  if (event.type === "assignment" || event.type === "status_change") return event.details?.taskTitle ?? null;
  if (event.type === "activity" && event.details?.subject) return event.details.subject;
  if (event.type === "activity") {
    const t = event.details?.activityType;
    if (t === "CALL") return "Anruf";
    if (t === "EMAIL") return "E-Mail";
    if (t === "MEETING") return "Meeting";
    if (t === "NOTE") return "Notiz";
  }
  return null;
}

function onEdit(event: any) {
  navigateTo(`/kunden?company=${event.companyId}&edit=1`);
}

async function loadTimeline() {
  loading.value = true;
  error.value = null;
  try {
    const params: Record<string, string | number> = {
      page: currentPage.value,
      limit: timelineLimit.value,
    };
    if (selectedDateRange.value) {
      const { dateFrom, dateTo } = getDateRange(selectedDateRange.value);
      params.dateFrom = dateFrom;
      params.dateTo = dateTo;
    }
    if (statusFilter.value) params.status = statusFilter.value;
    const response = await $fetch<{ agent: any; totalAssigned?: number; erledigtCount?: number; offenCount?: number; averageReactionTimeHours?: number | null; timeline: any[]; pagination: any }>(`/api/admin/analyse/${agentId}`, {
      params,
      credentials: "include",
    });
    agent.value = response.agent;
    totalAssignedCount.value = response.totalAssigned ?? 0;
    erledigtCount.value = response.erledigtCount ?? 0;
    offenCount.value = response.offenCount ?? 0;
    averageReactionTimeHours.value = response.averageReactionTimeHours ?? null;
    timeline.value = response.timeline ?? [];
    pagination.value = response.pagination;
  } catch (err: any) {
    error.value = err.data?.statusMessage || err.message || "Fehler beim Laden der Timeline";
  } finally {
    loading.value = false;
  }
}

function getDateRange(range: string) {
  const now = new Date();
  let dateFrom: string;
  const dateTo = now.toISOString();
  if (range === "today") {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  } else if (range === "week") {
    dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (range === "month") {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  } else if (range === "quarter") {
    const q = Math.floor(now.getMonth() / 3) * 3;
    dateFrom = new Date(now.getFullYear(), q, 1).toISOString();
  } else {
    dateFrom = new Date(0).toISOString();
  }
  return { dateFrom, dateTo };
}

function handleDateRangeChange() {
  currentPage.value = 1;
  loadTimeline();
}

function handleStatusFilterChange() {
  currentPage.value = 1;
  loadTimeline();
}

function handlePageChange(page: number) {
  currentPage.value = page;
  loadTimeline();
}

function onLimitChange(ev: Event) {
  const val = (ev.target as HTMLSelectElement).value;
  timelineLimit.value = parseInt(val, 10) || defaultLimit;
  currentPage.value = 1;
  loadTimeline();
}

onMounted(() => loadTimeline());

watch(
  () => route.params.agentId,
  (newId) => {
    if (newId && newId !== agentId) loadTimeline();
  }
);
</script>
