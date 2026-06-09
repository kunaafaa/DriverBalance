import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

type Bucket = "current" | "1-30" | "31-60" | "60+";

/**
 * Bucketing logic (based on due_date vs today):
 *   not yet due (daysOverdue <= 0)  → "current"
 *   1–30 days overdue               → "1-30"
 *   31–60 days overdue              → "31-60"
 *   more than 60 days overdue       → "60+"
 */
function bucketFor(dueDate: string | null): { bucket: Bucket; daysOverdue: number } {
  if (!dueDate) return { bucket: "current", daysOverdue: 0 };
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  const daysOverdue = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  let bucket: Bucket = "current";
  if (daysOverdue > 60) bucket = "60+";
  else if (daysOverdue > 30) bucket = "31-60";
  else if (daysOverdue >= 1) bucket = "1-30";
  return { bucket, daysOverdue: Math.max(0, daysOverdue) };
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();

  const [invoicesRes, paymentsRes, billsRes, expensesRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, invoice_number, total, status, due_date, issue_date, customers(name)")
      .neq("status", "paid")
      .neq("status", "cancelled")
      .neq("status", "draft"),
    supabase.from("payments").select("invoice_id, amount"),
    supabase.from("bills").select("id, bill_number, amount, amount_paid, status, due_date, vendors(name)").neq("status", "paid"),
    supabase.from("expenses").select("id, vendor, amount, expense_date, receipt_url"),
  ]);

  if (invoicesRes.error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });
  if (billsRes.error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  // Sum payments per invoice
  const paidByInvoice: Record<string, number> = {};
  for (const p of paymentsRes.data || []) {
    paidByInvoice[p.invoice_id] = (paidByInvoice[p.invoice_id] || 0) + Number(p.amount || 0);
  }

  const emptyBuckets = () => ({ current: 0, "1-30": 0, "31-60": 0, "60+": 0 } as Record<Bucket, number>);

  // ---- Accounts Receivable (invoices not fully paid) ----
  const arRows: any[] = [];
  const arTotals = emptyBuckets();
  for (const inv of invoicesRes.data || []) {
    const balance = Number(inv.total || 0) - (paidByInvoice[inv.id] || 0);
    if (balance <= 0) continue;
    const { bucket, daysOverdue } = bucketFor((inv as any).issue_date || inv.due_date);
    arTotals[bucket] += balance;
    arRows.push({
      id: inv.id,
      customer: (inv as any).customers?.name || "—",
      invoice_number: inv.invoice_number,
      balance,
      days_overdue: daysOverdue,
      bucket,
    });
  }

  // ---- Accounts Payable (bills not fully paid) ----
  const apRows: any[] = [];
  const apTotals = emptyBuckets();
  for (const bill of billsRes.data || []) {
    const balance = Number(bill.amount || 0) - Number(bill.amount_paid || 0);
    if (balance <= 0) continue;
    const { bucket, daysOverdue } = bucketFor(bill.due_date);
    apTotals[bucket] += balance;
    apRows.push({
      id: bill.id,
      vendor: (bill as any).vendors?.name || "—",
      bill_number: bill.bill_number || "—",
      balance,
      days_overdue: daysOverdue,
      bucket,
    });
  }

  // ---- Action flags ----
  const today = Date.now();
  const expensesNoReceipt = (expensesRes.data || []).filter((e) => !e.receipt_url);
  const overdueInvoices = arRows.filter((r) => r.days_overdue > 0);
  const overdueBills = apRows.filter((r) => r.days_overdue > 0);

  const flags = {
    expenses_missing_receipts: expensesNoReceipt.length,
    invoices_past_due: overdueInvoices.length,
    bills_past_due: overdueBills.length,
    detail: [
      ...(expensesNoReceipt.length
        ? [`${expensesNoReceipt.length} expense(s) missing receipts`]
        : []),
      ...(overdueInvoices.length
        ? [`${overdueInvoices.length} invoice(s) past due and unpaid/partial`]
        : []),
      ...(overdueBills.length
        ? [`${overdueBills.length} bill(s) past due and unpaid/partial`]
        : []),
    ],
  };

  void today;

  return NextResponse.json({
    ar: { rows: arRows, totals: arTotals },
    ap: { rows: apRows, totals: apTotals },
    flags,
  });
}
