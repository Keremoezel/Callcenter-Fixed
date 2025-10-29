import { ref, watch, onBeforeUnmount } from 'vue'

export function useUnsavedChanges(selectedCustomer: any) {
  const conversationHook = ref('')
  const researchResult = ref('')
  const hasUnsavedChanges = ref(false)
  const isSaving = ref(false)

  // Watch selected customer changes and update form
  watch(selectedCustomer, (newCustomer) => {
    if (newCustomer) {
      conversationHook.value = newCustomer.conversationHook || ''
      researchResult.value = newCustomer.researchResult || ''
      hasUnsavedChanges.value = false
    }
  }, { immediate: true })

  // Track changes
  const trackChanges = () => {
    hasUnsavedChanges.value = true
  }

  // Save changes (placeholder - implement later with API)
  const saveChanges = async () => {
    isSaving.value = true

    try {
      // TODO: Implement actual API call when backend is ready
      // await updateCustomer(selectedCustomer.value.id, {
      //   conversationHook: conversationHook.value,
      //   researchResult: researchResult.value,
      // })

      console.log('Saving changes...')
      console.log('Conversation Hook:', conversationHook.value)
      console.log('Research Result:', researchResult.value)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      hasUnsavedChanges.value = false
      console.log('✅ Changes saved successfully!')
    } catch (error) {
      console.error('❌ Error saving changes:', error)
    } finally {
      isSaving.value = false
    }
  }

  // Reset changes
  const resetChanges = () => {
    conversationHook.value = selectedCustomer.value?.conversationHook || ''
    researchResult.value = selectedCustomer.value?.researchResult || ''
    hasUnsavedChanges.value = false
  }

  // ⚠️ BROWSER REFRESH WARNING (Almanca)
  // Prevent page refresh/close if there are unsaved changes
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (hasUnsavedChanges.value) {
      event.preventDefault()
      // Modern browsers show a generic message, but we can set the text
      const message = 'Sie haben ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?'
      event.returnValue = message
      return message
    }
  }

  // Add event listener when component mounts
  if (process.client) {
    window.addEventListener('beforeunload', handleBeforeUnload)
  }

  // Remove event listener when component unmounts
  onBeforeUnmount(() => {
    if (process.client) {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
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
