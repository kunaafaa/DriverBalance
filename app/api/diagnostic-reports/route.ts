import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateDiagnosticReportNumber } from "@/lib/utils/formatting";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customer_id");
  const vehicleId = searchParams.get("vehicle_id");

  let query = supabase.from("diagnostic_reports").select("*, customers(*), vehicles(*)");

  if (status) query = query.eq("status", status);
  if (customerId) query = query.eq("customer_id", customerId);
  if (vehicleId) query = query.eq("vehicle_id", vehicleId);

  const { data, error } = await query.order("report_number", { ascending: false });

  if (error) {
    console.error("Supabase Error (Diagnostic Reports):", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
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
