import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { requireAuth, checkRateLimit, sanitizeBody, log, secureJson } from "@/lib/utils/api-security";

const ALLOWED_CUSTOMER_FIELDS = [
  "name", "email", "phone", "address", "city", "postal_code", "notes",
] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { id } = await params;
  if (!id) return secureJson({ error: "Missing ID" }, 400);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*, vehicles(*)")
    .eq("id", id)
    .single();

  if (error) {
    log("WARN", `Customer not found: ${id}`, request);
    return secureJson({ error: "Customer not found" }, 404);
  }

  return secureJson(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = checkRateLimit(request, "write");
  if (limited) return limited;

  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { id } = await params;
  if (!id) return secureJson({ error: "Missing ID" }, 400);

  const supabase = createClient();
  const rawBody = await request.json();

  // Mass-assignment protection
  const body = sanitizeBody(rawBody, ALLOWED_CUSTOMER_FIELDS);

  const { data, error } = await supabase
    .from("customers")
    .update(body)
    .eq("id", id)
    .select();

  if (error) {
    log("ERROR", `Failed to update customer: ${id}`, request, { error: error.message });
    return secureJson({ error: "Failed to update customer" }, 400);
  }

  if (!data || data.length === 0) {
    return secureJson({ error: "Customer not found" }, 404);
  }

  log("INFO", `Customer updated: ${id}`, request);
  return secureJson(data[0]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = checkRateLimit(request, "write");
  if (limited) return limited;

  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { id } = await params;
  if (!id) return secureJson({ error: "Missing ID" }, 400);

  const supabase = createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);

  if (error) {
    log("ERROR", `Failed to delete customer: ${id}`, request, { error: error.message });
    return secureJson({ error: "Failed to delete customer" }, 400);
  }

  log("INFO", `Customer deleted: ${id}`, request);
  return secureJson({ success: true });
}
