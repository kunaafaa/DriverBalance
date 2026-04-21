import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/utils/api-security";

export async function GET(request: NextRequest) {
  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const supabase = createClient();

  try {
    // 1. Fetch KPI Stats
    const [
      customersRes,
      vehiclesRes,
      appointmentsRes,
      invoicesRes
    ] = await Promise.all([
      supabase.from("customers").select("*", { count: "exact", head: true }),
      supabase.from("vehicles").select("*", { count: "exact", head: true }),
      supabase.from("appointments").select("*", { count: "exact", head: true }),
      supabase.from("invoices").select("total, status, issue_date")
    ]);

    if (invoicesRes.error) throw invoicesRes.error;

    const totalRevenue = (invoicesRes.data || [])
      .filter(inv => inv.status === "paid")
      .reduce((acc, inv) => acc + (inv.total || 0), 0);

    // 2. Fetch Historical Revenue (Last 6 Months)
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('en-US', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth(),
        revenue: 0
      });
    }

    (invoicesRes.data || []).forEach(inv => {
      if (inv.status !== "paid") return;
      const invDate = new Date(inv.issue_date);
      const monthIdx = months.findIndex(m => m.month === invDate.getMonth() && m.year === invDate.getFullYear());
      if (monthIdx !== -1) {
        months[monthIdx].revenue += inv.total;
      }
    });

    // 3. Fetch Recent Activity
    const [
      recentInvoicesRes,
      recentAppointmentsRes
    ] = await Promise.all([
      supabase
        .from("invoices")
        .select("id, invoice_number, total, created_at, customers(name)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("appointments")
        .select("id, scheduled_date, created_at, customers(name), status")
        .order("created_at", { ascending: false })
        .limit(5)
    ]);

    const activity = [
      ...(recentInvoicesRes.data || []).map((inv: any) => ({
        id: inv.id,
        type: "invoice",
        title: `Invoice ${inv.invoice_number} generated`,
        description: `For ${inv.customers?.name || "Customer"}. Amount: AED ${inv.total?.toLocaleString() || '0'}`,
        time: inv.created_at,
      })),
      ...(recentAppointmentsRes.data || []).map((app: any) => ({
        id: app.id,
        type: "appointment",
        title: `New Appointment: ${app.status}`,
        description: `${app.customers?.name || "Customer"} booked for ${new Date(app.scheduled_date).toLocaleDateString()}`,
        time: app.created_at,
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

    return NextResponse.json({
      stats: {
        customers: customersRes.count || 0,
        vehicles: vehiclesRes.count || 0,
        appointments: appointmentsRes.count || 0,
        revenue: totalRevenue,
      },
      chartData: months.map(m => ({ name: m.name, revenue: m.revenue })),
      activity
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
