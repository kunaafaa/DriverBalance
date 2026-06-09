import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const EXPENSE_CATEGORIES = [
  "rent", "salaries", "cogs_parts", "tools", "marketing",
  "utilities", "subscriptions", "bank_fees", "other",
] as const;

/**
 * Read-only Profit & Loss SUMMARY for a date range — NOT a ledger.
 *
 * Revenue calculation (two sources combined to handle both payment workflows):
 *   1. sum(payments.amount) where payment_date in [from, to]
 *      → covers invoices paid via the "Record Payment" flow
 *   2. sum(invoices.total) where status='paid', issue_date in [from, to],
 *      AND no row exists in the payments table for that invoice
 *      → covers invoices marked paid directly (bypassed the payments table)
 *   Revenue = (1) + (2)
 *
 * Expense calculation (two sources combined):
 *   A. expenses table: sum by category where expense_date in [from, to]
 *   B. bills table: sum(amount_paid) where amount_paid > 0 and bill_date in [from, to]
 *      Bills with a matching expense category merge into that bucket.
 *      Bills with no matching category go into "bills_ap".
 *
 * netProfit = revenue - totalExpenses
 * margin %  = revenue > 0 ? (netProfit / revenue * 100) : 0
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to query params are required" }, { status: 400 });
  }

  const fromIso = new Date(from).toISOString();
  const toEnd = new Date(to);
  toEnd.setHours(23, 59, 59, 999);
  const toIso = toEnd.toISOString();

  const [
    paymentsInRangeRes,
    invoicesPaidRes,
    allPaymentInvoiceIdsRes,
    expensesRes,
    billsRes,
  ] = await Promise.all([
    // Payments recorded within the date range
    supabase
      .from("payments")
      .select("invoice_id, amount")
      .gte("payment_date", fromIso)
      .lte("payment_date", toIso),
    // Paid invoices issued within the date range (for the bypass fallback)
    supabase
      .from("invoices")
      .select("id, total")
      .eq("status", "paid")
      .gte("issue_date", fromIso)
      .lte("issue_date", toIso),
    // All invoice IDs that have ANY payment row (no date filter — used for dedup)
    supabase.from("payments").select("invoice_id"),
    // Logged expenses in range
    supabase
      .from("expenses")
      .select("amount, category")
      .gte("expense_date", fromIso)
      .lte("expense_date", toIso),
    // Paid / partial bills in range
    supabase
      .from("bills")
      .select("amount_paid, category")
      .gt("amount_paid", 0)
      .gte("bill_date", fromIso)
      .lte("bill_date", toIso),
  ]);

  if (paymentsInRangeRes.error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });
  if (invoicesPaidRes.error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });
  if (expensesRes.error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });
  if (billsRes.error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  // ---- Revenue ----
  const paymentsTotal = (paymentsInRangeRes.data || []).reduce(
    (acc, p) => acc + Number(p.amount || 0), 0
  );
  // Invoices that have at least one row in the payments table (across all time)
  const invoiceIdsWithPayments = new Set(
    (allPaymentInvoiceIdsRes.data || []).map((p) => p.invoice_id)
  );
  // Paid invoices with NO payments at all — they were marked paid directly
  const bypassedTotal = (invoicesPaidRes.data || [])
    .filter((inv) => !invoiceIdsWithPayments.has(inv.id))
    .reduce((acc, inv) => acc + Number(inv.total || 0), 0);
  const revenue = paymentsTotal + bypassedTotal;

  // ---- Expenses ----
  const expensesByCategory: Record<string, number> = {};
  for (const cat of EXPENSE_CATEGORIES) expensesByCategory[cat] = 0;
  expensesByCategory["bills_ap"] = 0;

  for (const e of expensesRes.data || []) {
    const cat = (EXPENSE_CATEGORIES as readonly string[]).includes(e.category as string)
      ? (e.category as string)
      : "other";
    expensesByCategory[cat] += Number(e.amount || 0);
  }

  for (const bill of billsRes.data || []) {
    const cat = (EXPENSE_CATEGORIES as readonly string[]).includes(bill.category as string)
      ? (bill.category as string)
      : "bills_ap";
    expensesByCategory[cat] += Number(bill.amount_paid || 0);
  }

  const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
  const netProfit = revenue - totalExpenses;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return NextResponse.json({
    from,
    to,
    revenue,
    expensesByCategory,
    totalExpenses,
    netProfit,
    margin,
  });
}
