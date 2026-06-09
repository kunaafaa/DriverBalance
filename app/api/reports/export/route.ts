import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as XLSX from "xlsx";

// Excel column structures (one export type per download button):
//  sales     → number, date, customer, subtotal, vat, total, status, amount_paid
//  expenses  → date, vendor, category, amount, vat, payment_method, has_receipt
//  bills     → vendor, bill_number, date, due_date, amount, vat, amount_paid, status
//  payments  → invoice_number, date, amount, method
//  vat       → metric, value  (VAT collected / paid / net — estimate only)

function fmtDate(d: string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

function buildXlsx(
  headers: string[],
  rows: (string | number | null)[][][],
  sheetName = "Data"
): Buffer {
  const wsData = [headers, ...(rows as unknown as (string | number | null)[][])];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function xlsxResponse(buf: Buffer, filename: string): NextResponse {
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "sales";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to query params are required" }, { status: 400 });
  }

  const fromIso = new Date(from).toISOString();
  const toEnd = new Date(to);
  toEnd.setHours(23, 59, 59, 999);
  const toIso = toEnd.toISOString();

  if (type === "sales") {
    const { data, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, issue_date, subtotal, tax_amount, total, status, customers(name)")
      .gte("issue_date", fromIso)
      .lte("issue_date", toIso)
      .order("issue_date", { ascending: true });
    if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

    const { data: payments } = await supabase.from("payments").select("invoice_id, amount");

    const rows = (data || []).map((inv: any) => {
      const paid = (payments || [])
        .filter((p) => p.invoice_id === inv.id)
        .reduce((a, p) => a + Number(p.amount || 0), 0);
      return [
        inv.invoice_number,
        fmtDate(inv.issue_date),
        inv.customers?.name || "",
        Number(inv.subtotal || 0),
        Number(inv.tax_amount || 0),
        Number(inv.total || 0),
        inv.status,
        paid,
      ];
    });

    const buf = buildXlsx(
      ["Invoice #", "Date", "Customer", "Subtotal (AED)", "VAT (AED)", "Total (AED)", "Status", "Amount Paid (AED)"],
      rows as any,
      "Sales"
    );
    return xlsxResponse(buf, `sales-invoices-${from}-to-${to}.xlsx`);

  } else if (type === "expenses") {
    const { data, error } = await supabase
      .from("expenses")
      .select("expense_date, vendor, category, amount, vat_amount, payment_method, receipt_url")
      .gte("expense_date", fromIso)
      .lte("expense_date", toIso)
      .order("expense_date", { ascending: true });
    if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

    const rows = (data || []).map((e: any) => [
      fmtDate(e.expense_date),
      e.vendor || "",
      e.category,
      Number(e.amount || 0),
      Number(e.vat_amount || 0),
      e.payment_method || "",
      e.receipt_url ? "Yes" : "No",
    ]);

    const buf = buildXlsx(
      ["Date", "Vendor", "Category", "Amount (AED)", "VAT (AED)", "Payment Method", "Has Receipt"],
      rows as any,
      "Expenses"
    );
    return xlsxResponse(buf, `expenses-${from}-to-${to}.xlsx`);

  } else if (type === "bills") {
    const { data, error } = await supabase
      .from("bills")
      .select("bill_number, bill_date, due_date, amount, vat_amount, amount_paid, status, vendors(name)")
      .gte("bill_date", fromIso)
      .lte("bill_date", toIso)
      .order("bill_date", { ascending: true });
    if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

    const rows = (data || []).map((b: any) => [
      b.vendors?.name || "",
      b.bill_number || "",
      fmtDate(b.bill_date),
      fmtDate(b.due_date),
      Number(b.amount || 0),
      Number(b.vat_amount || 0),
      Number(b.amount_paid || 0),
      b.status,
    ]);

    const buf = buildXlsx(
      ["Vendor", "Bill #", "Date", "Due Date", "Amount (AED)", "VAT (AED)", "Amount Paid (AED)", "Status"],
      rows as any,
      "Bills"
    );
    return xlsxResponse(buf, `bills-${from}-to-${to}.xlsx`);

  } else if (type === "payments") {
    const { data, error } = await supabase
      .from("payments")
      .select("payment_date, amount, method, invoices(invoice_number)")
      .gte("payment_date", fromIso)
      .lte("payment_date", toIso)
      .order("payment_date", { ascending: true });
    if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

    const rows = (data || []).map((p: any) => [
      p.invoices?.invoice_number || "",
      fmtDate(p.payment_date),
      Number(p.amount || 0),
      p.method || "",
    ]);

    const buf = buildXlsx(
      ["Invoice #", "Date", "Amount (AED)", "Method"],
      rows as any,
      "Payments"
    );
    return xlsxResponse(buf, `payments-received-${from}-to-${to}.xlsx`);

  } else if (type === "vat") {
    const [invoicesRes, expensesRes, billsRes] = await Promise.all([
      supabase
        .from("invoices")
        .select("tax_amount, status, issue_date")
        .in("status", ["issued", "paid", "overdue"])
        .gte("issue_date", fromIso)
        .lte("issue_date", toIso),
      supabase
        .from("expenses")
        .select("vat_amount, expense_date")
        .gte("expense_date", fromIso)
        .lte("expense_date", toIso),
      supabase
        .from("bills")
        .select("vat_amount, bill_date")
        .gte("bill_date", fromIso)
        .lte("bill_date", toIso),
    ]);

    const vatCollected = (invoicesRes.data || []).reduce((a, i) => a + Number(i.tax_amount || 0), 0);
    const vatPaidExpenses = (expensesRes.data || []).reduce((a, e) => a + Number(e.vat_amount || 0), 0);
    const vatPaidBills = (billsRes.data || []).reduce((a, b) => a + Number(b.vat_amount || 0), 0);
    const vatPaid = vatPaidExpenses + vatPaidBills;
    const net = vatCollected - vatPaid;

    const buf = buildXlsx(
      ["Metric", "Value (AED)"],
      [
        ["VAT Collected (on issued/paid invoices)", vatCollected],
        ["VAT Paid (expenses + bills)", vatPaid],
        ["Net VAT (collected - paid)", net],
        ["NOTE", "Estimate for reference only — confirm with accountant before filing."],
      ] as any,
      "VAT Summary"
    );
    return xlsxResponse(buf, `vat-summary-${from}-to-${to}.xlsx`);

  } else {
    return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
  }
}
