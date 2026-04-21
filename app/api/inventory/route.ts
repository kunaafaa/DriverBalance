import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const lowStock = searchParams.get("low_stock") === "true";

  let query = supabase.from("parts_inventory").select("*");

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,category.ilike.%${search}%`);
  }

  if (lowStock) {
    // This is a bit tricky with RLS/RPC but for now we'll do it in memory or simple filter
    // query = query.lt('quantity_in_stock', 'reorder_level'); // This column-to-column compare needs SQL
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const body = await request.json();

  const { data, error } = await supabase.from("parts_inventory").insert([body]).select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(data[0], { status: 201 });
}
