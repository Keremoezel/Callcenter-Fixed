<template>
  <div class="flex-1 bg-white p-6">
    <div v-if="selectedCustomer">
      <div class="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold text-gray-800">
            {{ selectedCustomer.companyName }}
          </h1>
          <div class="flex space-x-3">
            <UButton color="primary" size="lg" @click="startCall"
              >📞 ANRUF STARTEN</UButton
            >
            <UButton color="neutral" variant="outline" @click="sendEmail"
              >✉️ EMAIL</UButton
            >
          </div>
        </div>

        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <!-- Section Header with Edit Button -->
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-gray-800">
              Unternehmensinformationen
            </h3>
            <UButton
              v-if="!isEditingCompanyInfo"
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-heroicons-pencil"
              @click="startEditingCompanyInfo"
            >
              Bearbeiten
            </UButton>
            <div v-else class="flex space-x-2">
              <UButton
                size="sm"
                color="neutral"
                variant="outline"
                @click="cancelEditingCompanyInfo"
              >
                Abbrechen
              </UButton>
              <UButton size="sm" color="primary" @click="saveCompanyInfo">
                Speichern
              </UButton>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-4">
            <!-- Kundenname -->
            <div>
              <label class="text-sm text-gray-500">Kundenname</label>
              <p v-if="!isEditingCompanyInfo" class="font-bold text-gray-800">
                {{ selectedCustomer.companyName }}
              </p>
              <UInput
                v-else
                v-model="editedCompanyInfo.companyName"
                size="sm"
              />
            </div>

            <!-- GesellschaftsForm -->
            <div>
              <label class="text-sm text-gray-500">GesellschaftsForm</label>
              <p v-if="!isEditingCompanyInfo" class="font-bold text-gray-800">
                {{ selectedCustomer.companyForm }}
              </p>
              <UInput
                v-else
                v-model="editedCompanyInfo.companyForm"
                size="sm"
              />
            </div>

            <!-- Branche -->
            <div>
              <label class="text-sm text-gray-500">Branche</label>
              <p v-if="!isEditingCompanyInfo" class="font-bold text-gray-800">
                {{ selectedCustomer.industry }}
              </p>
              <UInput v-else v-model="editedCompanyInfo.industry" size="sm" />
            </div>

            <!-- MitarbeiterAnzahl -->
            <div>
              <label class="text-sm text-gray-500">MitarbeiterAnzahl</label>
              <p v-if="!isEditingCompanyInfo" class="font-bold text-gray-800">
                {{ formatEmployeeCount(selectedCustomer.employeeCount) }}
              </p>
              <UInput
                v-else
                v-model="editedCompanyInfo.employeeCount"
                size="sm"
              />
            </div>

            <!-- Webseite -->
            <div>
              <label class="text-sm text-gray-500">Webseite</label>
              <p v-if="!isEditingCompanyInfo" class="font-bold text-gray-800">
                {{ selectedCustomer.website }}
              </p>
              <UInput v-else v-model="editedCompanyInfo.website" size="sm" />
            </div>

            <!-- TelefonNummer -->
            <div>
              <label class="text-sm text-gray-500">TelefonNummer</label>
              <p v-if="!isEditingCompanyInfo" class="font-bold text-gray-800">
                {{ selectedCustomer.phoneNumber }}
              </p>
              <UInput
                v-else
                v-model="editedCompanyInfo.phoneNumber"
                size="sm"
              />
            </div>

            <!-- Mail -->
            <div>
              <label class="text-sm text-gray-500">Mail</label>
              <p v-if="!isEditingCompanyInfo" class="font-bold text-gray-800">
                {{ selectedCustomer.email }}
              </p>
              <UInput v-else v-model="editedCompanyInfo.email" size="sm" />
            </div>

            <!-- Öffnungszeiten -->
            <div>
              <label class="text-sm text-gray-500">Öffnungszeiten</label>
              <p v-if="!isEditingCompanyInfo" class="font-bold text-gray-800">
                {{ selectedCustomer.openingHours }}
              </p>
              <UInput
                v-else
                v-model="editedCompanyInfo.openingHours"
                size="sm"
              />
            </div>

            <!-- UmsatsGröße -->
            <div>
              <label class="text-sm text-gray-500">UmsatsGröße</label>
              <p v-if="!isEditingCompanyInfo" class="font-bold text-gray-800">
                {{ selectedCustomer.revenueSize }}
              </p>
              <UInput
                v-else
                v-model="editedCompanyInfo.revenueSize"
                size="sm"
              />
            </div>

            <!-- Straße,Hausnummer -->
            <div>
              <label class="text-sm text-gray-500">Straße,Hausnummer</label>
              <p v-if="!isEditingCompanyInfo" class="font-bold text-gray-800">
                {{ selectedCustomer.streetAddress }}
              </p>
              <UInput
                v-else
                v-model="editedCompanyInfo.streetAddress"
                size="sm"
              />
            </div>

            <!-- Plz -->
            <div>
              <label class="text-sm text-gray-500">Plz</label>
              <p v-if="!isEditingCompanyInfo" class="font-bold text-gray-800">
                {{ selectedCustomer.postalCode }}
              </p>
              <UInput v-else v-model="editedCompanyInfo.postalCode" size="sm" />
            </div>

            <!-- Ort -->
            <div>
              <label class="text-sm text-gray-500">Ort</label>
              <p v-if="!isEditingCompanyInfo" class="font-bold text-gray-800">
                {{ selectedCustomer.city }}
              </p>
              <UInput v-else v-model="editedCompanyInfo.city" size="sm" />
            </div>

            <!-- Bundesland -->
            <div>
              <label class="text-sm text-gray-500">Bundesland</label>
              <p v-if="!isEditingCompanyInfo" class="font-bold text-gray-800">
                {{ selectedCustomer.state }}
              </p>
              <UInput v-else v-model="editedCompanyInfo.state" size="sm" />
            </div>

            <!-- Gründung -->
            <div>
              <label class="text-sm text-gray-500">Gründung</label>
              <p v-if="!isEditingCompanyInfo" class="font-bold text-gray-800">
                {{ selectedCustomer.foundingDate }}
              </p>
              <UInput
                v-else
                v-model="editedCompanyInfo.foundingDate"
                size="sm"
              />
            </div>

            <!-- Beschreibung -->
            <div class="col-span-2">
              <label class="text-sm text-gray-500">Beschreibung</label>
              <p v-if="!isEditingCompanyInfo" class="font-bold text-gray-800">
                {{ selectedCustomer.description }}
              </p>
              <UTextarea
                v-else
                v-model="editedCompanyInfo.description"
                :rows="2"
              />
            </div>
          </div>
        </div>

        <!-- AUFGABEN SECTION - Only visible if customer has tasks -->
        <div v-if="selectedCustomer.tasks && selectedCustomer.tasks.length > 0">
          <!-- ACTIVE TASKS - High, Medium, Low priority -->
          <div
            v-if="activeTasks.length > 0"
            class="bg-white border-l-4 border-l-blue-500 border border-gray-200 rounded-lg p-3 mb-4 shadow-sm"
          >
            <button
              @click="toggleActiveTasksExpanded"
              class="w-full flex items-center justify-between mb-2 hover:bg-gray-50 rounded p-1.5 transition-colors"
            >
              <h3 class="text-sm font-semibold text-gray-800">
                📋 Aktive Aufgaben ({{ activeTasks.length }})
              </h3>
              <svg
                :class="[
                  'w-4 h-4 text-gray-600 transition-transform',
                  isActiveTasksExpanded ? 'rotate-90' : '',
                ]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <div v-if="isActiveTasksExpanded" class="overflow-x-auto animate-in slide-in-from-top">
              <table class="w-full text-sm border-collapse">
                <thead>
                  <tr class="border-b border-gray-300">
                    <th class="text-left py-2 px-3 font-semibold text-gray-700">
                      Bezeichnung/Kategorie
                    </th>
                    <th class="text-left py-2 px-3 font-semibold text-gray-700">
                      Prio
                    </th>
                    <th class="text-left py-2 px-3 font-semibold text-gray-700">
                      Kunde
                    </th>
                    <th class="text-left py-2 px-3 font-semibold text-gray-700">
                      Zu erledigen bis
                    </th>
                    <th class="text-left py-2 px-3 font-semibold text-gray-700">
                      Status
                    </th>
                    <th class="text-left py-2 px-3 font-semibold text-gray-700">
                      Zugewiesen von
                    </th>
                    <th class="text-left py-2 px-3 font-semibold text-gray-700">
                      Wiedervorlage am
                    </th>
                    <th class="text-left py-2 px-3 font-semibold text-gray-700">
                      Zu erledigen von
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="task in activeTasks"
                    :key="task.id"
                    class="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td class="py-2 px-3 text-gray-900">{{ task.title }}</td>
                    <td class="py-2 px-3">
                      <span
                        :class="{
                          'text-red-600 font-semibold': task.priority === 'Hoch',
                          'text-orange-600': task.priority === 'Mittel',
                          'text-gray-600': task.priority === 'Niedrig',
                        }"
                      >
                        {{ task.priority }}
                      </span>
                    </td>
                    <td class="py-2 px-3 text-gray-700">
                      {{ selectedCustomer.companyName }}
                    </td>
                    <td class="py-2 px-3 text-gray-700">
                      {{ formatTaskDate(task.dueDate) }}
                    </td>
                    <td class="py-2 px-3">
                      <span
                        :class="{
                          'text-blue-600': task.status === 'In Progress',
                          'text-gray-600': task.status === 'Open',
                        }"
                      >
                        {{ task.status }}
                      </span>
                    </td>
                    <td class="py-2 px-3 text-gray-700">
                      {{ task.assignedByName || "-" }}
                    </td>
                    <td class="py-2 px-3 text-gray-700">
                      {{ formatTaskDate(task.followUpDate) }}
                    </td>
                    <td class="py-2 px-3 text-gray-700">
                      {{ task.assignedToName || "-" }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- COMPLETED TASKS - Erledigt -->
          <div
            v-if="completedTasks.length > 0"
            class="bg-white border-l-4 border-l-green-500 border border-gray-200 rounded-lg p-3 mb-4 shadow-sm"
          >
            <button
              @click="toggleCompletedTasksExpanded"
              class="w-full flex items-center justify-between mb-2 hover:bg-gray-50 rounded p-1.5 transition-colors"
            >
              <h3 class="text-sm font-semibold text-gray-800">
                ✅ Erledigte Aufgaben ({{ completedTasks.length }})
              </h3>
              <svg
                :class="[
                  'w-4 h-4 text-gray-600 transition-transform',
                  isCompletedTasksExpanded ? 'rotate-90' : '',
                ]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <div v-if="isCompletedTasksExpanded" class="overflow-x-auto animate-in slide-in-from-top">
              <table class="w-full text-sm border-collapse">
                <thead>
                  <tr class="border-b border-gray-300">
                    <th class="text-left py-2 px-3 font-semibold text-gray-700">
                      Bezeichnung/Kategorie
                    </th>
                    <th class="text-left py-2 px-3 font-semibold text-gray-700">
                      Prio
                    </th>
                    <th class="text-left py-2 px-3 font-semibold text-gray-700">
                      Kunde
                    </th>
                    <th class="text-left py-2 px-3 font-semibold text-gray-700">
                      Zu erledigen bis
                    </th>
                    <th class="text-left py-2 px-3 font-semibold text-gray-700">
                      Status
                    </th>
                    <th class="text-left py-2 px-3 font-semibold text-gray-700">
                      Zugewiesen von
                    </th>
                    <th class="text-left py-2 px-3 font-semibold text-gray-700">
                      Wiedervorlage am
                    </th>
                    <th class="text-left py-2 px-3 font-semibold text-gray-700">
                      Zu erledigen von
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="task in completedTasks"
                    :key="task.id"
                    class="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td class="py-2 px-3 text-gray-700">{{ task.title }}</td>
                    <td class="py-2 px-3">
                      <span
                        :class="{
                          'text-red-600 font-semibold': task.priority === 'Hoch',
                          'text-orange-600': task.priority === 'Mittel',
                          'text-gray-600': task.priority === 'Niedrig',
                        }"
                      >
                        {{ task.priority }}
                      </span>
                    </td>
                    <td class="py-2 px-3 text-gray-600">
                      {{ selectedCustomer.companyName }}
                    </td>
                    <td class="py-2 px-3 text-gray-600">
                      {{ formatTaskDate(task.dueDate) }}
                    </td>
                    <td class="py-2 px-3">
                      <span class="text-green-600 font-semibold">
                        {{ task.status }}
                      </span>
                    </td>
                    <td class="py-2 px-3 text-gray-600">
                      {{ task.assignedByName || "-" }}
                    </td>
                    <td class="py-2 px-3 text-gray-600">
                      {{ formatTaskDate(task.followUpDate) }}
                    </td>
                    <td class="py-2 px-3 text-gray-600">
                      {{ task.assignedToName || "-" }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TODO: ANRUF HISTORIE - Backend Logic Needed -->
        <div class="bg-white border-l-4 border-l-green-500 border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-base font-bold text-gray-800">
              📞 Letzter Anruf
              <span class="ml-2 text-xs text-gray-400 font-normal">(TODO: Backend)</span>
            </h3>
            <button
              class="text-xs text-gray-600 hover:text-gray-800 font-medium"
              disabled
            >
              Alle anzeigen ▼
            </button>
          </div>

          <div class="text-sm">
            <p class="text-gray-900 font-bold mb-1">
              28.10.2024, 14:30 Uhr <span class="text-gray-500 font-normal">• vor 2 Tagen</span>
            </p>
            <p class="text-gray-700 text-sm mb-2">
              Max Mustermann → David Schmidt • 15 Min •
              <span class="text-green-600 font-semibold">✓ Erfolgreich</span>
            </p>
            <p class="text-gray-600 text-sm italic">
              "Kunde interessiert an neuem Projekt. Follow-up Meeting
              vereinbart."
            </p>
          </div>
        </div>

        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-gray-800">Notizen & Recherche</h3>
          <UButton
            v-if="hasUnsavedChanges"
            size="sm"
            color="primary"
            @click="saveChanges"
            :loading="isSaving"
          >
            Speichern
          </UButton>
        </div>

        <div class="grid grid-cols-2 gap-6 mb-6">
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <label class="text-sm font-medium text-gray-700 mb-2 block"
              >Gesprächsaufhänger</label
            >
            <UTextarea
              :model-value="conversationHook"
              placeholder="Gesprächseinstieg eingeben..."
              :rows="4"
              class="w-full"
              @update:model-value="(val) => $emit('updateConversation', val)"
            />
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <label class="text-sm font-medium text-gray-700 mb-2 block"
              >Rechercheergebnis</label
            >
            <UTextarea
              :model-value="researchResult"
              placeholder="Rechercheergebnis eingeben..."
              :rows="4"
              class="w-full"
              @update:model-value="(val) => $emit('updateResearch', val)"
            />
          </div>
        </div>

        <div class="mb-6" v-if="hasUnsavedChanges">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div
                  class="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-3"
                >
                  <span class="text-white text-xs">⚠️</span>
                </div>
                <div>
                  <p class="text-sm font-medium text-yellow-800">
                    Ungespeicherte Änderungen
                  </p>
                  <p class="text-xs text-yellow-600">
                    Ihre Eingaben wurden noch nicht gespeichert
                  </p>
                </div>
              </div>
              <div class="flex space-x-3">
                <UButton
                  color="neutral"
                  variant="outline"
                  size="sm"
                  @click="resetChanges"
                  :disabled="isSaving"
                  >Zurücksetzen</UButton
                >
                <UButton
                  color="primary"
                  size="sm"
                  @click="saveChanges"
                  :loading="isSaving"
                  >{{ isSaving ? "Speichern..." : "Jetzt Speichern" }}</UButton
                >
              </div>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <!-- Section Header with Edit Button -->
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-lg font-bold text-gray-800">
              Kontakte({{ getContactCount(selectedCustomer) }})
            </h3>
            <div class="flex items-center space-x-3">
              <span v-if="!isEditingContacts" class="text-sm text-gray-500"
                >Primär({{ primaryContact?.firstName }}) ↓</span
              >
              <UButton
                v-if="!isEditingContacts"
                size="sm"
                color="neutral"
                variant="ghost"
                icon="i-heroicons-pencil"
                @click="startEditingContacts"
              >
                Bearbeiten
              </UButton>
              <div v-else class="flex space-x-2">
                <UButton
                  size="sm"
                  color="neutral"
                  variant="outline"
                  @click="cancelEditingContacts"
                >
                  Abbrechen
                </UButton>
                <UButton size="sm" color="primary" @click="saveContacts">
                  Speichern
                </UButton>
              </div>
            </div>
          </div>

          <!-- VIEW MODE: Display contacts with individual collapsible secondary contacts -->
          <template v-if="!isEditingContacts">
            <!-- Primary Contact - Always Expanded -->
            <ContactCard
              v-if="primaryContact"
              :contact="primaryContact"
              :index="0"
              @call="callContact"
              @email="emailContact"
            />

            <!-- Secondary Contacts - Each Individually Collapsible -->
            <div
              v-for="(contact, index) in secondaryContacts"
              :key="index"
              class="mt-4"
            >
              <!-- Collapsible Header with Contact Name -->
              <button
                @click="toggleSecondaryContact(index)"
                class="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <div class="flex items-center space-x-3">
                  <svg
                    :class="[
                      'w-5 h-5 text-gray-500 transition-transform',
                      isSecondaryContactExpanded(index) ? 'rotate-90' : '',
                    ]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <span class="text-sm font-semibold text-gray-800">
                    {{ contact.firstName }}
                    {{ contact.lastName || "" }}
                  </span>
                  <span
                    v-if="contact.position"
                    class="text-xs text-gray-500 italic"
                  >
                    ({{ contact.position }})
                  </span>
                </div>
                <span class="text-xs text-gray-400">
                  Kontakt {{ index + 2 }}
                </span>
              </button>

              <!-- Expanded Contact Details -->
              <div
                v-if="isSecondaryContactExpanded(index)"
                class="mt-2 animate-in slide-in-from-top"
              >
                <ContactCard
                  :contact="contact"
                  :index="index + 1"
                  @call="callContact"
                  @email="emailContact"
                />
              </div>
            </div>
          </template>

          <!-- EDIT MODE: Display editable contacts using ContactEditCard component -->
          <template v-else>
            <ContactEditCard
              v-for="(contact, index) in editedContacts"
              :key="index"
              :contact="contact"
              :index="index"
              :can-delete="editedContacts.length > 1"
              @set-primary="setPrimaryContact"
              @remove="removeContact"
            />

            <!-- Add Contact Button -->
            <div class="mt-4">
              <UButton
                color="primary"
                variant="outline"
                icon="i-heroicons-plus"
                @click="addContact"
                block
              >
                Neuen Kontakt hinzufügen
              </UButton>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center h-full">
      <div class="text-center">
        <div class="text-6xl mb-4">👈</div>
        <h3 class="text-xl font-semibold text-gray-600 mb-2">
          Kunden auswählen
        </h3>
        <p class="text-gray-500">
          Wählen Sie einen Kunden aus der Liste aus, um Details anzuzeigen
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Customer } from "~/composables/customers/useCustomers";
import { ref, computed, watch } from "vue";
import ContactCard from "./ContactCard.vue";
import ContactEditCard from "./ContactEditCard.vue";

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  selectedCustomer: Customer | null;
  conversationHook: string;
  researchResult: string;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  getContactCount: (customer: Customer | null) => number;
  startCall: () => void;
  sendEmail: () => void;
  callContact: (contact: any) => void;
  emailContact: (contact: any) => void;
  saveChanges: () => Promise<void>;
  resetChanges: () => void;
}>();

