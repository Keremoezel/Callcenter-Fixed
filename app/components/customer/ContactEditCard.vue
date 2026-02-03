<template>
  <div
    :class="[
      'border border-gray-200 rounded-lg mb-3 p-4',
      contact.isPrimary ? 'bg-blue-50' : 'bg-white',
    ]"
  >
    <!-- Header: Badge + Primary Button + Name + Delete Button -->
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
          @click="$emit('setPrimary', index)"
        >
          Als Primär markieren
        </UButton>

        <h4 class="font-bold text-gray-800">
          {{ contact.firstName || "Neuer Kontakt" }}
        </h4>
      </div>

      <!-- Remove Contact Button (only for non-primary) -->
      <UButton
        v-if="!contact.isPrimary && canDelete"
        size="xs"
        color="error"
        variant="ghost"
        icon="i-heroicons-trash"
        @click="$emit('remove', index)"
      >
        Löschen
      </UButton>
    </div>

    <!-- Contact Fields: 4 columns (Editable) -->
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
        <label class="text-xs text-gray-500">Nachname</label>
        <UInput
          v-model="contact.lastName"
          size="sm"
          placeholder="Nachname eingeben"
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
    </div>

    <!-- Position: separate row to keep layout clean -->
    <div class="grid grid-cols-4 gap-4 mt-3">
      <div>
        <label class="text-xs text-gray-500">Position</label>
        <UInput
          v-model="contact.position"
          size="sm"
          placeholder="Position eingeben"
        />
      </div>
    </div>

    <!-- Social Media Fields: 4 columns (Editable) -->
    <div class="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-200">
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

    <!-- Notizen Section: Full width (Editable) -->
    <div class="mt-3 pt-3 border-t border-gray-200">
      <label class="text-xs text-gray-500 block mb-1">Notizen</label>
      <UTextarea
        v-model="contact.notizen"
        :rows="3"
        placeholder="Notizen zu diesem Kontakt..."
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// ============================================
// PROPS
// ============================================
defineProps<{
  contact: any; // Using any to allow v-model binding
  index: number; // For identifying which contact to set as primary or remove
  canDelete: boolean; // Whether delete button should be shown (more than 1 contact)
}>();

// ============================================
// EMITS
// ============================================
defineEmits<{
  (e: "setPrimary", index: number): void;
  (e: "remove", index: number): void;
}>();
</script>
