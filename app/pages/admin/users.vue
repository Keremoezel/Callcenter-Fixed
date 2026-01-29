<script setup lang="ts">
import { useAuth } from '~/composables/auth/useAuth';

definePageMeta({
  middleware: ["admin-only"],
});

const { hasRole } = useAuth();

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

// Pagination state
const currentPage = ref(1);
const limit = ref(50);

// Fetch users with pagination
const { data: usersResponse, pending, refresh } = await useFetch("/api/admin/users", {
  query: { page: currentPage, limit },
  default: () => ({ data: [], pagination: { total: 0, page: 1, limit: 50, pages: 0 } }),
});

const users = computed(() => usersResponse.value?.data || []);
const pagination = computed(() => usersResponse.value?.pagination || { total: 0, page: 1, limit: 50, pages: 0 });

function loadPage(page: number) {
  currentPage.value = page;
}

// Role options
const roleOptions = ["Admin", "Teamlead", "Agent"];

// Edit modal state
const showEditModal = ref(false);
const editingUser = ref<User | null>(null);
const newRole = ref("");
const isUpdating = ref(false);
const updateError = ref("");

// Delete confirmation
const showDeleteConfirm = ref(false);
const userToDelete = ref<User | null>(null);
const isDeleting = ref(false);

function openEditModal(user: User) {
  editingUser.value = user;
  newRole.value = user.role;
  showEditModal.value = true;
  updateError.value = "";
}

function closeEditModal() {
  showEditModal.value = false;
  editingUser.value = null;
  newRole.value = "";
}

async function updateUserRole() {
  if (!editingUser.value) return;
  
  isUpdating.value = true;
  updateError.value = "";
  
  try {
    await $fetch(`/api/admin/users/${editingUser.value.id}`, {
      method: "PATCH",
      body: { role: newRole.value },
    });
    await refresh();
    closeEditModal();
  } catch (e: any) {
    updateError.value = e.data?.message || "Fehler beim Aktualisieren";
  } finally {
    isUpdating.value = false;
  }
}

function confirmDelete(user: User) {
  userToDelete.value = user;
  showDeleteConfirm.value = true;
}

async function deleteUser() {
  if (!userToDelete.value) return;
  
  isDeleting.value = true;
  
  try {
    await $fetch(`/api/admin/users/${userToDelete.value.id}`, {
      method: "DELETE",
    });
    await refresh();
    showDeleteConfirm.value = false;
    userToDelete.value = null;
  } catch (e: any) {
    console.error("Delete failed:", e);
  } finally {
    isDeleting.value = false;
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getRoleBadgeClass(role: string) {
  switch (role) {
    case "Admin":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "Teamlead":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Benutzerverwaltung
      </h1>
      <p class="mt-1 text-gray-600 dark:text-gray-400">
        Verwalten Sie alle registrierten Benutzer und deren Rollen
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Users Table -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Benutzer
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Rolle
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Registriert
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              E-Mail bestätigt
            </th>
            <th class="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span class="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {{ user.name.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ user.name }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ user.email }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span 
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  getRoleBadgeClass(user.role)
                ]"
              >
                {{ user.role }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(user.createdAt) }}
            </td>
            <td class="px-6 py-4">
              <span 
                :class="[
                  'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                  user.emailVerified 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                ]"
              >
                {{ user.emailVerified ? 'Ja' : 'Nein' }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="openEditModal(user)"
                  class="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition"
                  title="Rolle bearbeiten"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="confirmDelete(user)"
                  class="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition"
                  title="Benutzer löschen"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="users && users.length === 0" class="py-12 text-center">
        <p class="text-gray-500 dark:text-gray-400">Keine Benutzer gefunden</p>
      </div>
    </div>

    <!-- Pagination -->
    <Pagination
      v-if="pagination.pages > 1"
      :current-page="currentPage"
      :total-pages="pagination.pages"
      :total="pagination.total"
      @page-change="loadPage"
      class="mt-4"
    />

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="closeEditModal"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Rolle bearbeiten
          </h3>
          
          <div v-if="editingUser" class="space-y-4">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Benutzer</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ editingUser.name }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ editingUser.email }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Neue Rolle
              </label>
              <select
                v-model="newRole"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option v-for="role in roleOptions" :key="role" :value="role">
                  {{ role }}
                </option>
              </select>
            </div>
            
            <div v-if="updateError" class="text-sm text-red-600 dark:text-red-400">
              {{ updateError }}
            </div>
            
            <div class="flex justify-end gap-3 pt-4">
              <button
                @click="closeEditModal"
                class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Abbrechen
              </button>
              <button
                @click="updateUserRole"
                :disabled="isUpdating"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition"
              >
                {{ isUpdating ? 'Speichern...' : 'Speichern' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="showDeleteConfirm = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Benutzer löschen?
          </h3>
          
          <p v-if="userToDelete" class="text-gray-600 dark:text-gray-400 mb-6">
            Möchten Sie den Benutzer <strong>{{ userToDelete.name }}</strong> ({{ userToDelete.email }}) wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          
          <div class="flex justify-end gap-3">
            <button
              @click="showDeleteConfirm = false"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              Abbrechen
            </button>
            <button
              @click="deleteUser"
              :disabled="isDeleting"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition"
            >
              {{ isDeleting ? 'Löschen...' : 'Löschen' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
