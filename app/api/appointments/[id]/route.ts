import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { requireAuth, checkRateLimit, sanitizeBody, log, secureJson } from "@/lib/utils/api-security";

const ALLOWED_APPOINTMENT_FIELDS = [
  "customer_id", "vehicle_id", "scheduled_date",
  "estimated_duration_minutes", "status", "notes",
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
    .from("appointments")
    .select("*, customers(*), vehicles(*), appointment_services(*, service_types(*))")
    .eq("id", id)
    .single();

  if (error) {
    log("WARN", `Appointment not found: ${id}`, request);
    return secureJson({ error: "Appointment not found" }, 404);
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
  const body = sanitizeBody(rawBody, ALLOWED_APPOINTMENT_FIELDS);

  if ("estimated_duration_minutes" in body) {
    body.estimated_duration_minutes = Math.max(1, Number(body.estimated_duration_minutes) || 60);
  }

  const { data, error } = await supabase
    .from("appointments")
    .update(body)
    .eq("id", id)
    .select();

  if (error) {
    log("ERROR", `Failed to update appointment: ${id}`, request, { error: error.message });
    return secureJson({ error: "Failed to update appointment" }, 400);
  }

  if (!data || data.length === 0) {
    return secureJson({ error: "Appointment not found" }, 404);
  }

  log("INFO", `Appointment updated: ${id}`, request);
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
  const { error } = await supabase.from("appointments").delete().eq("id", id);

  if (error) {
    log("ERROR", `Failed to delete appointment: ${id}`, request, { error: error.message });
    return secureJson({ error: "Failed to delete appointment" }, 400);
  }

  log("INFO", `Appointment deleted: ${id}`, request);
  return secureJson({ success: true });
}
