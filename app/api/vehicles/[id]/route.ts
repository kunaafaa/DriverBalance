import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { requireAuth, checkRateLimit, sanitizeBody, log, secureJson } from "@/lib/utils/api-security";

const ALLOWED_VEHICLE_FIELDS = [
  "customer_id", "make", "model", "year", "license_plate",
  "vin", "color", "mileage", "notes",
];

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
    .from("vehicles")
    .select("*, customers(*), service_history(*)")
    .eq("id", id)
    .single();

  if (error) {
    log("WARN", `Vehicle not found: ${id}`, request);
    return secureJson({ error: "Vehicle not found" }, 404);
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
  const body = sanitizeBody(rawBody, ALLOWED_VEHICLE_FIELDS);

  // Year and mileage must be reasonable numbers
  if ("year" in body) {
    const year = Number(body.year);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 2) {
      return secureJson({ error: "Invalid vehicle year." }, 422);
    }
    body.year = year;
  }
  if ("mileage" in body) {
    body.mileage = Math.max(0, Number(body.mileage) || 0);
  }

  const { data, error } = await supabase
    .from("vehicles")
    .update(body)
    .eq("id", id)
    .select();

  if (error) {
    log("ERROR", `Failed to update vehicle: ${id}`, request, { error: error.message });
    return secureJson({ error: "Failed to update vehicle" }, 400);
  }

  if (!data || data.length === 0) {
    return secureJson({ error: "Vehicle not found" }, 404);
  }

  log("INFO", `Vehicle updated: ${id}`, request);
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
  const { error } = await supabase.from("vehicles").delete().eq("id", id);

  if (error) {
    log("ERROR", `Failed to delete vehicle: ${id}`, request, { error: error.message });
    return secureJson({ error: "Failed to delete vehicle" }, 400);
  }

  log("INFO", `Vehicle deleted: ${id}`, request);
  return secureJson({ success: true });
}
