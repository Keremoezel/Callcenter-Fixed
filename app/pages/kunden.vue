<template>
  <div class="min-h-screen bg-white">
    <!-- Main Container -->
    <div class="flex h-screen">
      <!-- MASTER SECTION - Assigned customers (left column) - componentized -->
      <CustomerList
        :customers="customers"
        :selected-customer="selectedCustomer"
        @select="selectCustomer"
        @import="handleImport"
      />

      <!-- DETAIL SECTION - Selected customer (right column) -->
      <CustomerDetail
        :selected-customer="selectedCustomer"
        :conversation-hook="conversationHook"
        :research-result="researchResult"
        :has-unsaved-changes="hasUnsavedChanges"
        :is-saving="isSaving"
        :get-contact-count="getContactCount"
        :start-call="startCall"
        :send-email="sendEmail"
        :call-contact="callContact"
        :email-contact="emailContact"
        :save-changes="saveChanges"
        :reset-changes="resetChanges"
        @updateConversation="updateConversation"
        @updateResearch="updateResearch"
        @refresh="handleRefresh"
      />
    </div>
  </div>
</template>

<script setup>
import CustomerList from "~/components/customer/CustomerList.vue";
import CustomerDetail from "~/components/customer/CustomerDetail.vue";
import { useCustomers } from "~/composables/customers/useCustomers";
import { useCustomerNotes } from "~/composables/forms/useCustomerNotes";

// Customer data – managed via composable
const {
  customers,
  selectedCustomer,
  selectCustomer,
  getContactCount,
  error,
  status,
  refresh,
} = useCustomers();

// Handle data refresh (e.g. after edit)
const handleRefresh = async () => {
  await refresh();
  // Update selected customer with fresh data
  if (selectedCustomer.value && customers.value) {
    const updated = customers.value.find(c => c.id === selectedCustomer.value.id);
    if (updated) {
      selectedCustomer.value = updated;
    }
  }
};

// Unsaved changes – composable
const {
  conversationHook,
  researchResult,
  hasUnsavedChanges,
  isSaving,
  trackChanges,
  saveChanges,
  resetChanges,
} = useCustomerNotes(selectedCustomer, {
  onSave: handleRefresh
});

// Start call
const startCall = () => {
  console.log("Anruf gestartet für:", selectedCustomer.value.companyName);
  // TODO: Implement call functionality
};

// Call specific contact
const callContact = (contact) => {
  console.log("Anruf gestartet für Kontakt:", contact);
  // TODO: Implement contact-specific call functionality
};

// Send email to company
const sendEmail = () => {
  console.log("Email senden an:", selectedCustomer.value.email);
  // TODO: Implement email functionality
};

// Email specific contact
const emailContact = (contact) => {
  console.log("Email senden an Kontakt:", contact);
  // TODO: Implement contact-specific email functionality
};

// Update handlers
const updateConversation = (v) => {
  conversationHook.value = v;
  trackChanges();
};

const updateResearch = (v) => {
  researchResult.value = v;
  trackChanges();
};

// Handle Excel Import
const handleImport = async (data) => {
  console.log("Importing data:", data);
  
  if (!data || data.length === 0) {
    alert("Die importierte Datei ist leer.");
    return;
  }

  try {
    const { error } = await useFetch('/api/customers/import', {
      method: 'POST',
      body: { customers: data }
    });

    if (error.value) {
      console.error("Import error:", error.value);
      alert("Fehler beim Importieren der Kunden: " + error.value.message);
    } else {
      alert(`${data.length} Kunden erfolgreich importiert!`);
      window.location.reload(); 
    }
  } catch (err) {
    console.error("Unexpected error during import:", err);
    alert("Ein unerwarteter Fehler ist aufgetreten.");
  }
};

// Page leave warning is handled inside the composable
</script>
