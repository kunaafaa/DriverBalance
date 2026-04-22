"use server";

/**
 * Server Action: Validates credentials independently of NextAuth.
 * 
 * This exists because NextAuth v5 beta has a known issue where the
 * Credentials provider's authorize() function doesn't reliably propagate
 * failures back to the client-side signIn() call. By validating credentials
 * in a server action FIRST, we guarantee the login form never proceeds
 * unless the email + password are correct.
 */

// ---------------------------------------------------------------------------
// Rate Limiter (mirrors auth.ts but for the server action)
// ---------------------------------------------------------------------------
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(identifier, { count: 1, firstAttempt: now });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }

  record.count += 1;
  return false;
}

// ---------------------------------------------------------------------------
// Server Action
// ---------------------------------------------------------------------------
export async function validateCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  // 0. Basic validation
  if (!email || !password) {
    return { success: false, error: "INVALID_CREDENTIALS" };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Rate limit
  if (isRateLimited(normalizedEmail)) {
    return { success: false, error: "TOO_MANY_ATTEMPTS" };
  }

  // 2. Email whitelist
  const allowedEmails = (process.env.CRM_ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());

  if (!allowedEmails.includes(normalizedEmail)) {
    console.warn(`[AUTH-ACTION] Unknown email: ${normalizedEmail}`);
    return { success: false, error: "INVALID_CREDENTIALS" };
  }

  // 3. Password hash verification
  const storedHash = (process.env.CRM_PASSWORD_HASH || "").trim();

  if (!storedHash) {
    console.error("[AUTH-ACTION] CRM_PASSWORD_HASH is not configured!");
    return { success: false, error: "INVALID_CREDENTIALS" };
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const submittedHash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison
    if (submittedHash.length !== storedHash.length) {
      console.warn(`[AUTH-ACTION] Hash length mismatch for: ${normalizedEmail}`);
      return { success: false, error: "INVALID_CREDENTIALS" };
    }

    let result = 0;
    for (let i = 0; i < submittedHash.length; i++) {
      result |= submittedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
    }

    if (result !== 0) {
      console.warn(`[AUTH-ACTION] Invalid password for: ${normalizedEmail}`);
      return { success: false, error: "INVALID_CREDENTIALS" };
    }

    console.info(`[AUTH-ACTION] Credentials verified for: ${normalizedEmail}`);
    return { success: true };
  } catch (err) {
    console.error("[AUTH-ACTION] Verification error:", err);
    return { success: false, error: "INVALID_CREDENTIALS" };
  }
}
