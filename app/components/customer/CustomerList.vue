<template>
  <div class="w-1/3 bg-white border-r border-gray-200 p-3">
    <div class="mb-3">
      <h2 class="text-base font-bold text-gray-800">Zugewiesene Kunden</h2>
    </div>

    <div class="space-y-1">
      <div
        v-for="customer in customers"
        :key="customer.id"
        class="p-2 border rounded cursor-pointer transition-all"
        :class="selectedCustomer?.id === customer.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'"
        @click="$emit('select', customer)"
      >
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-semibold text-sm text-gray-800">{{ customer.companyName }}</h3>
            <p class="text-sm text-gray-500">
              {{ customer.assignedAgentName || 'Unzugewiesen' }}
            </p>
          </div>
          <span class="px-1.5 py-0.5 text-sm rounded" :class="getStatusColor(customer.status)">
            {{ customer.project }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Customer } from '~/composables/customers/useCustomers'
import { getStatusColor } from '~/utils/status'

defineProps<{
  customers: Customer[]
  selectedCustomer: Customer | null
}>()

defineEmits<{
  (e: 'select', customer: Customer): void
}>()
</script>


