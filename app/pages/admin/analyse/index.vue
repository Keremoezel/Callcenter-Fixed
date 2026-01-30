<template>
  <div class="min-h-screen p-4 sm:p-6" style="background-color: #F8FAFC;">
    <!-- Header -->
    <div class="mb-4">
      <h1 class="text-2xl font-bold text-gray-900">Agent Analyse</h1>
      <p class="text-sm text-gray-600 mt-0.5">Übersicht über Agent-Aktivitäten und Statistiken</p>
    </div>

    <!-- Compact filters: single horizontal line -->
    <div class="bg-white rounded-lg border border-gray-200/80 px-3 py-2.5 mb-4 flex flex-wrap items-center gap-3">
      <select
        v-model="selectedRole"
        @change="handleRoleFilterChange"
        class="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[140px]"
      >
        <option value="">Alle Rollen</option>
        <option value="Admin">Admin</option>
        <option value="Teamlead">Teamlead</option>
        <option value="Agent">Agent</option>
      </select>
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
        v-if="userRole === 'Admin'"
        v-model="selectedTeam"
        @change="loadAgentStats"
        class="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[140px]"
      >
        <option value="">Alle Teams</option>
        <option v-for="team in teams" :key="team.id" :value="team.id">
          {{ team.name }}
        </option>
      </select>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Agent suchen..."
        class="flex-1 min-w-[160px] text-sm border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white rounded-lg border border-gray-200/80 p-8 text-center">
      <div class="inline-block animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
      <p class="mt-3 text-sm text-gray-500">Lade Statistiken...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-white rounded-lg border border-red-200 p-4 mb-4">
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>

    <!-- Table with sticky header -->
    <div v-else class="bg-white rounded-lg border border-gray-200/80 overflow-hidden flex flex-col max-h-[calc(100vh-220px)]">
      <div class="overflow-auto flex-1 min-h-0">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Agent
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Team
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-gray-100 rounded-t"
                @click="toggleSort('totalAssigned')"
              >
                <span class="inline-flex items-center gap-1">
                  Total Kunden
                  <span v-if="sortKey === 'totalAssigned'" class="inline-block w-3 h-3 text-gray-500">
                    <svg v-if="sortDir === 'asc'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5 10l5-5 5 5H5z" /></svg>
                    <svg v-else class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M15 10l-5 5-5-5h10z" /></svg>
                  </span>
                </span>
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-gray-100"
                @click="toggleSort('nichtAngefasst')"
              >
                <span class="inline-flex items-center gap-1">
                  Nicht angefasst
                  <span v-if="sortKey === 'nichtAngefasst'" class="inline-block w-3 h-3 text-gray-500">
                    <svg v-if="sortDir === 'asc'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5 10l5-5 5 5H5z" /></svg>
                    <svg v-else class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M15 10l-5 5-5-5h10z" /></svg>
                  </span>
                </span>
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-gray-100"
                @click="toggleSort('erledigtCount')"
              >
                <span class="inline-flex items-center gap-1">
                  Erledigt
                  <span v-if="sortKey === 'erledigtCount'" class="inline-block w-3 h-3 text-gray-500">
                    <svg v-if="sortDir === 'asc'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5 10l5-5 5 5H5z" /></svg>
                    <svg v-else class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M15 10l-5 5-5-5h10z" /></svg>
                  </span>
                </span>
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-gray-100"
                @click="toggleSort('offenCount')"
              >
                <span class="inline-flex items-center gap-1">
                  Offen
                  <span v-if="sortKey === 'offenCount'" class="inline-block w-3 h-3 text-gray-500">
                    <svg v-if="sortDir === 'asc'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5 10l5-5 5 5H5z" /></svg>
                    <svg v-else class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M15 10l-5 5-5-5h10z" /></svg>
                  </span>
                </span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Letzte Zuweisung
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-32">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr
              v-for="agent in sortedAgents"
              :key="agent.agentId"
              class="hover:bg-blue-50/60 transition-colors"
            >
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span
                    class="shrink-0 w-2.5 h-2.5 rounded-full"
                    :class="agentOnline(agent) ? 'bg-emerald-500' : 'bg-gray-300'"
                    :title="agentOnline(agent) ? 'Online' : 'Offline'"
                  />
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ agent.agentName }}</div>
                    <div class="text-xs text-gray-500">{{ agent.agentEmail }}</div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span v-if="agent.teamName" class="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {{ agent.teamName }}
                </span>
                <span v-else class="text-xs text-gray-400">Kein Team</span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {{ agent.statistics.totalAssigned }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span
                  v-if="agent.statistics.nichtAngefasst > 0"
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="agent.statistics.nichtAngefasst >= 5 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'"
                >
                  {{ agent.statistics.nichtAngefasst }}
                </span>
                <span v-else class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  0
                </span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {{ agent.statistics.erledigtCount ?? 0 }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {{ agent.statistics.offenCount ?? 0 }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                <span v-if="agent.statistics.recentAssignment">{{ formatDate(agent.statistics.recentAssignment) }}</span>
                <span v-else>–</span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <NuxtLink
                  :to="`/admin/analyse/${agent.agentId}`"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Details
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </NuxtLink>
              </td>
            </tr>
            <tr v-if="sortedAgents.length === 0">
              <td colspan="8" class="px-4 py-8 text-center text-sm text-gray-500">
                Keine Agenten gefunden
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination footer: "Showing 1-10 of 50" + controls -->
      <div
        v-if="pagination"
        class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50/80 shrink-0"
      >
        <p class="text-sm text-gray-600 whitespace-nowrap">
          {{ showingRangeText }}
        </p>
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
</template>

<script setup lang="ts">
import { useAuth } from "~/composables/auth/useAuth";
import Pagination from "~/components/ui/Pagination.vue";

definePageMeta({
  middleware: ["admin-only"],
});

const { user } = useAuth();
const userRole = computed(() => user.value?.role);

const loading = ref(true);
const error = ref<string | null>(null);
const agentStats = ref<any[]>([]);
const pagination = ref<any>(null);
const teams = ref<any[]>([]);

const selectedRole = ref("");
const selectedDateRange = ref("");
const selectedTeam = ref("");
const searchQuery = ref("");
const currentPage = ref(1);

const sortKey = ref<"totalAssigned" | "nichtAngefasst" | "erledigtCount" | "offenCount" | null>(null);
const sortDir = ref<"asc" | "desc">("asc");

const filteredAgents = computed(() => {
  if (!searchQuery.value) return agentStats.value;
  const q = searchQuery.value.toLowerCase();
  return agentStats.value.filter(
    (a) =>
      a.agentName?.toLowerCase().includes(q) ||
      a.agentEmail?.toLowerCase().includes(q)
  );
});

const sortedAgents = computed(() => {
  const list = [...filteredAgents.value];
  if (!sortKey.value) return list;
  const key = sortKey.value;
  const dir = sortDir.value === "asc" ? 1 : -1;
  list.sort((a, b) => {
    const va = a.statistics[key] ?? 0;
    const vb = b.statistics[key] ?? 0;
    return (Number(va) - Number(vb)) * dir;
  });
  return list;
});

const showingRangeText = computed(() => {
  const p = pagination.value;
  if (!p) return "";
  const total = p.total;
  const page = p.page;
  const limit = 50;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return `Zeige ${from}–${to} von ${total} Agenten`;
});

function toggleSort(key: "totalAssigned" | "nichtAngefasst" | "erledigtCount" | "offenCount") {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDir.value = "asc";
  }
}

function agentOnline(agent: any): boolean {
  const last = agent.statistics?.recentAssignment;
  if (!last) return false;
  const diff = Date.now() - new Date(last).getTime();
  return diff < 30 * 60 * 1000;
}

const loadAgentStats = async () => {
  loading.value = true;
  error.value = null;
  try {
    const params: Record<string, string | number> = {
      page: currentPage.value,
      limit: 50,
    };
    if (selectedDateRange.value) {
      const { dateFrom, dateTo } = getDateRange(selectedDateRange.value);
      params.dateFrom = dateFrom;
      params.dateTo = dateTo;
    }
    if (selectedTeam.value) params.teamId = selectedTeam.value;
    if (selectedRole.value) params.role = selectedRole.value;
    const response = await $fetch("/api/admin/analyse", { params });
    agentStats.value = response.data;
    pagination.value = response.pagination;
  } catch (err: any) {
    error.value = err.data?.statusMessage || "Fehler beim Laden der Statistiken";
  } finally {
    loading.value = false;
  }
};

const loadTeams = async () => {
  try {
    const response = await $fetch("/api/teams");
    teams.value = response;
  } catch (e) {
    console.error(e);
  }
};

function handleRoleFilterChange() {
  currentPage.value = 1;
  loadAgentStats();
}

function handleDateRangeChange() {
  currentPage.value = 1;
  loadAgentStats();
}

function handlePageChange(page: number) {
  currentPage.value = page;
  loadAgentStats();
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

onMounted(() => {
  loadAgentStats();
  if (userRole.value === "Admin") loadTeams();
});
</script>
