<template>
  <div class="w-2/3 bg-white p-6">
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

          <!-- VIEW MODE: Display ALL contacts -->
          <template v-if="!isEditingContacts">
            <div
              v-for="(contact, index) in selectedCustomer.contacts"
              :key="index"
              :class="[
                'border border-gray-200 rounded-lg mb-3 p-4',
                contact.isPrimary ? 'bg-blue-50' : 'bg-white'
              ]"
            >
              <div class="flex justify-between items-center mb-3">
                <div class="flex items-center space-x-2">
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-1 rounded-full text-xs',
                      contact.isPrimary
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    ]"
                  >
                    {{ contact.isPrimary ? '✓ Primär' : `Kontakt ${index + 1}` }}
                  </span>
                  <h4 class="font-bold text-gray-800">
                    {{ contact.firstName }}
                  </h4>
                </div>
                <div class="flex space-x-2">
                  <UButton
                    size="sm"
                    :color="contact.isPrimary ? 'primary' : 'neutral'"
                    :variant="contact.isPrimary ? 'solid' : 'outline'"
                    @click="callContact(contact)"
                    >📞 Anrufen</UButton
                  >
                  <UButton
                    size="sm"
                    :color="contact.isPrimary ? 'primary' : 'neutral'"
                    variant="outline"
                    @click="emailContact(contact)"
                    >✉️ Email</UButton
                  >
                </div>
              </div>

              <div class="grid grid-cols-4 gap-4">
                <div>
                  <label class="text-xs text-gray-500">Vorname</label>
                  <p class="font-bold text-sm text-gray-800">
                    {{ contact.firstName }}
                  </p>
                </div>
                <div>
                  <label class="text-xs text-gray-500">Mail</label>
                  <p class="font-bold text-sm text-gray-800">
                    {{ contact.email }}
                  </p>
                </div>
                <div>
                  <label class="text-xs text-gray-500">Telefonnummer</label>
                  <p class="font-bold text-sm text-gray-800">
                    {{ contact.phoneNumber }}
                  </p>
                </div>
                <div>
                  <label class="text-xs text-gray-500">Position</label>
                  <p class="font-bold text-sm text-gray-800">
                    {{ contact.position || "-" }}
                  </p>
                </div>
              </div>

              <div
                class="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-200"
              >
                <div>
                  <label class="text-xs text-gray-500">Geburtsdatum</label>
                  <p class="text-xs text-gray-600">
                    {{ contact.birthDate || "-" }}
                  </p>
                </div>
                <div>
                  <label class="text-xs text-gray-500">LinkedIn</label>
                  <p
                    class="text-xs text-blue-600 hover:underline cursor-pointer"
                  >
                    {{ contact.social?.linkedin || "-" }}
                  </p>
                </div>
                <div>
                  <label class="text-xs text-gray-500">Xing</label>
                  <p
                    class="text-xs text-blue-600 hover:underline cursor-pointer"
                  >
                    {{ contact.social?.xing || "-" }}
                  </p>
                </div>
                <div>
                  <label class="text-xs text-gray-500">Facebook</label>
                  <p
                    class="text-xs text-blue-600 hover:underline cursor-pointer"
                  >
                    {{ contact.social?.facebook || "-" }}
                  </p>
                </div>
              </div>

              <!-- Notizen Section (Full Width) -->
              <div class="mt-3 pt-3 border-t border-gray-200">
                <label class="text-xs text-gray-500">Notizen</label>
                <p class="text-sm text-gray-700 mt-1">
                  {{ contact.notizen || "-" }}
                </p>
              </div>
            </div>
          </template>

          <!-- EDIT MODE: Loop through all editable contacts -->
          <template v-else>
            <!-- Loop through all contacts -->
            <div
              v-for="(contact, index) in editedContacts"
              :key="index"
              :class="[
                'border border-gray-200 rounded-lg mb-3 p-4',
                contact.isPrimary ? 'bg-blue-50' : 'bg-white',
              ]"
            >
              <div class="flex justify-between items-center mb-3">
                <div class="flex items-center space-x-2">
                  <!-- Primary/Secondary Badge -->
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-1 rounded-full text-xs',
                      contact.isPrimary
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600',
                    ]"
                  >
                    {{ contact.isPrimary ? "✓ Primär" : "- Sekundär" }}
                  </span>

                  <!-- Set as Primary Button (only show for non-primary contacts) -->
                  <UButton
                    v-if="!contact.isPrimary"
                    size="xs"
                    color="primary"
                    variant="soft"
                    @click="setPrimaryContact(index)"
                  >
                    Als Primär markieren
                  </UButton>

                  <h4 class="font-bold text-gray-800">
                    {{ contact.firstName || "Neuer Kontakt" }}
                  </h4>
                </div>

                <!-- Remove Contact Button (only for non-primary) -->
                <UButton
                  v-if="!contact.isPrimary && editedContacts.length > 1"
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  @click="removeContact(index)"
                >
                  Löschen
                </UButton>
              </div>

              <!-- Contact Fields (Editable) -->
              <div class="grid grid-cols-4 gap-4">
                <div>
                  <label class="text-xs text-gray-500">Vorname</label>
                  <UInput
                    v-model="contact.firstName"
                    size="sm"
                    placeholder="Vorname eingeben"
                  />
                </div>
                <div>
                  <label class="text-xs text-gray-500">Mail</label>
                  <UInput
                    v-model="contact.email"
                    size="sm"
                    placeholder="E-Mail eingeben"
                  />
                </div>
                <div>
                  <label class="text-xs text-gray-500">Telefonnummer</label>
                  <UInput
                    v-model="contact.phoneNumber"
                    size="sm"
                    placeholder="Telefonnummer eingeben"
                  />
                </div>
                <div>
                  <label class="text-xs text-gray-500">Position</label>
                  <UInput
                    v-model="contact.position"
                    size="sm"
                    placeholder="Position eingeben"
                  />
                </div>
              </div>

              <!-- Social Media Fields (Editable) -->
              <div
                class="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-200"
              >
                <div>
                  <label class="text-xs text-gray-500">Geburtsdatum</label>
                  <UInput v-model="contact.birthDate" size="sm" type="date" />
                </div>
                <div>
                  <label class="text-xs text-gray-500">LinkedIn</label>
                  <UInput
                    v-model="contact.social.linkedin"
                    size="sm"
                    placeholder="LinkedIn URL"
                  />
                </div>
                <div>
                  <label class="text-xs text-gray-500">Xing</label>
                  <UInput
                    v-model="contact.social.xing"
                    size="sm"
                    placeholder="Xing URL"
                  />
                </div>
                <div>
                  <label class="text-xs text-gray-500">Facebook</label>
                  <UInput
                    v-model="contact.social.facebook"
                    size="sm"
                    placeholder="Facebook URL"
                  />
                </div>
              </div>

              <!-- Notizen Section (Full Width, Editable) -->
              <div class="mt-3 pt-3 border-t border-gray-200">
                <label class="text-xs text-gray-500 block mb-1">Notizen</label>
                <UTextarea
                  v-model="contact.notizen"
                  :rows="3"
                  placeholder="Notizen zu diesem Kontakt..."
                />
              </div>
            </div>

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

