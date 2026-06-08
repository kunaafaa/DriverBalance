import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");
  const customerId = searchParams.get("customer_id");
  const vehicleId = searchParams.get("vehicle_id");

  let query = supabase.from("appointments").select("*, customers(*), vehicles(*), appointment_services(*, service_types(*))");

  if (from) query = query.gte("scheduled_date", from);
  if (to) query = query.lte("scheduled_date", to);
  if (status) query = query.eq("status", status);
  if (customerId) query = query.eq("customer_id", customerId);
  if (vehicleId) query = query.eq("vehicle_id", vehicleId);

  const { data, error } = await query.order("scheduled_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { services, ...body } = await request.json();

  // Handle transaction-like creation
  const { data: appointment, error: appError } = await supabase
    .from("appointments")
    .insert([body])
    .select()
    .single();

  if (appError) return NextResponse.json({ error: appError.message }, { status: 400 });

  if (services && services.length > 0) {
    const serviceItems = services.map((serviceId: string) => ({
      appointment_id: appointment.id,
      service_type_id: serviceId,
      unit_price: 0, // In a real app, you'd fetch the base price from service_types
    }));

    const { error: serError } = await supabase.from("appointment_services").insert(serviceItems);
    if (serError) return NextResponse.json({ error: serError.message }, { status: 400 });
  }

  return NextResponse.json(appointment, { status: 201 });
}
