import { authClient } from "~/lib/auth-client";

// Define user type with role
interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  role?: string;
}

/**
 * Authentication Composable
 * Provides reactive auth state and methods for the entire app
 */
export function useAuth() {
  const session = authClient.useSession();
  const router = useRouter();

  // Computed properties for easy access
  const isAuthenticated = computed(() => !!session.value?.data?.user);
  const user = computed(() => session.value?.data?.user as AuthUser | undefined);
  const isLoading = computed(() => session.value?.isPending ?? false);

  /**
   * Sign in with email and password
   */
  async function signIn(email: string, password: string) {
    const result = await authClient.signIn.email({
      email,
      password,
    });

    if (result.error) {
      throw new Error(result.error.message || "Anmeldung fehlgeschlagen");
    }

    return result.data;
  }

  /**
   * Sign up with email, password, and name
   */
  async function signUp(email: string, password: string, name: string) {
    const result = await authClient.signUp.email({
      email,
      password,
      name,
    });

    if (result.error) {
      throw new Error(result.error.message || "Registrierung fehlgeschlagen");
    }

    return result.data;
  }

  /**
   * Sign out and redirect to login
   */
  async function signOut() {
    await authClient.signOut();
    router.push("/login");
  }

  /**
   * Check if user has a specific role
   */
  function hasRole(requiredRole: string | string[]): boolean {
    const userRole = user.value?.role;
    if (!userRole) return false;

    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole);
    }
    return userRole === requiredRole;
  }

  return {
    // State
    session,
    user,
    isAuthenticated,
    isLoading,

    // Actions
    signIn,
    signUp,
    signOut,
    hasRole,
  };
}
