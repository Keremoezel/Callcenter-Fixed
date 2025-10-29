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
      <div class="mb-3">
        <h2 class="text-base font-bold text-gray-800">Zugewiesene Kunden</h2>
      </div>

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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Customer } from '~/composables/customers/useCustomers'
import { getStatusColor } from '~/utils/status'

defineProps<{
  customers: Customer[]
  selectedCustomer: Customer | null
}>()

defineEmits<{
  (e: 'select', customer: Customer): void
}>()

// Collapse state
const isCollapsed = ref(false)

// Button hover state for wine-red color transition
const isButtonHovered = ref(false)

// Toggle collapse function
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>


