<script setup lang="ts">
const { isOpen } = useSidebar()
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Topbar - Full width at top -->
    <UiTopbar />
    
    <!-- Content Area with Sidebar -->
    <div class="flex h-[calc(100vh-64px)]">
      <!-- Sidebar -->
      <UiSidebar />
      
      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto">
        <div class="p-4 sm:p-6 lg:p-8">
          <NuxtLoadingIndicator />
          <NuxtRouteAnnouncer />
          <NuxtPage />
        </div>
      </main>
    </div>
  </div>
</template>