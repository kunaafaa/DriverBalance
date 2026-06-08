import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { requireAuth, checkRateLimit, log, secureJson } from "@/lib/utils/api-security";

const RESULT_LIMIT = 5;

const EMPTY_RESULTS = { customers: [], vehicles: [], invoices: [], reports: [] };

export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    return secureJson(EMPTY_RESULTS);
  }

  const supabase = createClient();
  const term = `%${q}%`;

  // Resolve matching customers first — invoices/reports are also searchable by customer name
  const { data: matchedCustomers, error: customersError } = await supabase
    .from("customers")
    .select("id, name, phone")
    .or(`name.ilike.${term},phone.ilike.${term}`)
    .limit(RESULT_LIMIT);

  const customerIds = (matchedCustomers ?? []).map((c) => c.id);
  const customerFilter = customerIds.length ? `,customer_id.in.(${customerIds.join(",")})` : "";

  const [vehiclesRes, invoicesRes, reportsRes] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, year, make, model, license_plate, vin, customers(name)")
      .or(`make.ilike.${term},model.ilike.${term},license_plate.ilike.${term},vin.ilike.${term}`)
      .limit(RESULT_LIMIT),
    supabase
      .from("invoices")
      .select("id, invoice_number, total, customers(name)")
      .or(`invoice_number.ilike.${term}${customerFilter}`)
      .limit(RESULT_LIMIT),
    supabase
      .from("diagnostic_reports")
      .select("id, report_number, customers(name)")
      .or(`report_number.ilike.${term}${customerFilter}`)
      .limit(RESULT_LIMIT),
  ]);

  const error = customersError || vehiclesRes.error || invoicesRes.error || reportsRes.error;
  if (error) {
    log("ERROR", "Global search failed", request, { error: error.message });
    return secureJson({ error: "Search failed" }, 400);
  }

  return secureJson({
    customers: matchedCustomers ?? [],
    vehicles: vehiclesRes.data ?? [],
    invoices: invoicesRes.data ?? [],
    reports: reportsRes.data ?? [],
  });
}
