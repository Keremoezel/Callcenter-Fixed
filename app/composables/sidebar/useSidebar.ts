import { ref } from "vue";

export const useSidebar = () => {
  // Desktop sidebar durumu
  const isOpen = ref(true);

  // Mobil sidebar durumu
  const isMobileOpen = ref(false);

  // Desktop sidebar durumunu değiştirme
  const toggle = () => {
    isOpen.value = !isOpen.value;
  };

  // Mobil sidebar'ı açma
  const openMobile = () => {
    isMobileOpen.value = true;
  };

  // Mobil sidebar'ı kapatma
  const closeMobile = () => {
    isMobileOpen.value = false;
  };

  // Mobil sidebar durumunu değiştirme
  const toggleMobile = () => {
    isMobileOpen.value = !isMobileOpen.value;
  };

  return {
    // Durumlar
    isOpen,
    isMobileOpen,

    // Metodlar
    toggle,
    openMobile,
    closeMobile,
    toggleMobile,
  };
};
