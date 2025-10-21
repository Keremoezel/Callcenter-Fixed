<template>
  <div class="min-h-screen bg-white">
    <!-- Main Container -->
    <div class="flex h-screen">
      <!-- MASTER SECTION - Assigned customers (left column) - componentized -->
      <CustomerList
        :customers="customers"
        :selected-customer="selectedCustomer"
        @select="selectCustomer"
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
        @updateConversation="
          (v) => {
            conversationHook.value = v;
            trackChanges();
          }
        "
        @updateResearch="
          (v) => {
            researchResult.value = v;
            trackChanges();
          }
        "
      />
    </div>
  </div>
</template>

<script setup>
import CustomerList from "~/components/customer/CustomerList.vue";
import CustomerDetail from "~/components/customer/CustomerDetail.vue";
import { useCustomers } from "~/composables/customers/useCustomers";
import { useUnsavedChanges } from "~/composables/forms/useUnsavedChanges";

// Customer data – managed via composable
const {
  customers,
  selectedCustomer,
  selectCustomer,
  getContactCount,
  error,
  status,
} = useCustomers();

// Unsaved changes – composable
const {
  conversationHook,
  researchResult,
  hasUnsavedChanges,
  isSaving,
  trackChanges,
  saveChanges,
  resetChanges,
} = useUnsavedChanges(selectedCustomer);

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

// Page leave warning is handled inside the composable
</script>
