<script setup lang="ts">
import { useAuth } from '~/composables/auth/useAuth';
import Pagination from '~/components/ui/Pagination.vue';

definePageMeta({
  middleware: ["admin-only"],
});

const { hasRole } = useAuth();

interface ImportLog {
  id: number;
  importedBy: string;
  importedByEmail: string;
  projectName: string;
  targetTeam: string;
  targetAgent: string;
  totalRows: number;
  successCount: number;
  failedCount: number;
  createdCount: number;
  updatedCount: number;
  assignedCount: number;
  createdAt: Date | string;
}

// Pagination state
const currentPage = ref(1);
const limit = ref(20);

// Filter state
const filters = ref({
  dateFrom: '',
  dateTo: '',
  importedBy: '',
  projectName: '',
  targetTeamId: '',
  targetAgentId: '',
});

// Fetch users and teams for filters
const { data: usersData } = await useFetch("/api/users/assignable");
const { data: teamsData } = await useFetch("/api/teams");

const users = computed(() => usersData.value || []);
const teams = computed(() => teamsData.value || []);

// Fetch import logs with pagination and filters
const { data: logsResponse, pending, refresh } = await useFetch("/api/admin/import-log", {
  query: computed(() => {
    const query: Record<string, any> = {
      page: currentPage.value,
      limit: limit.value,
    };
    
    if (filters.value.dateFrom) query.dateFrom = filters.value.dateFrom;
    if (filters.value.dateTo) query.dateTo = filters.value.dateTo;
    if (filters.value.importedBy) query.importedBy = filters.value.importedBy;
    if (filters.value.projectName) query.projectName = filters.value.projectName;
    if (filters.value.targetTeamId) query.targetTeamId = filters.value.targetTeamId;
    if (filters.value.targetAgentId) query.targetAgentId = filters.value.targetAgentId;
    
    return query;
  }),
  default: () => ({ data: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } }),
});

const logs = computed(() => logsResponse.value?.data || []);
const pagination = computed(() => logsResponse.value?.pagination || {
  total: 0,
  page: 1,
  limit: 20,
  pages: 0,
});

function loadPage(page: number) {
  currentPage.value = page;
}

// Filter functions
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function applyFilters() {
  currentPage.value = 1; // Reset to first page when filters change
}

function debounceApplyFilters() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    applyFilters();
  }, 300); // 300ms debounce for text input
}

function clearFilters() {
  filters.value = {
    dateFrom: '',
    dateTo: '',
    importedBy: '',
    projectName: '',
    targetTeamId: '',
    targetAgentId: '',
  };
  currentPage.value = 1;
}

const hasActiveFilters = computed(() => {
  return !!(
    filters.value.dateFrom ||
    filters.value.dateTo ||
    filters.value.importedBy ||
    filters.value.projectName ||
    filters.value.targetTeamId ||
    filters.value.targetAgentId
  );
});

// Edit modal state
const showEditModal = ref(false);
const editingLog = ref<ImportLog | null>(null);
const newProjectName = ref("");
const isUpdating = ref(false);
const updateError = ref("");

// Delete confirmation
const showDeleteConfirm = ref(false);
const logToDelete = ref<ImportLog | null>(null);
const isDeleting = ref(false);

// Format date
const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "-";
  
  let d: Date;
  if (date instanceof Date) {
    d = date;
  } else if (typeof date === 'string') {
    d = new Date(date);
  } else if (typeof date === 'number') {
    d = new Date(date);
  } else {
    return "-";
  }
  
  // Validate date
  if (isNaN(d.getTime())) {
    return "-";
  }
  
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Open edit modal
function openEditModal(log: ImportLog) {
  editingLog.value = log;
  newProjectName.value = log.projectName === "-" ? "" : log.projectName;
  showEditModal.value = true;
  updateError.value = "";
}

// Close edit modal
function closeEditModal() {
  showEditModal.value = false;
  editingLog.value = null;
  newProjectName.value = "";
  updateError.value = "";
}

// Update project name
async function updateProjectName() {
  if (!editingLog.value) return;
  
  isUpdating.value = true;
  updateError.value = "";

  try {
    const { data, error } = await useFetch(`/api/admin/import-log/${editingLog.value.id}`, {
      method: "PUT",
      body: {
        projectName: newProjectName.value || null,
      },
    });

    if (error.value) {
      updateError.value = error.value.message || "Fehler beim Aktualisieren";
    } else {
      await refresh();
      closeEditModal();
    }
  } catch (err: any) {
    updateError.value = err.message || "Ein unerwarteter Fehler ist aufgetreten";
  } finally {
    isUpdating.value = false;
  }
}

// Open delete confirmation
function openDeleteConfirm(log: ImportLog) {
  logToDelete.value = log;
  showDeleteConfirm.value = true;
}

// Close delete confirmation
function closeDeleteConfirm() {
  showDeleteConfirm.value = false;
  logToDelete.value = null;
}

