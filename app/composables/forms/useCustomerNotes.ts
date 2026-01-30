import { ref, watch } from 'vue'
import { useUnsavedChanges } from './useUnsavedChanges'

// Für Formulare: Nutzung ungespeicherter Änderungen (unsaved changes).

export function useCustomerNotes(selectedCustomer: any, options: { onSave?: () => void } = {}) {
  const conversationHook = ref('')
  const researchResult = ref('')
  const isSaving = ref(false)

  // Use generic unsaved changes logic
  const { hasUnsavedChanges, trackChanges, resetDirty } = useUnsavedChanges()

  // Watch selected customer changes and update form
  watch(selectedCustomer, (newCustomer) => {
    if (newCustomer) {
      conversationHook.value = newCustomer.conversationHook || ''
      researchResult.value = newCustomer.researchResult || ''
      resetDirty()
    }
  }, { immediate: true })

  // Save changes
  const saveChanges = async () => {
    if (!selectedCustomer.value?.id) return

    isSaving.value = true

    try {
      await $fetch(`/api/customers/${selectedCustomer.value.id}/notes`, {
        method: 'PUT',
        body: {
          conversationHook: conversationHook.value,
          researchResult: researchResult.value,
        }
      })

      resetDirty()
      console.log('✅ Changes saved successfully!')

      // Call onSave callback if provided
      if (options.onSave) {
        options.onSave()
      }
    } catch (error) {
      console.error('❌ Error saving changes:', error)
      alert('Fehler beim Speichern der Notizen.')
    } finally {
      isSaving.value = false
    }
  }

  // Reset changes
  const resetChanges = () => {
    conversationHook.value = selectedCustomer.value?.conversationHook || ''
    researchResult.value = selectedCustomer.value?.researchResult || ''
    resetDirty()
  }

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