const emit = defineEmits<{
  (e: "updateConversation", value: string): void;
  (e: "updateResearch", value: string): void;
  (e: "refresh"): void;
}>();

// ============================================
// EDIT MODE STATE
// ============================================
// Controls whether company info section is in edit mode
const isEditingCompanyInfo = ref(false);

// Controls whether contacts section is in edit mode
// Controls whether contacts section is in edit mode
const isEditingContacts = ref(false);

// Watch for customer changes to reset edit modes
watch(() => props.selectedCustomer, () => {
  isEditingCompanyInfo.value = false;
  isEditingContacts.value = false;
  editedContacts.value = [];
});

// ============================================
// COMPANY INFO EDITING
// ============================================
// Temporary storage for company info while editing
const editedCompanyInfo = ref({
  companyName: "",
  companyForm: "",
  industry: "",
  employeeCount: "",
  website: "",
  phoneNumber: "",
  email: "",
  openingHours: "",
  revenueSize: "",
  streetAddress: "",
  postalCode: "",
  city: "",
  state: "",
  foundingDate: "",
  description: "",
});

// When user clicks the pen icon to edit company info
const startEditingCompanyInfo = () => {
  if (!props.selectedCustomer) return;

  // Copy current customer data to editing fields
  editedCompanyInfo.value = {
    companyName: props.selectedCustomer.companyName,
    companyForm: props.selectedCustomer.companyForm,
    industry: props.selectedCustomer.industry,
    employeeCount: props.selectedCustomer.employeeCount,
    website: props.selectedCustomer.website,
    phoneNumber: props.selectedCustomer.phoneNumber,
    email: props.selectedCustomer.email,
    openingHours: props.selectedCustomer.openingHours,
    revenueSize: props.selectedCustomer.revenueSize,
    streetAddress: props.selectedCustomer.streetAddress,
    postalCode: props.selectedCustomer.postalCode,
    city: props.selectedCustomer.city,
    state: props.selectedCustomer.state,
    foundingDate: props.selectedCustomer.foundingDate,
    description: props.selectedCustomer.description,
  };

  // Enable edit mode
  isEditingCompanyInfo.value = true;
};