// Delete import log
async function deleteLog() {
  if (!logToDelete.value) return;

  isDeleting.value = true;

  try {
    const { error } = await useFetch(`/api/admin/import-log/${logToDelete.value.id}`, {
      method: "DELETE",
    });

    if (error.value) {
      alert("Fehler beim Löschen: " + error.value.message);
    } else {
      await refresh();
      closeDeleteConfirm();
    }
  } catch (err: any) {
    alert("Ein unerwarteter Fehler ist aufgetreten: " + err.message);
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Import Log</h1>
        <p class="text-sm text-gray-600 mt-1">
          Übersicht aller Excel-Importe und deren Details
        </p>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg border border-gray-200 px-4 py-3 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <!-- Date From -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Von Datum</label>
            <input
              v-model="filters.dateFrom"
              type="date"
              @change="applyFilters"
              class="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <!-- Date To -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Bis Datum</label>
            <input
              v-model="filters.dateTo"
              type="date"
              @change="applyFilters"
              class="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <!-- Imported By -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Importiert von</label>
            <select
              v-model="filters.importedBy"
              @change="applyFilters"
              class="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Alle Benutzer</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
          </div>

          <!-- Project Name -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Projektname</label>
            <input
              v-model="filters.projectName"
              type="text"
              placeholder="Projektname suchen..."
              @input="debounceApplyFilters"
              class="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <!-- Target Team -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Team</label>
            <select
              v-model="filters.targetTeamId"
              @change="applyFilters"
              class="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Alle Teams</option>
              <option v-for="team in teams" :key="team.id" :value="team.id">
                {{ team.name }}
              </option>
            </select>
          </div>

          <!-- Target Agent -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Agent</label>
            <select
              v-model="filters.targetAgentId"
              @change="applyFilters"
              class="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Alle Agents</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Filter Actions -->
        <div v-if="hasActiveFilters" class="mt-3 pt-3 border-t border-gray-200 flex justify-end">
          <UButton
            size="xs"
            color="neutral"
            variant="outline"
            @click="clearFilters"
          >
            Filter zurücksetzen
          </UButton>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- Import Logs Table -->
      <div v-else-if="logs.length > 0" class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Importiert von
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projektname
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team / Agent
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statistiken
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(log.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ log.importedBy }}</div>
                  <div class="text-sm text-gray-500">{{ log.importedByEmail }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ log.projectName }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{{ log.targetTeam }}</div>
                  <div>{{ log.targetAgent }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    <span class="font-medium">{{ log.totalRows }}</span> Zeilen
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    ✓ {{ log.successCount }} erfolgreich
                    <span v-if="log.failedCount > 0" class="text-red-600 ml-2">
                      ✗ {{ log.failedCount }} fehlgeschlagen
                    </span>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    Neu: {{ log.createdCount }} | 
                    Aktualisiert: {{ log.updatedCount }} | 
                    Zugewiesen: {{ log.assignedCount }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end gap-2">
                    <UButton
                      size="xs"
                      color="primary"
                      variant="outline"
                      @click="openEditModal(log)"
                    >
                      Projektname ändern
                    </UButton>
                    <UButton
                      size="xs"
                      color="error"
                      variant="outline"
                      @click="openDeleteConfirm(log)"
                    >
                      Löschen
                    </UButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <Pagination
          :current-page="pagination.page"
          :total-pages="pagination.pages"
          :total="pagination.total"
          @page-change="loadPage"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="bg-white rounded-lg shadow p-12 text-center">
        <p class="text-gray-500">Noch keine Import-Logs vorhanden</p>
      </div>
    </div>

    <!-- Edit Project Name Modal -->
    <Teleport to="body">
      <div
        v-if="showEditModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="closeEditModal"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full" @click.stop>
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              Projektname ändern
            </h3>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Neuer Projektname
              </label>
              <UInput
                v-model="newProjectName"
                placeholder="Projektname eingeben..."
                class="w-full"
              />
              <p class="mt-1 text-xs text-gray-500">
                Alle Firmen aus diesem Import erhalten diesen Projektnamen.
              </p>
            </div>

            <div v-if="updateError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-600">{{ updateError }}</p>
            </div>

            <div class="flex gap-3 justify-end">
              <UButton
                color="neutral"
                variant="outline"
                @click="closeEditModal"
                :disabled="isUpdating"
              >
                Abbrechen
              </UButton>
              <UButton
                color="primary"
                @click="updateProjectName"
                :loading="isUpdating"
              >
                Speichern
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="closeDeleteConfirm"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full" @click.stop>
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              Import-Log löschen?
            </h3>
            
            <p class="text-sm text-gray-600 mb-4">
              Möchten Sie diesen Import-Log wirklich löschen? 
              <strong class="text-gray-900">Alle importierten Firmen und deren zugehörige Daten (Kontakte, Aufgaben, Aktivitäten) werden ebenfalls gelöscht.</strong>
            </p>

            <div v-if="logToDelete" class="mb-4 p-3 bg-gray-50 rounded-lg">
              <p class="text-xs text-gray-600">
                <strong>Datum:</strong> {{ formatDate(logToDelete.createdAt) }}<br>
                <strong>Importiert von:</strong> {{ logToDelete.importedBy }}<br>
                <strong>Zeilen:</strong> {{ logToDelete.totalRows }}
              </p>
            </div>

            <div class="flex gap-3 justify-end">
              <UButton
                color="neutral"
                variant="outline"
                @click="closeDeleteConfirm"
                :disabled="isDeleting"
              >
                Abbrechen
              </UButton>
              <UButton
                color="error"
                @click="deleteLog"
                :loading="isDeleting"
              >
                Löschen
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
