import { createAuthClient } from "better-auth/vue";

/**
 * Better Auth Vue Client
 * Provides reactive authentication state and methods
 */
export const authClient = createAuthClient({
    // Better Auth will automatically use the current origin
    // baseURL is only needed if the auth API is on a different domain
});

// Export typed hooks for Vue components
export const {
    useSession,
    signIn,
    signUp,
    signOut,
} = authClient;