// When user clicks save button for company info
const saveCompanyInfo = async () => {
  if (!props.selectedCustomer) return;

  try {
    await $fetch(`/api/customers/${props.selectedCustomer.id}`, {
      method: 'PUT',
      body: editedCompanyInfo.value
    });

    // Exit edit mode
    isEditingCompanyInfo.value = false;

    // Emit refresh to reload data
    emit('refresh');
  } catch (error: unknown) {
    console.error("Failed to save company info:", error);
    const msg = error && typeof error === 'object' && 'data' in error && (error as { data?: { message?: string } }).data?.message;
    alert(msg ? `Fehler beim Speichern: ${msg}` : "Fehler beim Speichern der Unternehmensdaten.");
  }
};

// When user clicks cancel button for company info
const cancelEditingCompanyInfo = () => {
  // Discard changes and exit edit mode
  isEditingCompanyInfo.value = false;
};

// ============================================
// COMPUTED PROPERTIES FOR CONTACTS
// ============================================
// Get the primary contact from the contacts array
const primaryContact = computed(() => {
  if (!props.selectedCustomer?.contacts) return null;
  return props.selectedCustomer.contacts.find((c) => c.isPrimary) || null;
});

// Get all secondary contacts (non-primary)
const secondaryContacts = computed(() => {
  if (!props.selectedCustomer?.contacts) return [];
  return props.selectedCustomer.contacts.filter((c) => !c.isPrimary);
});

