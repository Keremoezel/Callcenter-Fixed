
import { createClient } from "@libsql/client";

async function main() {
    const client = createClient({
        url: "file:local-dev.db",
    });

    const email = "keremsinan1905@gmail.com";
    const name = "Kerem Sinan";
    const role = "Admin";
    const now = new Date().toISOString();

    // Check if user exists
    const result = await client.execute({
        sql: "SELECT * FROM user WHERE email = ?",
        args: [email]
    });

    if (result.rows.length > 0) {
        console.log(`User ${email} found. Updating role to Admin...`);
        await client.execute({
            sql: "UPDATE user SET role = ?, name = ? WHERE email = ?",
            args: [role, name, email]
        });
    } else {
        console.log(`User ${email} not found. Creating new Admin user...`);
        const id = crypto.randomUUID();
        await client.execute({
            sql: "INSERT INTO user (id, name, email, email_verified, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [id, name, email, 1, role, now, now]
        });
        // Password cannot be set easily here as it needs hashing by Better Auth
        // The user will need to use "Forgot Password" or we should recommend them to register if login fails.
        // BUT since we are inserting directly, if they haven't registered, they can't login with password.
        // SO, creating a raw user row might be "bad" if they don't have a specific password_hash.

        // BETTER APPROACH:
        // If user doesn't exist, we print a message saying "Please register via UI first, then run this script again or I will auto-promote on register".
        // OR we can just insert it.

        // NOTE: For local dev convenience, usually we just want to UPDATE existing or create placeholder.
        // I will assume they might want to register.
        console.log("NOTE: If you haven't registered this user yet, you won't be able to login with password.");
        console.log("Recommend registering via the UI first!");
    }

    // Verify
    const verify = await client.execute({
        sql: "SELECT id, name, email, role FROM user WHERE email = ?",
        args: [email]
    });
    console.log("User status:", verify.rows[0]);
}

main().catch(console.error);
