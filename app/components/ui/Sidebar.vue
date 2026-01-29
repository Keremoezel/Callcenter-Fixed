<script setup lang="ts">
import UiSidebarItem from "./Sidebaritem.vue";
import { useAuth } from "~/composables/auth/useAuth";
import { useSidebar } from "~/composables/sidebar/useSidebar";

const { user, hasRole } = useAuth();
const { isOpen, isMobileOpen, toggle, closeMobile } = useSidebar();

const route = useRoute();

// Navigation groups
const navGroups = computed(() => [
  {
    title: "Hauptnavigation",
    items: [
      { to: "/", label: "Dashboard", icon: "dashboard" },
      { to: "/aufgaben", label: "Aufgaben", icon: "clipboard" },
      { to: "/calls", label: "Anrufe", icon: "phone" },
      { to: "/kunden", label: "Kunden", icon: "contacts" },
      { to: "/activities", label: "Aktivitäten", icon: "activities" },
      { to: "/fls", label: "FLS", icon: "clipboard" },
    ],
  },
  {
    title: "Team",
    items: [{ to: "/teams/my", label: "Mein Team", icon: "teams" }],
    show: hasRole("Teamlead") || hasRole("Agent"),
  },
  {
    title: "Verwaltung",
    items: [
      { to: "/teams", label: "Teams", icon: "teams" },
      { to: "/users", label: "Benutzer", icon: "users" },
      { to: "/call-scripts", label: "Skripte", icon: "clipboard" },
    ],
    show: hasRole("Admin") || hasRole("Teamlead"),
  },
  {
    title: "Admin",
    items: [
      { to: "/admin/users", label: "Benutzerverwaltung", icon: "users" },
    ],
    show: hasRole("Admin") || hasRole("Teamlead"),
  },
  {
    title: "Hilfe & Support",
    items: [{ to: "/settings", label: "Einstellungen", icon: "cog" }],
  },
]);

// Check if item is active
const isItemActive = (to: string) => {
  if (to === "/") {
    return route.path === "/";
  }
  return route.path.startsWith(to);
};
</script>

