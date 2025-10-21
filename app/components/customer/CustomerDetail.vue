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
          <h3 class="text-lg font-bold text-gray-800 mb-4">
            Unternehmensinformationen
          </h3>
          <div class="grid grid-cols-4 gap-4">
            <div>
              <label class="text-sm text-gray-500">Kundenname</label>
              <p class="font-bold text-gray-800">
                {{ selectedCustomer.companyName }}
              </p>
            </div>
            <div>
              <label class="text-sm text-gray-500">GesellschaftsForm</label>
              <p class="font-bold text-gray-800">
                {{ selectedCustomer.companyForm }}
              </p>
            </div>
            <div>
              <label class="text-sm text-gray-500">Branche</label>
              <p class="font-bold text-gray-800">
                {{ selectedCustomer.industry }}
              </p>
            </div>
            <div>
              <label class="text-sm text-gray-500">MitarbeiterAnzahl</label>
              <p class="font-bold text-gray-800">
                {{ formatEmployeeCount(selectedCustomer.employeeCount) }}
              </p>
            </div>

            <div>
              <label class="text-sm text-gray-500">Webseite</label>
              <p class="font-bold text-gray-800">
                {{ selectedCustomer.website }}
              </p>
            </div>
            <div>
              <label class="text-sm text-gray-500">TelefonNummer</label>
              <p class="font-bold text-gray-800">
                {{ selectedCustomer.phoneNumber }}
              </p>
            </div>
            <div>
              <label class="text-sm text-gray-500">Mail</label>
              <p class="font-bold text-gray-800">
                {{ selectedCustomer.email }}
              </p>
            </div>
            <div>
              <label class="text-sm text-gray-500">Öffnungszeiten</label>
              <p class="font-bold text-gray-800">
                {{ selectedCustomer.openingHours }}
              </p>
            </div>

            <div>
              <label class="text-sm text-gray-500">UmsatsGröße</label>
              <p class="font-bold text-gray-800">
                {{ selectedCustomer.revenueSize }}
              </p>
            </div>
            <div>
              <label class="text-sm text-gray-500">Straße,Hausnummer</label>
              <p class="font-bold text-gray-800">
                {{ selectedCustomer.streetAddress }}
              </p>
            </div>
            <div>
              <label class="text-sm text-gray-500">Plz</label>
              <p class="font-bold text-gray-800">
                {{ selectedCustomer.postalCode }}
              </p>
            </div>
            <div>
              <label class="text-sm text-gray-500">Ort</label>
              <p class="font-bold text-gray-800">{{ selectedCustomer.city }}</p>
            </div>

            <div>
              <label class="text-sm text-gray-500">Bundesland</label>
              <p class="font-bold text-gray-800">
                {{ selectedCustomer.state }}
              </p>
            </div>
            <div>
              <label class="text-sm text-gray-500">Gründung</label>
              <p class="font-bold text-gray-800">
                {{ selectedCustomer.foundingDate }}
              </p>
            </div>
            <div class="col-span-2">
              <label class="text-sm text-gray-500">Beschreibung</label>
              <p class="font-bold text-gray-800">
                {{ selectedCustomer.description }}
              </p>
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
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-lg font-bold text-gray-800">
              Kontakte({{ getContactCount(selectedCustomer) }})
            </h3>
            <span class="text-sm text-gray-500"
              >Primär({{ selectedCustomer.primaryContact.firstName }}) ↓</span
            >
          </div>

          <div class="bg-blue-50 border border-gray-200 rounded-lg mb-3 p-4">
            <div class="flex justify-between items-center mb-3">
              <div class="flex items-center space-x-2">
                <span
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                  >✓ Primär</span
                >
                <h4 class="font-bold text-gray-800">
                  {{ selectedCustomer.primaryContact.firstName }}
                </h4>
              </div>
              <div class="flex space-x-2">
                <UButton
                  size="sm"
                  color="primary"
                  @click="callContact(selectedCustomer.primaryContact)"
                  >📞 Anrufen</UButton
                >
                <UButton
                  size="sm"
                  color="primary"
                  variant="outline"
                  @click="emailContact(selectedCustomer.primaryContact)"
                  >✉️ Email</UButton
                >
              </div>
            </div>

            <div class="grid grid-cols-4 gap-4">
              <div>
                <label class="text-xs text-gray-500">Vorname</label>
                <p class="font-bold text-sm text-gray-800">
                  {{ selectedCustomer.primaryContact.firstName }}
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500">Mail</label>
                <p class="font-bold text-sm text-gray-800">
                  {{ selectedCustomer.primaryContact.email }}
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500">Telefonnummer</label>
                <p class="font-bold text-sm text-gray-800">
                  {{ selectedCustomer.primaryContact.phoneNumber }}
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500">Position</label>
                <p class="font-bold text-sm text-gray-800">
                  {{ selectedCustomer.primaryContact.position || "-" }}
                </p>
              </div>
            </div>

            <div
              class="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-200"
            >
              <div>
                <label class="text-xs text-gray-500">Geburtsdatum</label>
                <p class="text-xs text-gray-600">
                  {{ selectedCustomer.primaryContact.birthDate || "-" }}
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500">LinkedIn</label>
                <p class="text-xs text-blue-600 hover:underline cursor-pointer">
                  {{ selectedCustomer.primaryContact.social?.linkedin || "-" }}
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500">Xing</label>
                <p class="text-xs text-blue-600 hover:underline cursor-pointer">
                  {{ selectedCustomer.primaryContact.social?.xing || "-" }}
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500">Facebook</label>
                <p class="text-xs text-blue-600 hover:underline cursor-pointer">
                  {{ selectedCustomer.primaryContact.social?.facebook || "-" }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg mb-3 p-4">
            <div class="flex justify-between items-center mb-3">
              <div class="flex items-center space-x-2">
                <span
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
                  >- Sekundär</span
                >
                <h4 class="font-bold text-gray-800">Anna Schmidt</h4>
              </div>
              <div class="flex space-x-2">
                <UButton
                  size="sm"
                  color="neutral"
                  variant="outline"
                  @click="callContact('secondary')"
                  >📞 Anrufen</UButton
                >
                <UButton
                  size="sm"
                  color="neutral"
                  variant="outline"
                  @click="emailContact('secondary')"
                  >✉️ Email</UButton
                >
              </div>
            </div>

            <div class="grid grid-cols-4 gap-4">
              <div>
                <label class="text-xs text-gray-500">Vorname</label>
                <p class="font-bold text-sm text-gray-800">
                  {{ selectedCustomer.secondaryContact?.firstName || "-" }}
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500">Mail</label>
                <p class="font-bold text-sm text-gray-800">
                  {{ selectedCustomer.secondaryContact?.email || "-" }}
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500">Telefonnummer</label>
                <p class="font-bold text-sm text-gray-800">
                  {{ selectedCustomer.secondaryContact?.phoneNumber || "-" }}
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500">Position</label>
                <p class="font-bold text-sm text-gray-800">
                  {{ selectedCustomer.secondaryContact?.position || "-" }}
                </p>
              </div>
            </div>

            <div
              class="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-200"
            >
              <div>
                <label class="text-xs text-gray-500">Geburtsdatum</label>
                <p class="text-xs text-gray-600">
                  {{ selectedCustomer.secondaryContact?.birthDate || "-" }}
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500">LinkedIn</label>
                <p class="text-xs text-blue-600 hover:underline cursor-pointer">
                  {{
                    selectedCustomer.secondaryContact?.social?.linkedin || "-"
                  }}
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500">Xing</label>
                <p class="text-xs text-blue-600 hover:underline cursor-pointer">
                  {{ selectedCustomer.secondaryContact?.social?.xing || "-" }}
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500">Facebook</label>
                <p class="text-xs text-blue-600 hover:underline cursor-pointer">
                  {{
                    selectedCustomer.secondaryContact?.social?.facebook || "-"
                  }}
                </p>
              </div>
            </div>
          </div>
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

defineProps<{
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
