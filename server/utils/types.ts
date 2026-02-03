/**
 * Type utilities for CRM application
 * Provides proper typing for session users and common patterns
 */

/**
 * User roles in the CRM application
 */
export type UserRole = "Admin" | "Teamlead" | "Agent";

/**
 * Extended user type that includes the role field
 * Use this when accessing session.user to get proper typing
 */
export interface CrmUser {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role: UserRole;
}

/**
 * Type guard to check if a user has a specific role
 */
export function hasRole(user: unknown, role: UserRole): boolean {
    if (!user || typeof user !== "object") return false;
    return (user as CrmUser).role === role;
}

/**
 * Type guard to check if a user is an Admin
 */
export function isAdmin(user: unknown): boolean {
    return hasRole(user, "Admin");
}

/**
 * Type guard to check if a user is an Admin or Teamlead
 */
export function isAdminOrTeamlead(user: unknown): boolean {
    return hasRole(user, "Admin") || hasRole(user, "Teamlead");
}

/**
 * Safely get the user role from a session user
 * Returns undefined if user is not a valid CrmUser
 */
export function getUserRole(user: unknown): UserRole | undefined {
    if (!user || typeof user !== "object") return undefined;
    const role = (user as CrmUser).role;
    if (role === "Admin" || role === "Teamlead" || role === "Agent") {
        return role;
    }
    return undefined;
}

/**
 * Cast a session user to CrmUser type
 * Use this when you need the full typed user object
 */
export function asCrmUser(user: unknown): CrmUser {
    return user as CrmUser;
}
