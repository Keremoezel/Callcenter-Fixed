import { useAuth } from "~/composables/auth/useAuth";

/**
 * Admin-only middleware
 * Redirects non-admin users to home page
 */
export default defineNuxtRouteMiddleware(async () => {
    const { user, isAuthenticated } = useAuth();

    // Wait for auth to load
    if (!isAuthenticated.value) {
        return navigateTo("/login");
    }

    // Check if user is admin OR teamlead
    if (user.value?.role !== "Admin" && user.value?.role !== "Teamlead") {
        return navigateTo("/");
    }
});
