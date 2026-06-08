import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateDiagnosticReportNumber } from "@/lib/utils/formatting";

const DIAGNOSTIC_REPORT_LIST_COLUMNS =
  "id, report_number, status, customer_id, vehicle_id, created_at, customers(name), vehicles(make, model, license_plate)";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customer_id");
  const vehicleId = searchParams.get("vehicle_id");
  const search = searchParams.get("search") || "";

  // Related-record lookups (customer/vehicle profile pages) need the full
  // unpaginated set and a plain array response — keep that shape.
  if (customerId || vehicleId) {
    let related = supabase.from("diagnostic_reports").select(DIAGNOSTIC_REPORT_LIST_COLUMNS);
    if (status) related = related.eq("status", status);
    if (customerId) related = related.eq("customer_id", customerId);
    if (vehicleId) related = related.eq("vehicle_id", vehicleId);

    const { data, error } = await related.order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error (Diagnostic Reports):", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  }

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;

  let query = supabase.from("diagnostic_reports").select(DIAGNOSTIC_REPORT_LIST_COLUMNS, { count: "exact" });

  if (status) query = query.eq("status", status);

  if (search) {
    // PostgREST can't OR-filter across joined tables in one query, so resolve
    // matching customer/vehicle ids first, then OR them with report_number.
    const [{ data: matchedCustomers }, { data: matchedVehicles }] = await Promise.all([
      supabase.from("customers").select("id").ilike("name", `%${search}%`),
      supabase.from("vehicles").select("id").or(`make.ilike.%${search}%,model.ilike.%${search}%,license_plate.ilike.%${search}%`),
    ]);

    const orFilters = [`report_number.ilike.%${search}%`];
    const customerIds = (matchedCustomers ?? []).map((c) => c.id);
    const vehicleIds = (matchedVehicles ?? []).map((v) => v.id);
    if (customerIds.length) orFilters.push(`customer_id.in.(${customerIds.join(",")})`);
    if (vehicleIds.length) orFilters.push(`vehicle_id.in.(${vehicleIds.join(",")})`);

    query = query.or(orFilters.join(","));
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Supabase Error (Diagnostic Reports):", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    data,
    pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const reportData = await request.json();

  // Normalize empty strings to null for UUID foreign keys
  if (!reportData.customer_id || reportData.customer_id === "" || reportData.customer_id === "null") {
    reportData.customer_id = null;
  }
  if (!reportData.vehicle_id || reportData.vehicle_id === "" || reportData.vehicle_id === "null") {
    reportData.vehicle_id = null;
  }

  // Get latest report number to generate a robust unique sequence
  const { data: latestReport } = await supabase
    .from("diagnostic_reports")
    .select("report_number")
    .order("report_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Explicit typecasting for strict decimal columns which reject empty strings
  reportData.diagnostic_fee = Number(reportData.diagnostic_fee) || 0;
  reportData.labour_hours = Number(reportData.labour_hours) || 0;
  reportData.labour_cost = Number(reportData.labour_cost) || 0;

  let nextReportNumber = 1;
  if (latestReport && latestReport.report_number) {
    const parts = latestReport.report_number.split("-");
    if (parts.length === 2) {
      nextReportNumber = parseInt(parts[1], 10) + 1;
    }
  }

  const reportNumber = generateDiagnosticReportNumber(nextReportNumber);

  const { data: report, error } = await supabase
    .from("diagnostic_reports")
    .insert([{ ...reportData, report_number: reportNumber }])
    .select()
    .single();

  if (error) {
    console.error("Diagnostic Report Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(report, { status: 201 });
}
