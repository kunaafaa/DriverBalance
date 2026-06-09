import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get("invoice_id");

  let query = supabase.from("payments").select("*");
  if (invoiceId) query = query.eq("invoice_id", invoiceId);

  const { data, error } = await query.order("payment_date", { ascending: false });

  if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const body = await request.json();

  if (!body.invoice_id) {
    return NextResponse.json({ error: "invoice_id is required" }, { status: 400 });
  }

  body.amount = Number(body.amount) || 0;

  const { data: payment, error } = await supabase
    .from("payments")
    .insert([body])
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  // Recompute invoice status from the sum of payments vs. the invoice total.
  const { data: invoice } = await supabase
    .from("invoices")
    .select("total, status")
    .eq("id", body.invoice_id)
    .single();

  const { data: allPayments } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", body.invoice_id);

  const totalPaid = (allPayments || []).reduce((acc, p) => acc + Number(p.amount || 0), 0);

  if (invoice && totalPaid >= Number(invoice.total || 0) && invoice.status !== "paid") {
    // Fully settled — flip to paid (keeps dashboard revenue logic working).
    await supabase.from("invoices").update({ status: "paid" }).eq("id", body.invoice_id);
  }

  return NextResponse.json({ payment, total_paid: totalPaid }, { status: 201 });
}
