import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { requireAuth, checkRateLimit, sanitizeBody, log, secureJson } from "@/lib/utils/api-security";

const ALLOWED_INVOICE_FIELDS = [
  "customer_id", "appointment_id", "issue_date", "due_date",
  "status", "payment_method", "notes",
  "tax_rate", "discount", "subtotal", "tax_amount", "total",
] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { id } = await params;
  if (!id) return secureJson({ error: "Missing ID" }, 400);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, customers(*), invoice_items(*)")
    .eq("id", id)
    .single();

  if (error) {
    log("WARN", `Invoice not found: ${id}`, request);
    return secureJson({ error: "Invoice not found" }, 404);
  }

  return secureJson(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = checkRateLimit(request, "write");
  if (limited) return limited;

  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { id } = await params;
  if (!id) return secureJson({ error: "Missing ID" }, 400);

  const supabase = createClient();
  const rawBody = await request.json();
  const { items, ...rawInvoiceData } = rawBody;

  // Mass-assignment protection — only update known fields
  const invoiceData = sanitizeBody(rawInvoiceData, ALLOWED_INVOICE_FIELDS);

  // Numeric coercion to prevent type injection
  if ("tax_rate"   in invoiceData) invoiceData.tax_rate   = Number(invoiceData.tax_rate)   || 0;
  if ("discount"   in invoiceData) invoiceData.discount   = Number(invoiceData.discount)   || 0;
  if ("subtotal"   in invoiceData) invoiceData.subtotal   = Number(invoiceData.subtotal)   || 0;
  if ("tax_amount" in invoiceData) invoiceData.tax_amount = Number(invoiceData.tax_amount) || 0;
  if ("total"      in invoiceData) invoiceData.total      = Number(invoiceData.total)      || 0;

  // Validate total is non-negative
  if (typeof invoiceData.total === "number" && invoiceData.total < 0) {
    return secureJson({ error: "Invoice total cannot be negative." }, 422);
  }

  const { data, error } = await supabase
    .from("invoices")
    .update(invoiceData)
    .eq("id", id)
    .select();

  if (error) {
    log("ERROR", `Failed to update invoice: ${id}`, request, { error: error.message });
    return secureJson({ error: "Failed to update invoice" }, 400);
  }

  if (!data || data.length === 0) {
    return secureJson({ error: "Invoice not found" }, 404);
  }

  // Update line items if provided
  if (Array.isArray(items)) {
    await supabase.from("invoice_items").delete().eq("invoice_id", id);

    if (items.length > 0) {
      const invoiceItems = items.map((item: Record<string, unknown>) => ({
        invoice_id: id,
        description: String(item.description || ""),
        item_type: String(item.item_type || "service"),
        quantity: Math.max(0, Number(item.quantity) || 1),
        unit_price: Math.max(0, Number(item.unit_price) || 0),
        total: Math.max(0, (Number(item.quantity) || 1) * (Number(item.unit_price) || 0)),
      }));

      const { error: itemError } = await supabase.from("invoice_items").insert(invoiceItems);
      if (itemError) {
        log("ERROR", `Failed to update invoice items: ${id}`, request, { error: itemError.message });
        return secureJson({ error: "Failed to update invoice items" }, 400);
      }
    }
  }

  log("INFO", `Invoice updated: ${id}`, request);
  return secureJson(data[0]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = checkRateLimit(request, "write");
  if (limited) return limited;

  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { id } = await params;
  if (!id) return secureJson({ error: "Missing ID" }, 400);

  const supabase = createClient();
  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) {
    log("ERROR", `Failed to delete invoice: ${id}`, request, { error: error.message });
    return secureJson({ error: "Failed to delete invoice" }, 400);
  }

  log("INFO", `Invoice deleted: ${id}`, request);
  return secureJson({ success: true });
}
