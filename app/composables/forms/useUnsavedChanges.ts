import { ref, onBeforeUnmount } from 'vue'

/**
 * Generic composable for managing unsaved changes state and browser warnings.
 * Can be used by any form or component.
 */
export function useUnsavedChanges() {
    const hasUnsavedChanges = ref(false)

    // Mark state as dirty
    const trackChanges = () => {
        hasUnsavedChanges.value = true
    }

    // Reset dirty state
    const resetDirty = () => {
        hasUnsavedChanges.value = false
    }

    // Prevent page refresh/close if there are unsaved changes
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        if (hasUnsavedChanges.value) {
            event.preventDefault()
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
        hasUnsavedChanges,
        trackChanges,
        resetDirty
    }
}