defineEmits<{
  (e: "updateConversation", value: string): void;
  (e: "updateResearch", value: string): void;
}>();

// ============================================
// EDIT MODE STATE
// ============================================
// Controls whether company info section is in edit mode
const isEditingCompanyInfo = ref(false);

// Controls whether contacts section is in edit mode
const isEditingContacts = ref(false);

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
const saveCompanyInfo = () => {
  // TODO: Here you would emit an event or call an API to save the changes
  console.log("Saving company info:", editedCompanyInfo.value);

  // Exit edit mode
  isEditingCompanyInfo.value = false;
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

// Get the first secondary contact for view mode (only show one)
const firstSecondaryContact = computed(() => {
  if (!props.selectedCustomer?.contacts) return null;
  return props.selectedCustomer.contacts.find((c) => !c.isPrimary) || null;
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
const saveContacts = () => {
  // Validate: must have at least one primary contact
  const hasPrimary = editedContacts.value.some((c) => c.isPrimary);
  if (!hasPrimary) {
    alert("Bitte markieren Sie mindestens einen Kontakt als Primär.");
    return;
  }

  // TODO: Here you would emit an event or call an API to save the changes
  console.log("Saving contacts:", editedContacts.value);

  // Exit edit mode
  isEditingContacts.value = false;
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
</script>