// Track which secondary contacts are expanded (using Set for efficient lookup)
const expandedSecondaryContacts = ref<Set<number>>(new Set());

// Toggle individual secondary contact expansion
const toggleSecondaryContact = (index: number) => {
  if (expandedSecondaryContacts.value.has(index)) {
    expandedSecondaryContacts.value.delete(index);
  } else {
    expandedSecondaryContacts.value.add(index);
  }
};

// Check if a secondary contact is expanded
const isSecondaryContactExpanded = (index: number) => {
  return expandedSecondaryContacts.value.has(index);
};

// ============================================
// TASKS EXPANSION & FILTERING
// ============================================
const isActiveTasksExpanded = ref(false);
const isCompletedTasksExpanded = ref(false);

const toggleActiveTasksExpanded = () => {
  isActiveTasksExpanded.value = !isActiveTasksExpanded.value;
};

const toggleCompletedTasksExpanded = () => {
  isCompletedTasksExpanded.value = !isCompletedTasksExpanded.value;
};

// Split tasks into active and completed
const activeTasks = computed(() => {
  if (!props.selectedCustomer?.tasks) return [];
  
  const priorityOrder: Record<string, number> = { 'Hoch': 1, 'Mittel': 2, 'Niedrig': 3 };
  
  return props.selectedCustomer.tasks
    .filter(task => task.status !== 'Done')
    .sort((a, b) => {
      // Sort by priority: High, Medium, Low
      return (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999);
    });
});

