<template>
  <div
    :class="[
      'bg-white border-r border-gray-200 transition-all duration-300 ease-in-out relative',
      isCollapsed ? 'w-16' : 'w-1/3',
    ]"
  >
    <!-- Collapse/Expand Button - Wine Red Theme -->
    <button
      @click="toggleCollapse"
      @mouseenter="isButtonHovered = true"
      @mouseleave="isButtonHovered = false"
      :class="[
        'absolute top-3 z-10 flex items-center justify-center transition-all',
        'text-white shadow-lg hover:shadow-xl',
        'rounded-full',
        isCollapsed ? '-right-4 w-10 h-10' : '-right-3 w-8 h-8'
      ]"
      :style="{
        backgroundColor: isButtonHovered ? 'var(--winered-medium)' : 'var(--winered-light)',
      }"
      :title="isCollapsed ? 'Kundenliste einblenden' : 'Kundenliste ausblenden'"
    >
      <svg
        :class="[
          'text-white transition-transform',
          isCollapsed ? 'w-5 h-5 rotate-180' : 'w-4 h-4'
        ]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>

    <!-- Collapsed State - Wine Red Themed (Clickable) -->
    <div
      v-if="isCollapsed"
      class="h-full flex flex-col items-center justify-center cursor-pointer hover:bg-red-50 transition-colors py-6"
      @click="toggleCollapse"
      title="Kundenliste einblenden"
    >
      <div class="mb-6 p-3 rounded-full" :style="{ backgroundColor: 'var(--winered-light)' }">
        <svg
          class="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <div class="flex flex-col items-center" style="writing-mode: vertical-rl; text-orientation: mixed;">
        <span class="text-xs font-bold tracking-wider" :style="{ color: 'var(--winered-medium)' }">
          KUNDEN
        </span>
      </div>
    </div>

    <!-- Expanded State - Full List -->
    <div v-else class="p-3">
      <div class="mb-3 flex justify-between items-center pr-8">
        <h2 class="text-base font-bold text-gray-800">Zugewiesene Kunden</h2>
        <div v-if="hasRole('Admin') || hasRole('Teamlead')" class="flex gap-2">
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-heroicons-document-arrow-down"
            @click="downloadSample"
            title="Beispiel-Excel herunterladen"
          >
            Vorlage
          </UButton>
          <UButton
            size="xs"
            color="primary"
            variant="soft"
            icon="i-heroicons-arrow-up-tray"
            @click="triggerFileUpload"
          >
            Excel Import
          </UButton>
        </div>
      </div>

      <!-- Lightweight Filter Bar -->
      <div class="mb-3 px-3 py-2.5 bg-[#FAFAFA] rounded-lg">
        <!-- Primary Filters Row -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Search Input -->
          <div class="flex-shrink-0">
            <div class="relative">
              <input
                v-model="searchQuery"
                @input="applyFilters"
                type="text"
                placeholder="Suche Kunde..."
                class="h-8 pl-8 pr-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all w-48"
                :class="searchQuery ? 'border-blue-400/60 ring-1 ring-blue-400/30' : ''"
              />
              <svg 
                class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- Agent Filter -->
          <div class="flex-shrink-0">
            <select
              v-model="filterAgent"
              @change="applyFilters"
              class="h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
              :class="filterAgent ? 'border-blue-400/60 ring-1 ring-blue-400/30' : ''"
            >
              <option value="">Agent: Alle</option>
              <option v-for="agent in availableAgents" :key="agent.id" :value="agent.id">
                {{ agent.name }}
              </option>
            </select>
          </div>

          <!-- Project Filter -->
          <div class="flex-shrink-0">
            <select
              v-model="filterProject"
              @change="applyFilters"
              class="h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
              :class="filterProject ? 'border-blue-400/60 ring-1 ring-blue-400/30' : ''"
            >
              <option value="">Projekt: Alle</option>
              <option v-for="project in availableProjects" :key="project" :value="project">
                {{ project }}
              </option>
            </select>
          </div>

          <!-- More Filters Button -->
          <button
            @click="showMoreFilters = !showMoreFilters"
            class="h-8 px-3 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>{{ showMoreFilters ? 'Weniger' : 'Mehr' }} Filter</span>
          </button>

          <!-- Spacer -->
          <div class="flex-grow"></div>

          <!-- Pagination Info -->
          <div class="text-xs text-gray-500 flex-shrink-0">
            <span class="font-medium text-gray-700">{{ pagination?.total || 0 }}</span> Kunden
            <span class="mx-1.5 text-gray-300">•</span>
            Seite {{ currentPage || 1 }}/{{ pagination?.pages || 1 }}
          </div>

          <!-- Pagination Controls -->
          <div class="flex items-center gap-0.5 flex-shrink-0">
            <button
              @click="$emit('page-change', (currentPage || 1) - 1)"
              :disabled="(currentPage || 1) === 1"
              class="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Vorherige Seite"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              @click="$emit('page-change', (currentPage || 1) + 1)"
              :disabled="(currentPage || 1) === (pagination?.pages || 1)"
              class="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Nächste Seite"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Secondary Filters (Collapsible) -->
        <div v-if="showMoreFilters" class="mt-2 pt-2 border-t border-gray-200/60">
          <!-- First Row -->
          <div class="flex items-center gap-2 flex-wrap">
            <!-- Team Filter -->
            <div class="flex-shrink-0">
              <select
                v-model="filterTeam"
                @change="applyFilters"
                class="h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
                :class="filterTeam ? 'border-blue-400/60 ring-1 ring-blue-400/30' : ''"
              >
                <option value="">Team: Alle</option>
                <option v-for="team in availableTeams" :key="team.id" :value="team.id">
                  {{ team.name }}
                </option>
              </select>
            </div>

            <!-- Status Filter -->
            <div class="flex-shrink-0">
              <select
                v-model="filterStatus"
                @change="applyFilters"
                class="h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
                :class="filterStatus ? 'border-blue-400/60 ring-1 ring-blue-400/30' : ''"
              >
                <option value="">Status: Alle</option>
                <option v-for="status in availableStatuses" :key="status" :value="status">
                  {{ status }}
                </option>
              </select>
            </div>

            <!-- Assigned Date Filter -->
            <div class="flex-shrink-0">
              <select
                v-model="filterAssignedDate"
                @change="applyFilters"
                class="h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
                :class="filterAssignedDate ? 'border-blue-400/60 ring-1 ring-blue-400/30' : ''"
              >
                <option value="">Zugewiesen: Alle</option>
                <option value="today">Heute</option>
                <option value="week">Diese Woche</option>
                <option value="month">Dieser Monat</option>
                <option value="quarter">Dieses Quartal</option>
              </select>
            </div>

            <!-- Last Activity Filter -->
            <div class="flex-shrink-0">
              <select
                v-model="filterLastActivity"
                @change="applyFilters"
                class="h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
                :class="filterLastActivity ? 'border-blue-400/60 ring-1 ring-blue-400/30' : ''"
              >
                <option value="">Letzte Aktivität: Alle</option>
                <option value="today">Heute</option>
                <option value="week">Diese Woche</option>
                <option value="month">Dieser Monat</option>
                <option value="older">Älter als 1 Monat</option>
              </select>
            </div>

            <!-- Upload Date Filter -->
            <div class="flex-shrink-0">
              <select
                v-model="filterDate"
                @change="applyFilters"
                class="h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
                :class="filterDate ? 'border-blue-400/60 ring-1 ring-blue-400/30' : ''"
              >
                <option value="">Hochgeladen: Alle</option>
                <option value="today">Heute</option>
                <option value="week">Diese Woche</option>
                <option value="month">Dieser Monat</option>
                <option value="quarter">Dieses Quartal</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Active Filter Chips -->
        <div v-if="hasActiveFilters" class="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-200/60">
          <span class="text-xs text-gray-500 mr-1">Aktive Filter:</span>
          
          <button
            v-if="searchQuery"
            @click="searchQuery = ''; applyFilters()"
            class="inline-flex items-center gap-1.5 h-6 px-2 text-xs bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors group"
          >
            <span class="text-gray-700">Suche: "{{ searchQuery }}"</span>
            <svg class="w-3 h-3 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <button
            v-if="filterAgent"
            @click="filterAgent = ''; applyFilters()"
            class="inline-flex items-center gap-1.5 h-6 px-2 text-xs bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors group"
          >
            <span class="text-gray-700">{{ getAgentName(filterAgent) }}</span>
            <svg class="w-3 h-3 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            v-if="filterProject"
            @click="filterProject = ''; applyFilters()"
            class="inline-flex items-center gap-1.5 h-6 px-2 text-xs bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors group"
          >
            <span class="text-gray-700">{{ filterProject }}</span>
            <svg class="w-3 h-3 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            v-if="filterTeam"
            @click="filterTeam = ''; applyFilters()"
            class="inline-flex items-center gap-1.5 h-6 px-2 text-xs bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors group"
          >
            <span class="text-gray-700">{{ getTeamName(filterTeam) }}</span>
            <svg class="w-3 h-3 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            v-if="filterStatus"
            @click="filterStatus = ''; applyFilters()"
            class="inline-flex items-center gap-1.5 h-6 px-2 text-xs bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors group"
          >
            <span class="text-gray-700">Status: {{ filterStatus }}</span>
            <svg class="w-3 h-3 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            v-if="filterAssignedDate"
            @click="filterAssignedDate = ''; applyFilters()"
            class="inline-flex items-center gap-1.5 h-6 px-2 text-xs bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors group"
          >
            <span class="text-gray-700">Zugewiesen: {{ getDateLabel(filterAssignedDate) }}</span>
            <svg class="w-3 h-3 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            v-if="filterLastActivity"
            @click="filterLastActivity = ''; applyFilters()"
            class="inline-flex items-center gap-1.5 h-6 px-2 text-xs bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors group"
          >
            <span class="text-gray-700">Aktivität: {{ getActivityLabel(filterLastActivity) }}</span>
            <svg class="w-3 h-3 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            v-if="filterDate"
            @click="filterDate = ''; applyFilters()"
            class="inline-flex items-center gap-1.5 h-6 px-2 text-xs bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors group"
          >
            <span class="text-gray-700">Hochgeladen: {{ getDateLabel(filterDate) }}</span>
            <svg class="w-3 h-3 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            @click="clearFilters"
            class="ml-1 text-xs text-gray-500 hover:text-gray-700 underline decoration-dotted transition-colors"
          >
            Alle löschen
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>

      <!-- Customer List -->
      <div v-else>
        <div class="space-y-1">
          <div
            v-for="customer in customers"
            :key="customer.id"
            class="p-2 border rounded cursor-pointer transition-all"
            :class="
              selectedCustomer?.id === customer.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            "
            @click="$emit('select', customer)"
          >
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-semibold text-sm text-gray-800">
                  {{ customer.companyName }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ customer.assignedAgentName || "Unzugewiesen" }}
                </p>
              </div>
              <span
                class="px-1.5 py-0.5 text-sm rounded"
                :class="getStatusColor(customer.status)"
              >
                {{ customer.project }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Excel Import Modal - Custom -->
    <Teleport to="body">
      <div
        v-if="isImportModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="closeImportModal"
      >
        <div
          class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Excel Import</h3>
            <button
              @click="closeImportModal"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6">
            <!-- File Upload -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Excel-Datei auswählen *
              </label>
              <input
                ref="fileInput"
                type="file"
                accept=".xlsx, .xls"
                @change="handleFileSelect"
                class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
              />
              <p v-if="selectedFile" class="mt-1 text-xs text-green-600">
                ✓ {{ selectedFile.name }}
              </p>
            </div>

            <!-- Team Selection (Optional) -->
            <div v-if="hasRole('Admin') || hasRole('Teamlead')" class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Team (Optional)
              </label>
              <select
                v-model="selectedTeamId"
                class="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Kein Team --</option>
                <option v-for="team in teams" :key="team.id" :value="team.id">
                  {{ team.name }}
                </option>
              </select>
            </div>

            <!-- Agent Selection (Optional) -->
            <div v-if="hasRole('Admin') || hasRole('Teamlead')" class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Agent (Optional)
              </label>
              <select
                v-model="selectedAgentId"
                class="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Kein Agent --</option>
                <option v-for="assignableUser in users" :key="assignableUser.id" :value="assignableUser.id">
                  {{ assignableUser.name }} {{ (assignableUser as any).role ? `(${(assignableUser as any).role})` : '' }}
                </option>
              </select>
            </div>

            <!-- Error Message -->
            <div v-if="importError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-600">{{ importError }}</p>
            </div>

            <!-- Info Text -->
            <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-xs text-blue-700">
                <strong>Hinweis:</strong> Wenn Sie kein Team oder Agent auswählen, werden die Kunden als "Neu Importiert" markiert.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex gap-3 justify-end p-6 border-t border-gray-200 bg-gray-50">
            <button
              @click="closeImportModal"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              @click="handleImportConfirm"
              :disabled="!selectedFile"
              :class="[
                'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                selectedFile
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              ]"
            >
              Importieren
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Customer } from '~/composables/customers/useCustomers'
import { getStatusColor } from '~/utils/status'
import { useAuth } from '~/composables/auth/useAuth'

