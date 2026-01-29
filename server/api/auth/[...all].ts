import { createAuth } from "../../lib/auth";

/**
 * Better Auth API Handler
 * Handles all auth routes: /api/auth/*
 * - POST /api/auth/sign-up/email
 * - POST /api/auth/sign-in/email
 * - GET /api/auth/session
 * - POST /api/auth/sign-out
 */
export default defineEventHandler(async (event) => {
    const auth = createAuth(event);
    return auth.handler(toWebRequest(event));
});
