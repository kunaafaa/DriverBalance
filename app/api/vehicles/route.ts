import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const VEHICLE_LIST_COLUMNS =
  "id, customer_id, make, model, year, vin, license_plate, current_mileage, last_service_date, created_at, customers(name)";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customer_id");
  const search = searchParams.get("search") || "";

  // Related-record lookups (vehicle dropdowns, customer profile) need the
  // full unpaginated set and a plain array response — keep that shape.
  if (customerId) {
    const { data, error } = await supabase
      .from("vehicles")
      .select(VEHICLE_LIST_COLUMNS)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error (Vehicles):", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  }

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;

  let query = supabase.from("vehicles").select(VEHICLE_LIST_COLUMNS, { count: "exact" });

  if (search) {
    query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%,license_plate.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Supabase Error (Vehicles):", error);
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
  const body = await request.json();

  const { data, error } = await supabase.from("vehicles").insert([body]).select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(data[0], { status: 201 });
}
