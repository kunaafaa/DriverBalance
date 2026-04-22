import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRateLimit, sanitizeBody, log, secureJson } from "@/lib/utils/api-security";

const ALLOWED_CUSTOMER_FIELDS = [
  "name", "email", "phone", "address", "city", "postal_code", "notes",
];

export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
  const search = searchParams.get("search") || "";
  const offset = (page - 1) * limit;

  let query = supabase.from("customers").select("*", { count: "exact" });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    log("ERROR", "Failed to fetch customers", request, { error: error.message });
    return secureJson({ error: "Failed to fetch customers" }, 400);
  }

  return secureJson({
    data,
    pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
  });
}

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "write");
  if (limited) return limited;

  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const supabase = createClient();
  const rawBody = await request.json();

  // Mass-assignment protection: only allow known fields
  const body = sanitizeBody(rawBody, ALLOWED_CUSTOMER_FIELDS);

  if (!body.name || !body.phone) {
    return secureJson({ error: "Name and phone are required." }, 422);
  }

  const { data, error } = await supabase.from("customers").insert([body]).select();

  if (error) {
    log("ERROR", "Failed to create customer", request, { error: error.message });
    return secureJson({ error: "Failed to create customer" }, 400);
  }

  log("INFO", `Customer created: ${data[0].id}`, request);
  return secureJson(data[0], 201);
}
