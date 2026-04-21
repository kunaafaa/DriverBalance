import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customer_id");
  const search = searchParams.get("search") || "";

  let query = supabase.from("vehicles").select("*, customers(name)");

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  if (search) {
    query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%,license_plate.ilike.%${search}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase Error (Vehicles):", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }


  return NextResponse.json(data);
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
