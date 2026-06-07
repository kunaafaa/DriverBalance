import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { requireAuth, checkRateLimit, sanitizeBody, log, secureJson } from "@/lib/utils/api-security";

const ALLOWED_REPORT_FIELDS = [
  "customer_id", "vehicle_id", "lead_engineer", "platform", "status",
  "reported_symptom", "occurs_when", "prior_workshops", "brief",
  "fault_codes", "measurements", "root_cause", "required_parts",
  "labour_hours", "labour_cost",
  "advisory_notes", "before_fuel_trim", "after_fuel_trim",
  "verification_status", "diagnostic_fee", "notes",
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
    .from("diagnostic_reports")
    .select("*, customers(*), vehicles(*)")
    .eq("id", id)
    .single();

  if (error) {
    log("WARN", `Diagnostic report not found: ${id}`, request);
    return secureJson({ error: "Diagnostic report not found" }, 404);
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

  // Mass-assignment protection — only update known fields
  const reportData = sanitizeBody(rawBody, ALLOWED_REPORT_FIELDS);

  // Numeric coercion to prevent type injection
  if ("diagnostic_fee" in reportData) reportData.diagnostic_fee = Number(reportData.diagnostic_fee) || 0;
  if ("labour_hours" in reportData) reportData.labour_hours = Number(reportData.labour_hours) || 0;
  if ("labour_cost" in reportData) reportData.labour_cost = Number(reportData.labour_cost) || 0;

  const { data, error } = await supabase
    .from("diagnostic_reports")
    .update(reportData)
    .eq("id", id)
    .select();

  if (error) {
    log("ERROR", `Failed to update diagnostic report: ${id}`, request, { error: error.message });
    return secureJson({ error: "Failed to update diagnostic report" }, 400);
  }

  if (!data || data.length === 0) {
    return secureJson({ error: "Diagnostic report not found" }, 404);
  }

  log("INFO", `Diagnostic report updated: ${id}`, request);
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
  const { error } = await supabase.from("diagnostic_reports").delete().eq("id", id);

  if (error) {
    log("ERROR", `Failed to delete diagnostic report: ${id}`, request, { error: error.message });
    return secureJson({ error: "Failed to delete diagnostic report" }, 400);
  }

  log("INFO", `Diagnostic report deleted: ${id}`, request);
  return secureJson({ success: true });
}
