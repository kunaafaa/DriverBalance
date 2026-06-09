import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

function computeStatus(amount: number, amountPaid: number): "unpaid" | "partial" | "paid" {
  if (amountPaid >= amount) return "paid";
  if (amountPaid > 0) return "partial";
  return "unpaid";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("bills")
    .select("*, vendors(*)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  return NextResponse.json(data);
}

/**
 * PATCH handles two cases:
 *  - General edits to bill fields.
 *  - Recording a payment: send { record_payment: <amount> } and it is ADDED to
 *    amount_paid, with status recomputed (unpaid / partial / paid).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const body = await request.json();

  const { data: current, error: fetchErr } = await supabase
    .from("bills")
    .select("amount, amount_paid")
    .eq("id", id)
    .single();

  if (fetchErr) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  const update: Record<string, unknown> = {};

  if ("record_payment" in body) {
    const addition = Number(body.record_payment) || 0;
    const newPaid = Number(current.amount_paid || 0) + addition;
    update.amount_paid = newPaid;
    update.status = computeStatus(Number(current.amount || 0), newPaid);
  } else {
    if ("vendor_id" in body) update.vendor_id = body.vendor_id || null;
    if ("bill_number" in body) update.bill_number = body.bill_number;
    if ("bill_date" in body) update.bill_date = body.bill_date;
    if ("due_date" in body) update.due_date = body.due_date || null;
    if ("category" in body) update.category = body.category;
    if ("notes" in body) update.notes = body.notes;

    const amount = "amount" in body ? Number(body.amount) || 0 : Number(current.amount || 0);
    const amountPaid =
      "amount_paid" in body ? Number(body.amount_paid) || 0 : Number(current.amount_paid || 0);
    if ("amount" in body) update.amount = amount;
    if ("vat_amount" in body) update.vat_amount = Number(body.vat_amount) || 0;
    if ("amount_paid" in body) update.amount_paid = amountPaid;
    update.status = computeStatus(amount, amountPaid);
  }

  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("bills")
    .update(update)
    .eq("id", id)
    .select("*, vendors(*)");

  if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  return NextResponse.json(data[0]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { error } = await supabase.from("bills").delete().eq("id", id);

  if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  return NextResponse.json({ success: true });
}
