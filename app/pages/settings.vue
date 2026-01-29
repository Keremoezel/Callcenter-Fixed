<script setup lang="ts">
import { authClient } from "~/lib/auth-client";
import { useAuth } from "~/composables/auth/useAuth";

const { user } = useAuth();

// Profile State
const profileForm = ref({
  name: user.value?.name || "",
});
const isUpdatingProfile = ref(false);

// Password State
const passwordForm = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});
const isChangingPassword = ref(false);

// Update Profile
const updateProfile = async () => {
  isUpdatingProfile.value = true;
  try {
    const { error } = await authClient.updateUser({
      name: profileForm.value.name,
    });
    
    if (error) {
       alert(error.message || "Fehler beim Aktualisieren des Profils");
       return;
    }
    
    alert("Profil erfolgreich aktualisiert");
  } catch (e) {
    console.error(e);
    alert("Ein Unerwarteter Fehler ist aufgetreten");
  } finally {
    isUpdatingProfile.value = false;
  }
};

// Change Password
const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert("Die neuen Passwörter stimmen nicht überein");
    return;
  }

  isChangingPassword.value = true;
  try {
    const { error } = await authClient.changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
      revokeOtherSessions: true,
    });

    if (error) {
        alert(error.message || "Fehler beim Ändern des Passworts");
        return;
    }

    alert("Passwort erfolgreich geändert");
    passwordForm.value = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
  } catch (e) {
    console.error(e);
    alert("Ein Unerwarteter Fehler ist aufgetreten");
  } finally {
    isChangingPassword.value = false;
  }
};

// Sync user name
watch(user, (newUser) => {
  if (newUser) {
    profileForm.value.name = newUser.name;
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
    <div class="max-w-3xl mx-auto px-4 sm:px-6">
      
      <!-- Simple Header -->
      <div class="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Einstellungen</h1>
      </div>

      <div class="space-y-6">
        
        <!-- Profile Section (Compact) -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <span class="i-heroicons-user w-4 h-4"></span>
              Profil & Konto
            </h2>
          </div>
          
          <div class="p-4 space-y-4">
            <!-- User Info (Read Only) -->
            <div class="flex items-center gap-4 py-2">
              <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                {{ user?.name.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ user?.name }}</p>
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                    {{ user?.role }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 truncate">{{ user?.email }}</p>
              </div>
            </div>

            <!-- Edit Form -->
            <div class="grid grid-cols-1 gap-4 max-w-lg">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Anzeigename</label>
                <div class="flex gap-2">
                  <UInput v-model="profileForm.name" size="sm" class="flex-1" />
                  <UButton 
                    @click="updateProfile" 
                    :loading="isUpdatingProfile"
                    color="primary"
                    variant="solid"
                    size="xs"
                  >
                    Speichern
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Security Section (Compact) -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
           <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <span class="i-heroicons-lock-closed w-4 h-4"></span>
              Passwort ändern
            </h2>
          </div>
          
          <div class="p-4">
            <div class="space-y-3 max-w-sm">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Aktuelles Passwort</label>
                <UInput v-model="passwordForm.currentPassword" type="password" size="sm" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Neues Passwort</label>
                <UInput v-model="passwordForm.newPassword" type="password" size="sm" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bestätigen</label>
                <UInput v-model="passwordForm.confirmPassword" type="password" size="sm" />
              </div>
              
              <div class="pt-1">
                <UButton 
                  @click="changePassword" 
                  :loading="isChangingPassword"
                  color="primary"
                  variant="solid"
                  size="xs"
                >
                  Passwort aktualisieren
                </UButton>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
