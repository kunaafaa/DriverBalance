import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  let query = supabase.from("expenses").select("*");

  if (search) {
    query = query.or(`vendor.ilike.%${search}%,notes.ilike.%${search}%,category.ilike.%${search}%`);
  }

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query.order("expense_date", { ascending: false });

  if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const body = await request.json();

  // Strict decimal columns reject empty strings
  body.amount = Number(body.amount) || 0;
  body.vat_amount = Number(body.vat_amount) || 0;
  if (!body.receipt_url) body.receipt_url = null;

  const { data, error } = await supabase.from("expenses").insert([body]).select();

  if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  return NextResponse.json(data[0], { status: 201 });
}
