<template>
  <div class="min-h-screen bg-white">
    <!-- Main Container -->
    <div class="flex h-screen">
      <!-- MASTER SECTION - Assigned customers (left column) - componentized -->
      <CustomerList
        :customers="customers || []"
        :selected-customer="selectedCustomer"
        :pagination="pagination"
        :current-page="currentPage"
        :loading="status === 'pending'"
        :is-importing="isImporting"
        @select="selectCustomer"
        @import="handleImport"
        @page-change="loadPage"
        @filter-change="handleFilterChange"
      />

      <!-- DETAIL SECTION - Selected customer (right column) -->
      <CustomerDetail
        :selected-customer="selectedCustomer"
        :conversation-hook="conversationHook"
        :research-result="researchResult"
        :has-unsaved-changes="hasUnsavedChanges"
        :is-saving="isSaving"
        :get-contact-count="getContactCount"
        :start-call="startCall"
        :send-email="sendEmail"
        :call-contact="callContact"
        :email-contact="emailContact"
        :save-changes="saveChanges"
        :reset-changes="resetChanges"
        @updateConversation="updateConversation"
        @updateResearch="updateResearch"
        @refresh="handleRefresh"
      />
    </div>

    <!-- Import Feedback Modal -->
    <Teleport to="body">
      <div
        v-if="showImportFeedback"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="closeImportFeedback"
      >
        <div class="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"></div>
        
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                    {{ isImporting ? 'Importiere Daten...' : 'Import Abgeschlossen' }}
                </h3>
                <p v-if="!isImporting" class="text-sm text-gray-500 mt-0.5">
                  {{ importResult.success }} erfolgreich, {{ importResult.failed }} fehlgeschlagen
                </p>
                <p v-else class="text-sm text-gray-500 mt-0.5">
                     Bitte warten Sie, bis der Vorgang abgeschlossen ist.
                </p>
              </div>
              <button
                v-if="!isImporting"
                @click="closeImportFeedback"
                class="text-gray-400 hover:text-gray-600 transition-colors"
                title="Schließen"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-4 max-h-[60vh] overflow-y-auto">
              
              <!-- PROGRESS BAR (Visible only during import) -->
              <div v-if="isImporting" class="mb-6 space-y-4">
                 <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                        class="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out flex items-center justify-center text-[10px] font-bold text-white shadow-sm" 
                        :style="{ width: `${importProgress}%` }"
                    >
                        {{ importProgress }}%
                    </div>
                 </div>
                 <div class="flex justify-between text-sm text-gray-600 font-medium">
                    <span>{{ importStatusMessage }}</span>
                    <span v-if="importETA">Verbleibend: {{ importETA }}</span>
                 </div>
              </div>

              <!-- Summary Stats (Visible after import or live update) -->
              <div v-if="!isImporting || importResult.success > 0" class="grid grid-cols-3 gap-3 mb-4">
                <div class="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div class="text-2xl font-bold text-green-700">{{ importResult.created }}</div>
                  <div class="text-xs text-green-600">Neu erstellt</div>
                </div>
                <div class="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div class="text-2xl font-bold text-purple-700">{{ countNewAssignments }}</div>
                  <div class="text-xs text-purple-600">Neu zugewiesen</div>
                </div>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div class="text-2xl font-bold text-blue-700">{{ importResult.updated }}</div>
                  <div class="text-xs text-blue-600">Aktualisiert</div>
                </div>
              </div>

              <!-- Details List -->
              <div v-if="importResult.details && importResult.details.length > 0" class="space-y-2">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Details ({{ importResult.details.length }}):</h4>
                <div class="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                  <div
                    v-for="(detail, index) in importResult.details"
                    :key="index"
                    class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                  <!-- Icon -->
                  <div class="flex-shrink-0 mt-0.5">
                    <!-- Neu erstellt -->
                    <div
                      v-if="detail.action === 'Neu erstellt'"
                      class="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center"
                    >
                      <svg class="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <!-- Neu zugewiesen -->
                    <div
                      v-else-if="detail.action === 'Neu zugewiesen'"
                      class="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center"
                    >
                      <svg class="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <!-- Aktualisiert -->
                    <div
                      v-else
                      class="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center"
                    >
                      <svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-gray-900 truncate">{{ detail.company }}</div>
                    <div class="text-sm text-gray-600 mt-0.5">
                      <span :class="{
                        'text-green-600': detail.action === 'Neu erstellt',
                        'text-purple-600': detail.action === 'Neu zugewiesen',
                        'text-blue-600': detail.action === 'Aktualisiert'
                      }">
                        {{ detail.action }}
                      </span>
                      <span v-if="detail.contactsAdded > 0" class="ml-2">
                        • {{ detail.contactsAdded }} Kontakt{{ detail.contactsAdded > 1 ? 'e' : '' }} hinzugefügt
                      </span>
                    </div>
                  </div>
                  </div>
                </div>
              </div>

              <!-- Errors -->
              <div v-if="importResult.errors && importResult.errors.length > 0" class="mt-4">
                <h4 class="text-sm font-medium text-red-700 mb-2">Fehler:</h4>
                <div class="space-y-1">
                  <div
                    v-for="(error, index) in importResult.errors"
                    :key="index"
                    class="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2"
                  >
                    {{ error }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                @click="closeImportFeedback"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import CustomerList from "~/components/customer/CustomerList.vue";
import CustomerDetail from "~/components/customer/CustomerDetail.vue";
import { useCustomers } from "~/composables/customers/useCustomers";
import { useCustomerNotes } from "~/composables/forms/useCustomerNotes";

// Customer data – managed via composable
const {
  customers,
  pagination,
  loadPage,
  page: currentPage,
  selectedCustomer,
  selectCustomer,
  getContactCount,
  error,
  status,
  refresh,
  setFilters,
} = useCustomers();

// Auto-select first customer when customers are loaded
watch(customers, (newCustomers) => {
  if (newCustomers && newCustomers.length > 0 && !selectedCustomer.value) {
    selectCustomer(newCustomers[0]);
  }
}, { immediate: true });

// Handle filter changes
const handleFilterChange = (filters) => {
  setFilters(filters);
};

// Handle data refresh (e.g. after edit)
const handleRefresh = async () => {
  await refresh();
  // Update selected customer with fresh data
  if (selectedCustomer.value && customers.value) {
    const updated = customers.value.find(c => c.id === selectedCustomer.value.id);
    if (updated) {
      selectedCustomer.value = updated;
    }
  }
};

// Unsaved changes – composable
const {
  conversationHook,
  researchResult,
  hasUnsavedChanges,
  isSaving,
  trackChanges,
  saveChanges,
  resetChanges,
} = useCustomerNotes(selectedCustomer, {
  onSave: handleRefresh
});

// Start call
const startCall = () => {
  console.log("Anruf gestartet für:", selectedCustomer.value.companyName);
  // TODO: Implement call functionality
};

// Call specific contact
const callContact = (contact) => {
  console.log("Anruf gestartet für Kontakt:", contact);
  // TODO: Implement contact-specific call functionality
};

// Send email to company
const sendEmail = () => {
  console.log("Email senden an:", selectedCustomer.value.email);
  // TODO: Implement email functionality
};

// Email specific contact
const emailContact = (contact) => {
  console.log("Email senden an Kontakt:", contact);
  // TODO: Implement contact-specific email functionality
};

// Update handlers
const updateConversation = (v) => {
  conversationHook.value = v;
  trackChanges();
};

const updateResearch = (v) => {
  researchResult.value = v;
  trackChanges();
};

// Import Feedback Modal State
const showImportFeedback = ref(false);
const isImporting = ref(false);
const importProgress = ref(0);
const importETA = ref("");
const importStatusMessage = ref("");

const importResult = ref({
  success: 0,
  failed: 0,
  created: 0,
  updated: 0,
  details: [],
  errors: [],
});

// Count "Neu zugewiesen" items from details
const countNewAssignments = computed(() => {
  return importResult.value.details?.filter(d => d.action === 'Neu zugewiesen').length || 0;
});

const closeImportFeedback = () => {
  showImportFeedback.value = false;
  window.location.reload(); // Refresh after closing
};

// Helper for nicely formatting duration
const formatDuration = (ms) => {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} Sekunden`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} Min. ${remainingSeconds} Sek.`;
};

