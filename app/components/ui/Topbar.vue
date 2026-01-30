<script setup lang="ts">
import { useSidebar } from "~/composables/sidebar/useSidebar";
import { useAuth } from "~/composables/auth/useAuth";

const { isMobileOpen, toggleMobile } = useSidebar();
const { user, signOut } = useAuth();

const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

const toggleDarkMode = () => {
  colorMode.preference = isDark.value ? "light" : "dark";
};

// Dropdown state
const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false;
  }
};

const handleLogout = async () => {
  isDropdownOpen.value = false;
  await signOut();
};
</script>

<template>
  <header
    class="bg-[var(--winered-text)] dark:bg-[var(--winered-dark)] border-b border-red-200 dark:border-[var(--winered-medium)] h-16 flex items-center justify-between px-4 shadow-sm relative z-20"
  >
    <!-- Left Side -->
    <div class="flex items-center gap-4">
      <!-- Mobile Menu Button -->
      <button
        class="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-[var(--winered-medium)] focus:outline-none transition-colors duration-200"
        @click="toggleMobile"
        :title="'Menü öffnen'"
      >
        <svg
          class="w-5 h-5 text-[var(--winered-text)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      <!-- Logo -->
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-lg bg-[var(--winered-light)] flex items-center justify-center shadow-sm"
        >
          <svg
            class="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </div>
        <div class="hidden md:block">
          <h1
            class="text-lg font-semibold text-gray-900 dark:text-[var(--winered-text)]"
          >
            Call Center CRM
          </h1>
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
          <svg
            class="w-4 h-4 text-gray-400 dark:text-red-400"
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
          <span
            class="text-gray-900 dark:text-[var(--winered-text)] font-medium"
          >
            {{ $route.meta.title || $route.name || "Dashboard" }}
          </span>
        </nav>
      </div>
    </div>

    <!-- Right Side -->
    <div class="flex items-center gap-2">
      
      <!-- User Dropdown -->
      <div v-if="user" class="relative" ref="dropdownRef">
        <button 
          @click="isDropdownOpen = !isDropdownOpen"
          class="flex items-center gap-2 ml-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <div
            class="w-8 h-8 rounded-full bg-[var(--winered-light)]/20 flex items-center justify-center border border-[var(--winered-light)]/30"
          >
            <span class="text-sm font-semibold text-[var(--winered-light)]">
              {{ user.name?.charAt(0)?.toUpperCase() || "U" }}
            </span>
          </div>
          <div class="hidden sm:block text-left">
            <p
              class="text-sm font-medium text-gray-900 dark:text-[var(--winered-text)] truncate max-w-[150px]"
            >
              {{ user.name || "User" }}
            </p>
          </div>
          <svg 
            class="w-4 h-4 text-gray-500 transition-transform duration-200"
            :class="{ 'rotate-180': isDropdownOpen }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <div 
          v-if="isDropdownOpen"
          class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50 transform origin-top-right transition-all"
        >
          <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ user.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ user.email }}</p>
            <p class="text-xs text-[var(--winered-light)] mt-1 font-medium">{{ user.role }}</p>
          </div>
          
          <div class="py-1">
            <NuxtLink
              to="/settings"
              @click="isDropdownOpen = false"
              class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Einstellungen
            </NuxtLink>
          </div>
          <div class="py-1">
            <button
              @click="toggleDarkMode"
              class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <svg v-if="isDark" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              {{ isDark ? 'Heller Modus' : 'Dunkler Modus' }}
            </button>
          </div>

          <div class="border-t border-gray-100 dark:border-gray-700 py-1">
            <button
              @click="handleLogout"
              class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Abmelden
            </button>
          </div>
        </div>
      </div>

      <!-- Login Button if no user -->
      <NuxtLink
        v-else
        to="/login"
        class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[var(--winered-light)] rounded-lg hover:bg-[var(--winered-medium)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--winered-light)] transition-colors duration-200"
      >
        Anmelden
      </NuxtLink>
    </div>
  </header>
</template>
