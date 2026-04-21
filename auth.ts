import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// ---------------------------------------------------------------------------
// Rate Limiter — blocks IPs with >5 failed attempts in a 15-min window
// ---------------------------------------------------------------------------
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    // Reset window
    loginAttempts.set(identifier, { count: 1, firstAttempt: now });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return true; // Locked out
  }

  record.count += 1;
  return false;
}

function recordSuccessfulLogin(identifier: string) {
  loginAttempts.delete(identifier); // Clear on success
}

// ---------------------------------------------------------------------------
// Timing-safe password verification (Runtime Agnostic)
// Compares SHA-256 hash of submitted password against stored hash in env.
// Uses Web Crypto API to ensure compatibility with Edge runtimes.
// ---------------------------------------------------------------------------
async function verifyPassword(submitted: string, storedHash: string): Promise<boolean> {
  try {
    // 1. Hash the submitted password using Web Crypto (available in Node.js & Edge)
    const encoder = new TextEncoder();
    const data = encoder.encode(submitted);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    
    // Convert Buffer to Hex String
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const submittedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 2. Constant-time comparison (prevents timing attacks)
    // We compare every character even if we find a mismatch early.
    if (submittedHash.length !== storedHash.length) return false;
    
    let result = 0;
    for (let i = 0; i < submittedHash.length; i++) {
      result |= submittedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
    }
    return result === 0;
  } catch (err) {
    console.error("[AUTH] Verification Error:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// NextAuth Configuration
// ---------------------------------------------------------------------------
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        // Pass client IP via hidden field from the login form for rate limiting
        clientIp: { label: "Client IP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);
        const clientIp = String(credentials.clientIp || email); // Fallback to email as identifier

        // 1. Rate limit check
        if (isRateLimited(clientIp)) {
          console.warn(`[AUTH] Rate limit exceeded for: ${clientIp}`);
          // Throw a specific error message NextAuth will pass through
          throw new Error("TOO_MANY_ATTEMPTS");
        }

        // 2. Email whitelist check (case-insensitive)
        const allowedEmails = (process.env.CRM_ALLOWED_EMAILS || "")
          .split(",")
          .map((e) => e.trim().toLowerCase());

        if (!allowedEmails.includes(email)) {
          console.warn(`[AUTH] Unknown email attempted: ${email}`);
          return null;
        }

        // 3. Password verification (timing-safe SHA256 hash comparison)
        // CRM_PASSWORD_HASH must be the SHA256 hex digest of the master password
        const storedHash = process.env.CRM_PASSWORD_HASH || "";
        const passwordValid = verifyPassword(password, storedHash);

        if (!passwordValid) {
          console.warn(`[AUTH] Invalid password for: ${email}`);
          return null;
        }

        // 4. Success — clear rate limit record
        recordSuccessfulLogin(clientIp);
        console.info(`[AUTH] Successful login: ${email}`);

        return {
          id: email,
          email,
          name: email.split("@")[0],
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login", // Redirect auth errors back to login (not a separate /error page)
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours — expires at end of a working day
    updateAge: 60 * 60, // Refresh token every 1 hour of activity
  },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname === "/login";
      const isAuthApi = nextUrl.pathname.startsWith("/api/auth");
      
      if (isAuthApi) return true; // Never intercept auth API calls in middleware logic

      if (!isLoggedIn && !isLoginPage) {
        return false; // Redirect to login
      }

      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
});
