import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Since we use NextAuth for authentication, we don't need Supabase Auth cookies.
// We use the Service Role Key here to bypass RLS, because our API routes
// are already secured by NextAuth session checks.
export const createClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};
