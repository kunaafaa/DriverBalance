import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateInvoiceNumber } from "@/lib/utils/formatting";

const INVOICE_LIST_COLUMNS =
  "id, invoice_number, issue_date, due_date, total, status, customer_id, created_at, customers(name)";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customer_id");
  const licensePlate = searchParams.get("license_plate");

  // Related-record lookups (customer profile) need the full unpaginated set
  // and a plain array response — keep that shape.
  if (customerId) {
    let related = supabase.from("invoices").select(INVOICE_LIST_COLUMNS).eq("customer_id", customerId);
    if (status) related = related.eq("status", status);

    const { data, error } = await related.order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error (Invoices):", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  }

  // Vehicle profile page: match invoices by license plate (invoices have no vehicle_id FK).
  // Include invoice_items so the timeline can show the first item description.
  if (licensePlate) {
    const VEHICLE_INVOICE_COLUMNS =
      "id, invoice_number, issue_date, due_date, total, status, customer_id, created_at, license_plate, customers(name), invoice_items(description, item_type)";

    const { data, error } = await supabase
      .from("invoices")
      .select(VEHICLE_INVOICE_COLUMNS)
      .ilike("license_plate", licensePlate)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error (Invoices by plate):", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  }

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;

  let query = supabase.from("invoices").select(INVOICE_LIST_COLUMNS, { count: "exact" });

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Supabase Error (Invoices):", error);
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
  const { items, ...invoiceData } = await request.json();

  // Normalize empty strings to null for UUID foreign keys
  if (!invoiceData.customer_id || invoiceData.customer_id === "" || invoiceData.customer_id === "null") {
    invoiceData.customer_id = null;
  }
  // Make sure we delete appointment_id if it's empty to prevent UUID errors
  if (!invoiceData.appointment_id || invoiceData.appointment_id === "") {
    delete invoiceData.appointment_id;
  }


  // Get latest invoice number to generate a robust unique sequence
  const { data: latestInvoice } = await supabase
    .from("invoices")
    .select("invoice_number")
    .order("invoice_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Explicit typecasting for strict decimal columns which reject empty strings
  invoiceData.tax_rate = Number(invoiceData.tax_rate) || 0;
  invoiceData.discount = Number(invoiceData.discount) || 0;
  invoiceData.subtotal = Number(invoiceData.subtotal) || 0;
  invoiceData.tax_amount = Number(invoiceData.tax_amount) || 0;
  invoiceData.total = Number(invoiceData.total) || 0;


  let nextInvNumber = 1;
  if (latestInvoice && latestInvoice.invoice_number) {
    const parts = latestInvoice.invoice_number.split("-");
    // Handle new format INV-2026-001
    if (parts.length === 3) {
      nextInvNumber = parseInt(parts[2], 10) + 1;
    }
    // Handle old fallback format INV-001
    else if (parts.length === 2) {
      nextInvNumber = parseInt(parts[1], 10) + 1;
    }
  }

  const invoiceNumber = generateInvoiceNumber(nextInvNumber);

  const { data: invoice, error: invError } = await supabase
    .from("invoices")
    .insert([{ ...invoiceData, invoice_number: invoiceNumber }])
    .select()
    .single();

  if (invError) {
    console.error("Invoice Error:", invError);
    return NextResponse.json({ error: invError.message }, { status: 400 });
  }

  if (items && items.length > 0) {
    const invoiceItems = items.map((item: any) => ({
      invoice_id: invoice.id,
      ...item,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      total: Number(item.quantity || 1) * Number(item.unit_price || 0),
    }));

    const { error: itemError } = await supabase.from("invoice_items").insert(invoiceItems);
    if (itemError) {
      console.error("Item Error:", itemError);
      return NextResponse.json({ error: itemError.message }, { status: 400 });
    }
  }

  return NextResponse.json(invoice, { status: 201 });
}
