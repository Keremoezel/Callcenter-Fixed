import { authClient } from "~/lib/auth-client";

/**
 * Auth Middleware
 * Protects routes that require authentication
 * Redirects unauthenticated users to login page
 */
export default defineNuxtRouteMiddleware(async (to) => {
    // Skip auth check for public routes
    const publicRoutes = ["/login", "/register"];
    if (publicRoutes.includes(to.path)) {
        return;
    }

    // Check session using Better Auth client
    const { data: session } = await authClient.useSession(useFetch);

    // Redirect to login if not authenticated
    if (!session.value?.user) {
        return navigateTo("/login");
    }
});
