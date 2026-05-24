import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateQuotationNumber } from "@/lib/utils/formatting";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabase.from("quotations").select("*, quotation_items(*)");
  if (status) query = query.eq("status", status);

  const { data, error } = await query.order("quotation_number", { ascending: false });

  if (error) {
    console.error("Supabase Error (Quotations):", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { items, ...quotationData } = await request.json();

  quotationData.tax_rate = Number(quotationData.tax_rate) || 0;
  quotationData.discount = Number(quotationData.discount) || 0;
  quotationData.subtotal = Number(quotationData.subtotal) || 0;
  quotationData.tax_amount = Number(quotationData.tax_amount) || 0;
  quotationData.total = Number(quotationData.total) || 0;
  quotationData.car_year = Number(quotationData.car_year);

  const { data: latestQuotation } = await supabase
    .from("quotations")
    .select("quotation_number")
    .order("quotation_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextNumber = 1;
  if (latestQuotation?.quotation_number) {
    const parts = latestQuotation.quotation_number.split("-");
    if (parts.length === 3) nextNumber = parseInt(parts[2], 10) + 1;
  }

  const quotationNumber = generateQuotationNumber(nextNumber);

  const { data: quotation, error: quotationError } = await supabase
    .from("quotations")
    .insert([{ ...quotationData, quotation_number: quotationNumber, status: "draft" }])
    .select()
    .single();

  if (quotationError) {
    console.error("Quotation Error:", quotationError);
    return NextResponse.json({ error: quotationError.message }, { status: 400 });
  }

  if (items && items.length > 0) {
    const quotationItems = items.map((item: any) => ({
      quotation_id: quotation.id,
      ...item,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      total: Number(item.quantity || 1) * Number(item.unit_price || 0),
    }));

    const { error: itemError } = await supabase.from("quotation_items").insert(quotationItems);
    if (itemError) {
      console.error("Quotation Item Error:", itemError);
      return NextResponse.json({ error: itemError.message }, { status: 400 });
    }
  }

  return NextResponse.json(quotation, { status: 201 });
}