// Handle Excel Import with Frontend Chunking
const handleImport = async (data, targetTeamId, targetAgentId, projectName) => {
  console.log("Importing data:", data?.length, "rows", "Team:", targetTeamId, "Agent:", targetAgentId);
  
  if (!data || data.length === 0) {
    alert("Die importierte Datei ist leer.");
    return;
  }

  // Start loading
  isImporting.value = true;
  showImportFeedback.value = true;
  importProgress.value = 0;
  importETA.value = "Berechnung...";
  importStatusMessage.value = "Vorbereitung...";
  
  // Reset results
  importResult.value = {
    success: 0,
    failed: 0,
    created: 0,
    updated: 0,
    details: [],
    errors: [],
  };


  const BATCH_SIZE = 75; // Optimized to 75 for faster speed (D1 limit is ~1000 params, 75 * ~10 fields = ~750 params safe)
  const CONCURRENCY_LIMIT = 8; // Process 8 batches in parallel for maximum throughput
  
  const totalRows = data.length;
  const totalBatches = Math.ceil(totalRows / BATCH_SIZE);
  const startTime = Date.now();
  
  // Helper to process a single batch
  const processBatch = async (batchIndex) => {
      const startIdx = batchIndex * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, totalRows);
      const batch = data.slice(startIdx, endIdx);
      
      try {
          const response = await $fetch('/api/customers/import', {
              method: 'POST',
              body: { 
                  customers: batch,
                  targetTeamId,
                  targetAgentId,
                  projectName,
                  skipLog: true // Skip logging for batch calls
              }
          });

          if (response) {
              importResult.value.success += response.success || 0;
              importResult.value.failed += response.failed || 0;
              importResult.value.created += response.created || 0;
              importResult.value.updated += response.updated || 0;
              
              if (response.details && Array.isArray(response.details)) {
                   importResult.value.details.push(...response.details);
              }
               if (response.errors && Array.isArray(response.errors)) {
                   importResult.value.errors.push(...response.errors);
              }
          }
      } catch (err) {
          console.error(`Error in batch ${batchIndex}:`, err);
          importResult.value.errors.push(`Fehler in Batch ${batchIndex + 1}: ${err.message}`);
          importResult.value.failed += batch.length;
      }
  };

  try {
    // Concurrency Pool Logic
    const batches = Array.from({ length: totalBatches }, (_, i) => i);
    const activePromises = new Set();
    let completedBatches = 0;

    for (const batchIndex of batches) {
        // Wait if concurrency limit reached
        if (activePromises.size >= CONCURRENCY_LIMIT) {
            await Promise.race(activePromises);
        }

        const promise = processBatch(batchIndex).then(() => {
            activePromises.delete(promise);
            completedBatches++;
            
            // Update Progress
            const batchEndTime = Date.now();
            const elapsed = batchEndTime - startTime;
            const progress = completedBatches / totalBatches;
            importProgress.value = Math.round(progress * 100);
            
            importStatusMessage.value = `Verarbeite Batch ${completedBatches} von ${totalBatches} (Pool: ${activePromises.size + 1})...`;

            // Calculate ETA
            if (progress > 0) {
                const estimatedTotalTime = elapsed / progress;
                const remainingTime = estimatedTotalTime - elapsed;
                importETA.value = formatDuration(remainingTime);
            }
        });

        activePromises.add(promise);
    }

    // Wait for all remaining batches
    await Promise.all(activePromises);
    
    importStatusMessage.value = "Fertiggestellt!";
    importETA.value = "";

    // Create ONE consolidated import log after all batches complete
    try {
      await $fetch('/api/customers/import-log', {
        method: 'POST',
        body: {
          targetTeamId,
          targetAgentId,
          projectName,
          totalRows: totalRows,
          successCount: importResult.value.success,
          failedCount: importResult.value.failed,
          createdCount: importResult.value.created,
          updatedCount: importResult.value.updated,
          assignedCount: importResult.value.created + importResult.value.updated
        }
      });
    } catch (logErr) {
      console.error('Error creating import log:', logErr);
      // Don't fail the import if logging fails
    }

  } catch (err) {
    console.error("Unexpected error during import:", err);
    importResult.value.errors.push("Ein unerwarteter Fehler hat den Import abgebrochen: " + err.message);
    alert("Ein Fehler ist aufgetreten. Der Import wurde teilweise abgeschlossen.");
  } finally {
    isImporting.value = false;
  }
};
</script>
