import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { H3Event } from "h3";
import { useDrizzle } from "../utils/drizzle";
import * as schema from "../database/schema";

/**
 * Create Better Auth instance for server-side authentication
 * This function creates the auth instance with the D1 database connection
 */
export function createAuth(event: H3Event) {
    const db = useDrizzle(event);

    // Get secret from Cloudflare environment
    // Get secret from Cloudflare environment OR local process.env
    const env = event.context.cloudflare?.env as { BETTER_AUTH_SECRET?: string; BETTER_AUTH_URL?: string } | undefined;
    const secret = env?.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET;
    const baseURL = env?.BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

    if (!secret) {
        throw new Error("BETTER_AUTH_SECRET is not configured. Add it to .dev.vars for local dev or as a Cloudflare secret for production.");
    }

    return betterAuth({
        secret,
        baseURL,
        database: drizzleAdapter(db, {
            provider: "sqlite",
            schema: {
                user: schema.users,
                session: schema.sessions,
                account: schema.account,
                verification: schema.verification,
            },
        }),
        emailAndPassword: {
            enabled: true,
        },
        user: {
            additionalFields: {
                role: {
                    type: "string",
                    required: false,
                    defaultValue: "Agent",
                },
            },
        },
        trustedOrigins: [
            "http://localhost:3000",
            "http://localhost:8787",
            "http://127.0.0.1:8787",
        ],
    });
}

export type Auth = ReturnType<typeof createAuth>;

