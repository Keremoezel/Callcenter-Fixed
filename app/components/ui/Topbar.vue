<script setup lang="ts">
const { isMobileOpen, toggleMobile } = useSidebar()
const { user } = useAuth()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const toggleDarkMode = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <header class="bg-[var(--winered-text)] dark:bg-[var(--winered-dark)] border-b border-red-200 dark:border-[var(--winered-medium)] h-16 flex items-center justify-between px-4 shadow-sm">
    <!-- Left Side -->
    <div class="flex items-center gap-4">
      <!-- Mobile Menu Button -->
      <button
        class="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-[var(--winered-medium)] focus:outline-none transition-colors duration-200"
        @click="toggleMobile"
        :title="'Menüyü aç'"
      >
        <svg class="w-5 h-5 text-[var(--winered-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      <!-- Logo -->
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-[var(--winered-light)] flex items-center justify-center shadow-sm">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <div class="hidden md:block">
          <h1 class="text-lg font-semibold text-gray-900 dark:text-[var(--winered-text)]">Call Center CRM</h1>
          <p class="text-xs text-gray-500 dark:text-red-300">Professional</p>
        </div>
      </div>
      
      <!-- Breadcrumb -->
      <div class="hidden md:block">
        <nav class="flex items-center space-x-2 text-sm">
          <NuxtLink 
            to="/" 
            class="text-gray-600 dark:text-red-300 hover:text-[var(--winered-light)] dark:hover:text-[var(--winered-light)] transition-colors font-semibold"
          >
            Dashboard
          </NuxtLink>
          <svg class="w-4 h-4 text-gray-400 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-gray-900 dark:text-[var(--winered-text)] font-medium">
            {{ $route.meta.title || $route.name || 'Dashboard' }}
          </span>
        </nav>
      </div>
    </div>

    <!-- Right Side -->
    <div class="flex items-center gap-2">
      <!-- Dark Mode Toggle -->
      <button
        class="inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-[var(--winered-medium)] focus:outline-none transition-colors duration-200"
        @click="toggleDarkMode"
        :title="isDark ? 'Açık tema' : 'Koyu tema'"
      >
        <svg v-if="isDark" class="w-5 h-5 text-gray-600 dark:text-[var(--winered-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else class="w-5 h-5 text-gray-600 dark:text-[var(--winered-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
      
      
      <!-- <button
        class="inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-[var(--winered-medium)] focus:outline-none transition-colors duration-200 relative"
        :title="'Notifikationen'"
      >
        <svg class="w-5 h-5 text-gray-600 dark:text-[var(--winered-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM10.97 4.757l-.022.006-.399.102c-2.072.525-3.648 2.18-4.126 4.3C6.179 10.146 6 11.25 6 12.5c0 .866-.05 1.667-.146 2.4-.096.732-.24 1.39-.434 1.972-.194.582-.438 1.09-.732 1.524-.294.434-.638.798-1.032 1.092-.394.294-.838.518-1.332.672-.494.154-1.038.232-1.632.232H18c-.594 0-1.138-.078-1.632-.232-.494-.154-.938-.378-1.332-.672-.394-.294-.738-.658-1.032-1.092-.294-.434-.538-.942-.732-1.524-.194-.582-.338-1.24-.434-1.972C12.05 14.167 12 13.366 12 12.5c0-1.25-.179-2.354-.423-3.335-.478-2.12-2.054-3.775-4.126-4.3l-.399-.102-.022-.006z" />
        </svg>
        
        <span class="absolute -top-1 -right-1 w-3 h-3 bg-[var(--winered-light)] rounded-full border-2 border-white dark:border-[var(--winered-dark)]"></span>
      </button> -->

      <!-- User Avatar -->
      <div v-if="user" class="flex items-center gap-2 ml-2">
        <div class="w-8 h-8 rounded-full bg-[var(--winered-light)]/20 flex items-center justify-center">
          <span class="text-sm font-semibold text-[var(--winered-light)]">
            {{ user.name?.charAt(0)?.toUpperCase() || 'U' }}
          </span>
        </div>
        <div class="hidden sm:block">
          <p class="text-sm font-medium text-gray-900 dark:text-[var(--winered-text)] truncate">{{ user.name || 'User' }}</p>
        </div>
      </div>
      
      <!-- Login Button if no user -->
      <button
        v-else
        class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[var(--winered-light)] rounded-lg hover:bg-[var(--winered-medium)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--winered-light)] transition-colors duration-200"
      >
        Anmelden
      </button>
    </div>
  </header>
</template>