import { ref } from "vue";

export const useSidebar = () => {
  // Desktop sidebar state
  const isOpen = ref(true);

  // Mobil sidebar state
  const isMobileOpen = ref(false);

  // Desktop-Sidebar ein-/ausblenden
  const toggle = () => {
    isOpen.value = !isOpen.value;
  };

  // Mobil sidebar öffnen
  const openMobile = () => {
    isMobileOpen.value = true;
  };

  // Mobile sidebar schließen
  const closeMobile = () => {
    isMobileOpen.value = false;
  };

  // Mobil-Sidebar umschalten
  const toggleMobile = () => {
    isMobileOpen.value = !isMobileOpen.value;
  };

  return {
    // Die States
    isOpen,
    isMobileOpen,

    // Die methods
    toggle,
    openMobile,
    closeMobile,
    toggleMobile,
  };
};