const props = defineProps<{
  customers: Customer[]
  selectedCustomer: Customer | null
  pagination?: { total: number; page: number; limit: number; pages: number }
  currentPage?: number
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', customer: Customer): void
  (e: 'import', data: any[], targetTeamId?: string, targetAgentId?: string): void
  (e: 'page-change', page: number): void
  (e: 'filter-change', filters: { 
    search: string;
    agent: string; 
    project: string; 
    team: string; 
    status: string;
    assignedDate: string;
    lastActivity: string;
    date: string;
  }): void
}>()

// Auth
const { user, hasRole } = useAuth()

// Collapse state
const isCollapsed = ref(false)

// Button hover state for wine-red color transition
const isButtonHovered = ref(false)

// Toggle collapse function
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// ============================================
// EXCEL IMPORT MODAL
// ============================================
import { read, utils } from 'xlsx'

const isImportModalOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const selectedTeamId = ref<string>('')
const selectedAgentId = ref<string>('')
const importError = ref<string>('')

// ============================================
// FILTERS & PAGINATION
// ============================================

// Filter state
const searchQuery = ref<string>('')
const filterAgent = ref<string>('')
const filterProject = ref<string>('')
const filterTeam = ref<string>('')
const filterStatus = ref<string>('')
const filterAssignedDate = ref<string>('')
const filterLastActivity = ref<string>('')
const filterDate = ref<string>('')
const showMoreFilters = ref<boolean>(false)