const completedTasks = computed(() => {
  if (!props.selectedCustomer?.tasks) return [];
  
  return props.selectedCustomer.tasks
    .filter(task => task.status === 'Done');
});

// ============================================
// CONTACTS EDITING
// ============================================
// Store contacts as an array for easy reordering
const editedContacts = ref<any[]>([]);

// When user clicks the pen icon to edit contacts
const startEditingContacts = () => {
  if (!props.selectedCustomer?.contacts) return;

  // Copy all contacts to editing array
  editedContacts.value = props.selectedCustomer.contacts.map((contact) => ({
    ...contact,
    // Ensure social object exists
    social: contact.social || {
      linkedin: "",
      xing: "",
      facebook: "",
    },
  }));

  // Sort: primary first, then all others
  editedContacts.value.sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return 0;
  });

  // Enable edit mode
  isEditingContacts.value = true;
};

// When user marks a contact as primary
const setPrimaryContact = (index: number) => {
  // Set all contacts to not primary
  editedContacts.value.forEach((contact) => {
    contact.isPrimary = false;
  });

  // Set selected contact as primary
  editedContacts.value[index].isPrimary = true;

  // Reorder: Move primary contact to top
  const primaryContact = editedContacts.value.splice(index, 1)[0];
  editedContacts.value.unshift(primaryContact);
};

