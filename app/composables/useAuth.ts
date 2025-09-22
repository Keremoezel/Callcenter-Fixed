export const useAuth = () => {

    const user = ref({
      name: 'Admin User',
      role: 'Admin',
      email: 'admin@example.com'
    })
  
    const hasRole = (role: string) => {
      return user.value?.role === role || user.value?.role === 'Admin'
    }
  
    const logIn = async (credentials: any) => {
      return true
    }
  
    const logOut = () => {
      user.value = null as any
    }
  
    return {
      user: readonly(user),
      hasRole,
      logIn,
      logOut
    }
  }