// Fetch teams and users for filters
const { data: teams } = await useFetch('/api/teams')
const { data: users } = await useFetch('/api/users/assignable')

// Compute available filter options
const availableTeams = computed(() => teams.value || [])
const availableAgents = computed(() => users.value || [])
const availableProjects = computed(() => {
  const projects = new Set<string>()
  props.customers.forEach(c => {
    if (c.project) projects.add(c.project)
  })
  return Array.from(projects).sort()
})
const availableStatuses = computed(() => {
  const statuses = new Set<string>()
  props.customers.forEach(c => {
    if (c.status) statuses.add(c.status)
  })
  return Array.from(statuses).sort()
})

// Check if any filter is active
const hasActiveFilters = computed(() => {
  return searchQuery.value || filterAgent.value || filterProject.value || filterTeam.value || 
         filterStatus.value || filterAssignedDate.value || filterLastActivity.value || 
         filterDate.value
})

// Visible page numbers for pagination
const visiblePageNumbers = computed(() => {
  const total = props.pagination?.pages || 1
  const current = props.currentPage || 1
  const pages: (number | string)[] = []

  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    
    for (let i = start; i <= end; i++) pages.push(i)
    
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }

  return pages
})

// Apply filters (emit to parent to refetch with filters)
const applyFilters = () => {
  emit('filter-change', {
    search: searchQuery.value,
    agent: filterAgent.value,
    project: filterProject.value,
    team: filterTeam.value,
    status: filterStatus.value,
    assignedDate: filterAssignedDate.value,
    lastActivity: filterLastActivity.value,
    date: filterDate.value,
  })
}

