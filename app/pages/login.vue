<script setup lang="ts">
import { useAuth } from '~/composables/auth/useAuth';

definePageMeta({
  layout: "auth",
});

const { signIn, isAuthenticated } = useAuth();
const router = useRouter();

const email = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);

// Redirect if already logged in
watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    router.push("/");
  }
}, { immediate: true });

async function handleSubmit() {
  error.value = "";
  isLoading.value = true;
  
  try {
    await signIn(email.value, password.value);
    router.push("/");
  } catch (e: any) {
    error.value = e.message || "Anmeldung fehlgeschlagen";
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Left Side: Branding & Visuals (Hidden on mobile) -->
    <div class="hidden lg:flex lg:w-1/2 relative bg-winered-900 overflow-hidden">
      <!-- Gradient Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-winered-800 to-winered-950"></div>
      
      <!-- Decorative Pattern (Abstract Circles) -->
      <div class="absolute top-0 left-0 w-full h-full opacity-10">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full">
          <circle cx="0" cy="0" r="40" fill="white" />
          <circle cx="100" cy="100" r="30" fill="white" />
        </svg>
      </div>

      <!-- Content (Removed as requested) -->
      <div class="relative z-10 flex flex-col justify-between w-full p-12 text-white">
        <!-- Visuals only, no text -->
      </div>
    </div>

    <!-- Right Side: Login Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
      <div class="w-full max-w-md space-y-8">
        <!-- Mobile Header (Visible only on small screens) -->
        <div class="lg:hidden text-center mb-8">
           <h1 class="text-3xl font-bold text-winered-900 dark:text-white">CRM Premium</h1>
        </div>
      
        <div class="text-center lg:text-left">
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Willkommen zurück
          </h2>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Bitte geben Sie Ihre Zugangsdaten ein.
          </p>
        </div>

        <div v-if="error" class="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-md">
          <div class="flex">
            <div class="ml-3">
              <p class="text-sm text-red-700 dark:text-red-200">{{ error }}</p>
            </div>
          </div>
        </div>

        <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
          <div class="space-y-5">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                E-Mail Adresse Button
              </label>
              <div class="mt-1 relative rounded-md shadow-sm">
                 <input
                  id="email"
                  v-model="email"
                  type="email"
                  required
                  class="block w-full rounded-lg border-gray-300 dark:border-gray-700 pl-4 py-3 focus:border-winered-500 focus:ring-winered-500 sm:text-sm dark:bg-gray-800 dark:text-white"
                  placeholder="name@firma.de"
                />
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Passwort
              </label>
              <div class="mt-1 relative rounded-md shadow-sm">
                <input
                  id="password"
                  v-model="password"
                  type="password"
                  required
                  class="block w-full rounded-lg border-gray-300 dark:border-gray-700 pl-4 py-3 focus:border-winered-500 focus:ring-winered-500 sm:text-sm dark:bg-gray-800 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
              <div class="flex items-center justify-end mt-2">
                 <a href="#" class="text-sm font-medium text-winered-600 hover:text-winered-500">Passwort vergessen?</a>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-winered-600 hover:bg-winered-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-winered-500 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-[0.98]"
            >
              <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {{ isLoading ? 'Wird angemeldet...' : 'Anmelden' }}
            </button>
          </div>
        </form>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-900 text-gray-500">
                Oder
              </span>
            </div>
          </div>

          <div class="mt-6 text-center">
             <p class="text-sm text-gray-600 dark:text-gray-400">
                Haben Sie noch keinen Zugang? 
                <NuxtLink to="/register" class="font-medium text-winered-600 hover:text-winered-500 transition">
                  Jetzt kostenlos registrieren
                </NuxtLink>
             </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
