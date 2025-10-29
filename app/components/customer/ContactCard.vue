<template>
  <div
    :class="[
      'border border-gray-200 rounded-lg mb-3 p-4',
      contact.isPrimary ? 'bg-blue-50' : 'bg-white',
    ]"
  >
    <!-- Header: Badge + Name + Action Buttons -->
    <div class="flex justify-between items-center mb-3">
      <div class="flex items-center space-x-2">
        <!-- Primary/Contact Number Badge -->
        <span
          :class="[
            'inline-flex items-center px-2 py-1 rounded-full text-xs',
            contact.isPrimary
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600',
          ]"
        >
          {{ contact.isPrimary ? "✓ Primär" : `Kontakt ${index + 1}` }}
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
          @click="$emit('call', contact)"
          >📞 Anrufen</UButton
        >
        <UButton
          size="sm"
          :color="contact.isPrimary ? 'primary' : 'neutral'"
          variant="outline"
          @click="$emit('email', contact)"
          >✉️ Email</UButton
        >
      </div>
    </div>

    <!-- Main Contact Info: 4 columns -->
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

    <!-- Social Media Info: 4 columns -->
    <div class="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-200">
      <div>
        <label class="text-xs text-gray-500">Geburtsdatum</label>
        <p class="text-xs text-gray-600">
          {{ contact.birthDate || "-" }}
        </p>
      </div>
      <div>
        <label class="text-xs text-gray-500">LinkedIn</label>
        <p class="text-xs text-blue-600 hover:underline cursor-pointer">
          {{ contact.social?.linkedin || "-" }}
        </p>
      </div>
      <div>
        <label class="text-xs text-gray-500">Xing</label>
        <p class="text-xs text-blue-600 hover:underline cursor-pointer">
          {{ contact.social?.xing || "-" }}
        </p>
      </div>
      <div>
        <label class="text-xs text-gray-500">Facebook</label>
        <p class="text-xs text-blue-600 hover:underline cursor-pointer">
          {{ contact.social?.facebook || "-" }}
        </p>
      </div>
    </div>

    <!-- Notizen Section: Full width -->
    <div class="mt-3 pt-3 border-t border-gray-200">
      <label class="text-xs text-gray-500">Notizen</label>
      <p class="text-sm text-gray-700 mt-1">
        {{ contact.notizen || "-" }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Contact } from "~/composables/customers/useCustomers";

// ============================================
// PROPS
// ============================================
defineProps<{
  contact: Contact;
  index: number; // For "Kontakt 2, 3, 4..." labeling
}>();

// ============================================
// EMITS
// ============================================
defineEmits<{
  (e: "call", contact: Contact): void;
  (e: "email", contact: Contact): void;
}>();
</script>