// Clear all filters
const clearFilters = () => {
  searchQuery.value = ''
  filterAgent.value = ''
  filterProject.value = ''
  filterTeam.value = ''
  filterStatus.value = ''
  filterAssignedDate.value = ''
  filterLastActivity.value = ''
  filterDate.value = ''
  applyFilters()
}

// Helper functions for chip labels
const getAgentName = (agentId: string) => {
  const agent = availableAgents.value.find((a: any) => a.id === agentId)
  return agent?.name || agentId
}

const getTeamName = (teamId: string) => {
  const team = availableTeams.value.find((t: any) => t.id === parseInt(teamId))
  return team?.name || teamId
}

const getDateLabel = (dateValue: string) => {
  const labels: Record<string, string> = {
    today: 'Heute',
    week: 'Diese Woche',
    month: 'Dieser Monat',
    quarter: 'Dieses Quartal',
  }
  return labels[dateValue] || dateValue
}

const getActivityLabel = (activityValue: string) => {
  const labels: Record<string, string> = {
    today: 'Heute',
    week: 'Diese Woche',
    month: 'Dieser Monat',
    older: 'Älter als 1 Monat',
  }
  return labels[activityValue] || activityValue
}

const triggerFileUpload = () => {
  // Open modal instead of direct file upload
  isImportModalOpen.value = true
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    selectedFile.value = file
    importError.value = ''
  }
}

const handleImportConfirm = async () => {
  if (!selectedFile.value) {
    importError.value = 'Bitte wählen Sie eine Excel-Datei aus.'
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      if (!firstSheetName) {
        throw new Error('Keine Seite in der Excel-Datei gefunden')
      }
      const worksheet = workbook.Sheets[firstSheetName]
      if (!worksheet) {
        throw new Error('Excel-Seiteninhalt konnte nicht gelesen werden')
      }
      const jsonData = utils.sheet_to_json(worksheet)
      
      console.log('Excel Import Raw Data:', jsonData)
      
      // Emit with optional team and agent IDs
      emit('import', jsonData, selectedTeamId.value || undefined, selectedAgentId.value || undefined)
      
      // Close modal and reset
      closeImportModal()
    } catch (error) {
      console.error('Error parsing Excel file:', error)
      importError.value = 'Fehler beim Lesen der Excel-Datei.'
    }
  }
  reader.readAsArrayBuffer(selectedFile.value)
}

const closeImportModal = () => {
  isImportModalOpen.value = false
  selectedFile.value = null
  selectedTeamId.value = ''
  selectedAgentId.value = ''
  importError.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const downloadSample = () => {
  window.location.href = '/api/customers/sample-excel'
}
</script>


