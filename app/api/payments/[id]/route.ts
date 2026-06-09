import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("invoice_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  if (payment?.invoice_id) {
    const { data: invoice } = await supabase
      .from("invoices")
      .select("total, status")
      .eq("id", payment.invoice_id)
      .single();

    const { data: remaining } = await supabase
      .from("payments")
      .select("amount")
      .eq("invoice_id", payment.invoice_id);

    const totalPaid = (remaining || []).reduce((acc, p) => acc + Number(p.amount || 0), 0);

    if (invoice && invoice.status === "paid" && totalPaid < Number(invoice.total || 0)) {
      await supabase.from("invoices").update({ status: "issued" }).eq("id", payment.invoice_id);
    }
  }

  return NextResponse.json({ success: true });
}
