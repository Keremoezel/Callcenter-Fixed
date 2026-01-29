<script setup lang="ts">
import { useAuth } from '~/composables/auth/useAuth';

definePageMeta({
  layout: "auth",
});

const { signUp, isAuthenticated } = useAuth();
const router = useRouter();

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
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
  
  // Validate passwords match
  if (password.value !== confirmPassword.value) {
    error.value = "Passwörter stimmen nicht überein";
    return;
  }
  
  // Validate password length
  if (password.value.length < 8) {
    error.value = "Passwort muss mindestens 8 Zeichen lang sein";
    return;
  }
  
  isLoading.value = true;
  
  try {
    await signUp(email.value, password.value, name.value);
    router.push("/");
  } catch (e: any) {
    error.value = e.message || "Registrierung fehlgeschlagen";
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <!-- Logo/Title -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
        Konto erstellen
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Registrieren Sie sich für das CRM
      </p>
    </div>
    
    <!-- Register Card -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 p-8">
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Error Message -->
        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        </div>
        
        <!-- Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Name
          </label>
          <input
            id="name"
            v-model="name"
            type="text"
            required
            autocomplete="name"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winered-500 focus:border-transparent transition"
            placeholder="Max Mustermann"
          />
        </div>
        
        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            E-Mail
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winered-500 focus:border-transparent transition"
            placeholder="ihre@email.de"
          />
        </div>
        
        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Passwort
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="new-password"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winered-500 focus:border-transparent transition"
            placeholder="••••••••"
          />
        </div>
        
        <!-- Confirm Password -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Passwort bestätigen
          </label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            autocomplete="new-password"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winered-500 focus:border-transparent transition"
            placeholder="••••••••"
          />
        </div>
        
        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-3 px-4 bg-winered-600 hover:bg-winered-700 disabled:bg-winered-400 text-white font-medium rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
        >
          <svg v-if="isLoading" class="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {{ isLoading ? 'Wird erstellt...' : 'Registrieren' }}
        </button>
      </form>
      
      <!-- Login Link -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Bereits ein Konto?
          <NuxtLink to="/login" class="text-winered-600 hover:text-winered-700 font-medium">
            Jetzt anmelden
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
