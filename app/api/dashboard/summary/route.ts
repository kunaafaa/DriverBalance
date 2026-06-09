import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/utils/api-security";

export async function GET(request: NextRequest) {
  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const supabase = createClient();

  try {
    const url = new URL(request.url);
    const range = url.searchParams.get("range") || "6m";
    const monthCount = range === "1y" ? 12 : 6;

    const now = new Date();
    const months: { name: string; year: number; month: number; revenue: number; expenses: number }[] = [];
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString("en-US", { month: "short" }),
        year: d.getFullYear(),
        month: d.getMonth(),
        revenue: 0,
        expenses: 0,
      });
    }

    const rangeStart = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1), 1).toISOString();

    // 1. KPI counts + invoices + expenses + bills in one batch
    const [
      customersRes,
      vehiclesRes,
      appointmentsRes,
      invoicesRes,
      expensesRes,
      billsRes,
    ] = await Promise.all([
      supabase.from("customers").select("*", { count: "exact", head: true }),
      supabase.from("vehicles").select("*", { count: "exact", head: true }),
      supabase.from("appointments").select("*", { count: "exact", head: true }),
      supabase.from("invoices").select("total, status, issue_date"),
      supabase.from("expenses").select("amount, expense_date").gte("expense_date", rangeStart),
      supabase.from("bills").select("amount_paid, bill_date").gt("amount_paid", 0).gte("bill_date", rangeStart),
    ]);

    if (invoicesRes.error) throw invoicesRes.error;

    const totalRevenue = (invoicesRes.data || [])
      .filter((inv) => inv.status === "paid")
      .reduce((acc, inv) => acc + (inv.total || 0), 0);

    const totalExpenses =
      (expensesRes.data || []).reduce((acc, e) => acc + Number(e.amount || 0), 0) +
      (billsRes.data || []).reduce((acc, b) => acc + Number(b.amount_paid || 0), 0);

    const netProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // 2. Build monthly chart data
    (invoicesRes.data || []).forEach((inv) => {
      if (inv.status !== "paid") return;
      const invDate = new Date(inv.issue_date);
      const idx = months.findIndex(
        (m) => m.month === invDate.getMonth() && m.year === invDate.getFullYear()
      );
      if (idx !== -1) months[idx].revenue += inv.total;
    });

    (expensesRes.data || []).forEach((e) => {
      const expDate = new Date(e.expense_date);
      const idx = months.findIndex(
        (m) => m.month === expDate.getMonth() && m.year === expDate.getFullYear()
      );
      if (idx !== -1) months[idx].expenses += Number(e.amount || 0);
    });

    (billsRes.data || []).forEach((b) => {
      const billDate = new Date(b.bill_date);
      const idx = months.findIndex(
        (m) => m.month === billDate.getMonth() && m.year === billDate.getFullYear()
      );
      if (idx !== -1) months[idx].expenses += Number(b.amount_paid || 0);
    });

    // 3. Recent activity
    const [recentInvoicesRes, recentAppointmentsRes] = await Promise.all([
      supabase
        .from("invoices")
        .select("id, invoice_number, total, created_at, customers(name)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("appointments")
        .select("id, scheduled_date, created_at, customers(name), status")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const activity = [
      ...(recentInvoicesRes.data || []).map((inv: any) => ({
        id: inv.id,
        type: "invoice",
        title: `Invoice ${inv.invoice_number} generated`,
        description: `For ${inv.customers?.name || "Customer"}. Amount: AED ${inv.total?.toLocaleString() || "0"}`,
        time: inv.created_at,
      })),
      ...(recentAppointmentsRes.data || []).map((app: any) => ({
        id: app.id,
        type: "appointment",
        title: `New Appointment: ${app.status}`,
        description: `${app.customers?.name || "Customer"} booked for ${new Date(app.scheduled_date).toLocaleDateString()}`,
        time: app.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);

    return NextResponse.json({
      stats: {
        customers: customersRes.count || 0,
        vehicles: vehiclesRes.count || 0,
        appointments: appointmentsRes.count || 0,
        revenue: totalRevenue,
        expenses: totalExpenses,
        netProfit,
        margin,
      },
      chartData: months.map((m) => ({ name: m.name, revenue: m.revenue, expenses: m.expenses })),
      activity,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
