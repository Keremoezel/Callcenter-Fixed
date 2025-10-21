import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue'
import type { Customer } from '../customers/useCustomers'

export function useUnsavedChanges(selectedCustomer: Ref<Customer | null>) {
  const conversationHook = ref('')
  const researchResult = ref('')

  const hasUnsavedChanges = ref(false)
  const originalConversationHook = ref('')
  const originalResearchResult = ref('')
  const isSaving = ref(false)

  const initializeOriginalValues = () => {
    originalConversationHook.value = conversationHook.value
    originalResearchResult.value = researchResult.value
    hasUnsavedChanges.value = false
  }

  const trackChanges = () => {
    hasUnsavedChanges.value =
      conversationHook.value !== originalConversationHook.value ||
      researchResult.value !== originalResearchResult.value
  }

  watch(selectedCustomer, (cust) => {
    if (!cust) return
    conversationHook.value = cust.conversationHook || ''
    researchResult.value = cust.researchResult || ''
    initializeOriginalValues()
  })

  const saveChanges = async () => {
    isSaving.value = true
    try {
      await new Promise((r) => setTimeout(r, 1500))
      originalConversationHook.value = conversationHook.value
      originalResearchResult.value = researchResult.value
      hasUnsavedChanges.value = false

      if (selectedCustomer.value) {
        selectedCustomer.value.conversationHook = conversationHook.value
        selectedCustomer.value.researchResult = researchResult.value
      }
    } finally {
      isSaving.value = false
    }
  }

  const resetChanges = () => {
    conversationHook.value = originalConversationHook.value
    researchResult.value = originalResearchResult.value
    hasUnsavedChanges.value = false
  }

  const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges.value) {
      e.preventDefault()
      e.returnValue = 'Sie haben ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?'
      return e.returnValue
    }
  }

  onMounted(() => {
    window.addEventListener('beforeunload', beforeUnloadHandler)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeunload', beforeUnloadHandler)
  })

  return {
    conversationHook,
    researchResult,
    hasUnsavedChanges,
    isSaving,
    trackChanges,
    saveChanges,
    resetChanges,
  }
}