// Add a new contact
const addContact = () => {
  const newContact = {
    isPrimary: false,
    firstName: "",
    email: "",
    phoneNumber: "",
    position: "",
    birthDate: "",
    social: {
      linkedin: "",
      xing: "",
      facebook: "",
    },
    notizen: "",
  };

  // Add to end of array
  editedContacts.value.push(newContact);
};

// Remove a contact by index
const removeContact = (index: number) => {
  // Don't allow removing if it's the only contact
  if (editedContacts.value.length <= 1) {
    alert("Ein Unternehmen muss mindestens einen Kontakt haben.");
    return;
  }

  // Don't allow removing primary contact directly
  if (editedContacts.value[index].isPrimary) {
    alert(
      "Der Primärkontakt kann nicht gelöscht werden. Bitte markieren Sie zuerst einen anderen Kontakt als Primär."
    );
    return;
  }

  // Remove the contact
  editedContacts.value.splice(index, 1);
};

// When user clicks save button for contacts
const saveContacts = async () => {
  // Validate: must have at least one primary contact
  const hasPrimary = editedContacts.value.some((c) => c.isPrimary);
  if (!hasPrimary) {
    alert("Bitte markieren Sie mindestens einen Kontakt als Primär.");
    return;
  }

  if (!props.selectedCustomer) return;

  console.log('Saving contacts:', editedContacts.value);

  try {
    await $fetch(`/api/customers/${props.selectedCustomer.id}/contacts`, {
      method: 'PUT',
      body: editedContacts.value
    });

    // Exit edit mode
    isEditingContacts.value = false;

    // Emit refresh to reload data
    emit('refresh');
  } catch (error) {
    console.error("Failed to save contacts:", error);
    alert("Fehler beim Speichern der Kontakte.");
  }
};

// When user clicks cancel button for contacts
const cancelEditingContacts = () => {
  // Discard changes and exit edit mode
  isEditingContacts.value = false;
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const formatEmployeeCount = (count: string) => {
  // If the count is already in range format (e.g., "0-50"), return as is
  if (count.includes("-")) return count;

  // Otherwise, create a range based on the number
  const num = parseInt(count);
  if (isNaN(num)) return count; // Return original if not a number

  // Define ranges
  if (num < 10) return "1-10";
  if (num < 50) return "11-50";
  if (num < 100) return "51-100";
  if (num < 250) return "101-250";
  if (num < 500) return "251-500";
  if (num < 1000) return "501-1000";
  return "1000+";
};

// Format task dates for display
const formatTaskDate = (date: Date | null): string => {
  if (!date) return "-";
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}.${month}.${year}`;
};

// Format date with time for assignment history
const formatDate = (date: Date | string | null): string => {
  if (!date) return "-";
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};
</script>