<template>
  <!-- Desktop Sidebar -->
  <aside
    :class="[
      'hidden lg:flex flex-col h-full border-r border-red-200 bg-[var(--winered-dark)] text-[var(--winered-text)] flex-shrink-0',
      isOpen ? 'w-64' : 'w-16',
      'transition-all duration-300 ease-in-out',
    ]"
    id="app-sidebar"
  >
    <!-- Toggle Button -->
    <div class="p-4 border-b border-[var(--winered-medium)]">
      <div class="flex justify-center">
        <button
          @click="toggle"
          :aria-expanded="isOpen"
          aria-controls="app-sidebar"
          class="inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-[var(--winered-medium)] focus:outline-none"
          :title="isOpen ? 'Sidebar einklappen' : 'Sidebar ausklappen'"
        >
          <svg
            class="w-4 h-4 transition-transform duration-300 ease-in-out"
            :class="{ 'rotate-180': isOpen }"
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
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-4 space-y-8 overflow-y-auto scrollbar-hide">
      <div
        v-for="group in navGroups.filter((g) => g.show !== false)"
        :key="group.title"
        class="space-y-3"
      >
        <!-- Group Title -->
        <h3
          :class="[
            'px-3 text-[10px] uppercase tracking-wider font-semibold text-neutral-400/80 transition-all duration-300 ease-in-out overflow-hidden',
            isOpen ? 'opacity-100 h-auto' : 'opacity-0 h-0',
          ]"
        >
          {{ group.title }}
        </h3>

        <!-- Group Items -->
        <div class="space-y-2">
          <UiSidebarItem
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            :label="item.label"
            :icon="item.icon"
            :isOpen="isOpen"
            :isActive="isItemActive(item.to)"
          />
        </div>
      </div>
    </nav>

    <!-- User Section (Bottom) -->
    <div class="p-4 border-t border-[var(--winered-medium)]">
      <div v-if="user" class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-full bg-[var(--winered-light)]/20 flex items-center justify-center flex-shrink-0"
        >
          <span class="text-sm font-semibold text-[var(--winered-light)]">
            {{ user.name.charAt(0).toUpperCase() }}
          </span>
        </div>
        <div
          :class="[
            'transition-all duration-300 ease-in-out overflow-hidden',
            isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0',
          ]"
        >
          <p class="text-sm font-medium text-white truncate">{{ user.name }}</p>
          <p class="text-xs text-neutral-400 truncate">{{ user.role }}</p>
        </div>
      </div>
    </div>
  </aside>

  <!-- Mobile Drawer -->
  <aside
    v-if="isMobileOpen"
    :class="[
      'fixed inset-y-0 left-0 z-50 w-64 lg:hidden bg-[var(--winered-dark)] text-[var(--winered-text)] transform transition-transform duration-300',
      'translate-x-0',
    ]"
  >
    <!-- Mobile Header -->
    <div class="p-6 border-b border-[var(--winered-medium)]">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-[var(--winered-light)] flex items-center justify-center shadow-lg"
          >
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
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          <div>
            <h1 class="text-lg font-bold text-white">Call Center CRM</h1>
            <p class="text-xs text-neutral-400"></p>
          </div>
        </div>
        <button
          @click="closeMobile"
          class="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:--winered-dark focus:outline-none"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <nav class="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-hide">
      <div
        v-for="group in navGroups.filter((g) => g.show !== false)"
        :key="group.title"
        class="space-y-2"
      >
        <!-- Group Title -->
        <h3
          class="px-3 text-[10px] uppercase tracking-wide text-neutral-400/80"
        >
          {{ group.title }}
        </h3>

        <!-- Group Items -->
        <div class="space-y-1">
          <UiSidebarItem
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            :label="item.label"
            :icon="item.icon"
            :isOpen="true"
            :isActive="isItemActive(item.to)"
          />
        </div>
      </div>
    </nav>

    <!-- Mobile User Section -->
    <div class="p-4 border-t border-[var(--winered-medium)]">
      <div v-if="user" class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-full bg-[var(--winered-light)]/20 flex items-center justify-center"
        >
          <span class="text-sm font-semibold text-[var(--winered-light)]">
            {{ user.name.charAt(0).toUpperCase() }}
          </span>
        </div>
        <div>
          <p class="text-sm font-medium text-white truncate">{{ user.name }}</p>
          <p class="text-xs text-neutral-400 truncate">{{ user.role }}</p>
        </div>
      </div>
    </div>
  </aside>

  <!-- Mobile Backdrop -->
  <div
    v-if="isMobileOpen"
    @click="closeMobile"
    class="fixed inset-0 bg-black/40 z-40 lg:hidden"
  />
</template>

<style scoped>
/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none; /* Internet Explorer 10+ */
  scrollbar-width: none; /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none; /* Safari and Chrome */
}

/* Smooth scrolling */
.scrollbar-hide {
  scroll-behavior: smooth;
}

/* Ensure stable sidebar layout */
#app-sidebar {
  will-change: width;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Prevent layout shifts */
#app-sidebar * {
  box-sizing: border-box;
}

/* Smooth transitions */
#app-sidebar .transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Prevent text wrapping during transitions */
#app-sidebar .overflow-hidden {
  white-space: nowrap;
}

/* Remove all focus rings, shadows, and backgrounds */
#app-sidebar button:focus,
#app-sidebar a:focus {
  outline: none !important;
  box-shadow: none !important;
  ring: none !important;
}

/* Remove any remaining shadows and backgrounds */
#app-sidebar * {
  box-shadow: none !important;
}

/* Clean focus states */
#app-sidebar button:focus-visible,
#app-sidebar a:focus-visible {
  outline: 2px solid transparent !important;
  outline-offset: 2px !important;
}

/* Remove hover backgrounds from sidebar items */
#app-sidebar a:hover {
  background-color: transparent !important;
}

/* Only keep icon background when collapsed */
#app-sidebar .w-10.h-10 {
  background-color: transparent !important;
}

#app-sidebar .w-10.h-10.bg-white\/20 {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

#app-sidebar .w-10.h-10.bg-neutral-800\/50 {
  background-color: rgba(38, 38, 38, 0.5) !important;
}

#app-sidebar .w-10.h-10.bg-neutral-700\/50 {
  background-color: rgba(64, 64, 64, 0.5) !important;
}
</style>
