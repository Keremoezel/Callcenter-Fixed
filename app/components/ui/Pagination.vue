<template>
  <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
    <!-- Info Text -->
    <div class="flex items-center gap-2 text-sm text-gray-700">
      <span>Seite {{ currentPage }} von {{ totalPages }}</span>
      <span class="text-gray-400">|</span>
      <span>{{ total }} Einträge gesamt</span>
    </div>

    <!-- Pagination Buttons -->
    <div class="flex items-center gap-1">
      <!-- First Page -->
      <button
        @click="goToPage(1)"
        :disabled="currentPage === 1"
        class="px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        :class="currentPage === 1 ? 'text-gray-400' : 'text-gray-700'"
        title="Erste Seite"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>

      <!-- Previous Page -->
      <button
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        :class="currentPage === 1 ? 'text-gray-400' : 'text-gray-700'"
      >
        Zurück
      </button>

      <!-- Page Numbers -->
      <div class="flex items-center gap-1">
        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== '...'"
            @click="goToPage(page as number)"
            class="min-w-[2rem] px-3 py-1 rounded text-sm font-medium transition-colors"
            :class="
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            "
          >
            {{ page }}
          </button>
          <span v-else class="px-2 text-gray-400">...</span>
        </template>
      </div>

      <!-- Next Page -->
      <button
        v-if="totalPages > 1"
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        :class="currentPage === totalPages ? 'text-gray-400' : 'text-gray-700'"
      >
        Weiter
      </button>

      <!-- Last Page -->
      <button
        v-if="totalPages > 1"
        @click="goToPage(totalPages)"
        :disabled="currentPage === totalPages"
        class="px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        :class="currentPage === totalPages ? 'text-gray-400' : 'text-gray-700'"
        title="Letzte Seite"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  currentPage: number;
  totalPages: number;
  total: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'page-change': [page: number];
}>();

const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const { currentPage, totalPages } = props;

  if (totalPages <= 7) {
    // Show all pages if 7 or fewer
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    // Show pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    // Always show last page
    pages.push(totalPages);
  }

  return pages;
});

function goToPage(page: number) {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page);
  }
}
</script>
