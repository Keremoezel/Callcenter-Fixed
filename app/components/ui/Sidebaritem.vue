<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  to: string
  label: string
  icon: string
  badge?: string | number
  isOpen?: boolean
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  isActive: false
})

// Icon mapping
const IconComponent = computed(() => {
  const icons: Record<string, string> = {
    dashboard: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
    phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
    contacts: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    activities: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    clipboard: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    teams: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
    users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
    cog: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
  }
  return icons[props.icon] || icons.dashboard
})
</script>

<template>
  <NuxtLink
    :to="to"
    :title="!isOpen ? label : undefined"
    :aria-label="!isOpen ? label : undefined"
    :class="[
      'group flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300 ease-in-out',
      'hover:bg-white/10 focus:outline-none',
      isActive && isOpen
        ? 'bg-white/10 text-white' 
        : isActive && !isOpen
        ? 'text-white'
        : 'text-neutral-300 hover:text-white',
      !isOpen ? 'justify-center px-0 w-12 h-12' : ''
    ]"
  >
    <!-- Icon Container -->
    <div class="relative flex-shrink-0 flex items-center justify-center">
      <!-- Icon Background (when collapsed) -->
      <div 
        v-if="!isOpen"
        :class="[
          'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ease-in-out',
          isActive 
            ? 'bg-white/20' 
            : 'bg-neutral-800/50 hover:bg-neutral-700/50'
        ]"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="IconComponent" />
        </svg>
      </div>
      
      <!-- Icon (when expanded) -->
      <svg 
        v-else
        class="w-5 h-5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="IconComponent" />
      </svg>
      
      <!-- Badge -->
      <div 
        v-if="badge && isOpen" 
        class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-xs font-medium bg-brand-primary text-white rounded-full flex items-center justify-center"
      >
        {{ badge }}
      </div>
    </div>
    
    <!-- Label -->
    <span 
      :class="[
        'font-medium transition-all duration-300 ease-in-out overflow-hidden',
        isOpen 
          ? 'opacity-100 w-auto' 
          : 'opacity-0 w-0'
      ]"
    >
      {{ label }}
    </span>
    
    <!-- Badge (collapsed mode) -->
    <div 
      v-if="badge && !isOpen" 
      class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-xs font-medium bg-brand-primary text-white rounded-full flex items-center justify-center"
    >
      {{ badge }}
    </div>
  </NuxtLink>
</template>