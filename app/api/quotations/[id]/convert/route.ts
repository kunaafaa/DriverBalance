import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateInvoiceNumber } from "@/lib/utils/formatting";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createClient();

  // 1. Fetch the full quotation including all quotation_items
  const { data: quotation, error: quoError } = await supabase
    .from("quotations")
    .select("*, quotation_items(*)")
    .eq("id", id)
    .single();

  if (quoError || !quotation) {
    return NextResponse.json({ error: quoError?.message || "Quotation not found" }, { status: 404 });
  }

  // 2. Generate a new invoice number (same robust sequence logic as the invoices POST route)
  const { data: latestInvoice } = await supabase
    .from("invoices")
    .select("invoice_number")
    .order("invoice_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextInvNumber = 1;
  if (latestInvoice && latestInvoice.invoice_number) {
    const parts = latestInvoice.invoice_number.split("-");
    if (parts.length === 3) {
      nextInvNumber = parseInt(parts[2], 10) + 1;
    } else if (parts.length === 2) {
      nextInvNumber = parseInt(parts[1], 10) + 1;
    }
  }
  const invoiceNumber = generateInvoiceNumber(nextInvNumber);

  // 3. Look up the customer by matching customer_name and customer_phone
  let customerId: string | null = null;
  if (quotation.customer_name && quotation.customer_phone) {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("name", quotation.customer_name)
      .eq("phone", quotation.customer_phone)
      .maybeSingle();
    if (customer) customerId = customer.id;
  }

  // 4. Look up the vehicle by matching license_plate
  let carMake = quotation.car_make;
  let carModel = quotation.car_model;
  let carYear = quotation.car_year;
  let licensePlate = quotation.license_plate;
  if (quotation.license_plate) {
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("make, model, year, license_plate")
      .eq("license_plate", quotation.license_plate)
      .maybeSingle();
    if (vehicle) {
      carMake = vehicle.make;
      carModel = vehicle.model;
      carYear = vehicle.year;
      licensePlate = vehicle.license_plate;
    }
  }

  // 5. Create the new invoice record
  const { data: invoice, error: invError } = await supabase
    .from("invoices")
    .insert([
      {
        customer_id: customerId,
        invoice_number: invoiceNumber,
        issue_date: new Date().toISOString(),
        due_date: null,
        subtotal: Number(quotation.subtotal) || 0,
        tax_rate: Number(quotation.tax_rate) || 0,
        tax_amount: Number(quotation.tax_amount) || 0,
        discount: Number(quotation.discount) || 0,
        total: Number(quotation.total) || 0,
        status: "draft",
        payment_method: "pending",
        car_make: carMake,
        car_model: carModel,
        car_year: carYear,
        license_plate: licensePlate,
        notes: quotation.notes,
      },
    ])
    .select()
    .single();

  if (invError) {
    console.error("Convert Invoice Error:", invError);
    return NextResponse.json({ error: invError.message }, { status: 400 });
  }

  // 6. Create a matching invoice_item for each quotation_item
  const quotationItems = quotation.quotation_items || [];
  if (quotationItems.length > 0) {
    const invoiceItems = quotationItems.map((item: any) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      total: Number(item.total) || 0,
      item_type: item.item_type,
    }));

    const { error: itemError } = await supabase.from("invoice_items").insert(invoiceItems);
    if (itemError) {
      console.error("Convert Item Error:", itemError);
      return NextResponse.json({ error: itemError.message }, { status: 400 });
    }
  }

  // 7. Update the quotation status to 'accepted' if it was draft or sent
  if (quotation.status === "draft" || quotation.status === "sent") {
    await supabase
      .from("quotations")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", id);
  }

  return NextResponse.json({ id: invoice.id }, { status: 201 });
}
