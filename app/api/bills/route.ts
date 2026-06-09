import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

function computeStatus(amount: number, amountPaid: number): "unpaid" | "partial" | "paid" {
  if (amountPaid >= amount) return "paid";
  if (amountPaid > 0) return "partial";
  return "unpaid";
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabase.from("bills").select("*, vendors(*)");

  if (status) query = query.eq("status", status);

  const { data, error } = await query.order("due_date", { ascending: true });

  if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const body = await request.json();

  // Normalise empty FK / decimals
  if (!body.vendor_id || body.vendor_id === "" || body.vendor_id === "null") {
    body.vendor_id = null;
  }
  body.amount = Number(body.amount) || 0;
  body.vat_amount = Number(body.vat_amount) || 0;
  body.amount_paid = Number(body.amount_paid) || 0;
  if (!body.due_date) body.due_date = null;
  body.status = computeStatus(body.amount, body.amount_paid);

  const { data, error } = await supabase.from("bills").insert([body]).select();

  if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  return NextResponse.json(data[0], { status: 201 });
}
