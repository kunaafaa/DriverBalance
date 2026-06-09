"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { formatCurrency } from "@/lib/utils/formatting";
import { generatePnLPDF } from "@/lib/utils/pdf";
import { BarChart3, TrendingUp, TrendingDown, Download, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const CATEGORY_LABELS: Record<string, string> = {
  rent: "Rent",
  salaries: "Salaries",
  cogs_parts: "COGS (Parts)",
  tools: "Tools",
  marketing: "Marketing",
  utilities: "Utilities",
  subscriptions: "Subscriptions",
  bank_fees: "Bank Fees",
  other: "Other",
  bills_ap: "Bills (AP)",
};

type RangeKey = "30d" | "6m" | "1y";

const RANGES: { key: RangeKey; label: string; getDates: () => { from: string; to: string } }[] = [
  {
    key: "30d",
    label: "Last 30 Days",
    getDates: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 29);
      return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] };
    },
  },
  {
    key: "6m",
    label: "Last 6 Months",
    getDates: () => {
      const to = new Date();
      const from = new Date();
      from.setMonth(from.getMonth() - 6);
      return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] };
    },
  },
  {
    key: "1y",
    label: "Last Year",
    getDates: () => {
      const to = new Date();
      const from = new Date();
      from.setFullYear(from.getFullYear() - 1);
      return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] };
    },
  },
];

interface PnlData {
  revenue: number;
  expensesByCategory: Record<string, number>;
  totalExpenses: number;
  netProfit: number;
  margin: number;
}

export default function PnlReportPage() {
  const [activeRange, setActiveRange] = useState<RangeKey>("30d");
  const [from, setFrom] = useState(() => RANGES[0].getDates().from);
  const [to, setTo] = useState(() => RANGES[0].getDates().to);
  const [data, setData] = useState<PnlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleRangeSelect = (r: typeof RANGES[number]) => {
    const dates = r.getDates();
    setActiveRange(r.key);
    setFrom(dates.from);
    setTo(dates.to);
  };

  const fetchPnl = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/reports/pnl`, { params: { from, to } });
      setData(data);
    } catch (error) {
      console.error("Failed to fetch P&L", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPnl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const handleDownloadPdf = async () => {
    if (!data) return;
    setDownloadingPdf(true);
    try {
      await generatePnLPDF(data, from, to);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const chartData = data
    ? Object.entries(data.expensesByCategory)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: CATEGORY_LABELS[k] || k, value: v }))
    : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">P&amp;L Summary</h1>
          <p className="text-gray-500 font-medium">A categorized profit-and-loss summary. Not a ledger.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#0D0D0D] p-1.5 rounded-2xl border border-[#1A1A1A]">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => handleRangeSelect(r)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeRange === r.key
                    ? "bg-[#A855F7] text-white shadow-lg shadow-[#A855F7]/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={!data || downloadingPdf}
            className="inline-flex items-center px-4 py-2.5 bg-[#A855F7] text-white font-bold text-sm rounded-xl hover:bg-[#9333EA] transition-all shadow-lg shadow-[#A855F7]/20 disabled:opacity-50"
          >
            {downloadingPdf ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            PDF
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="bg-[#0D0D0D] rounded-3xl p-20 flex flex-col items-center justify-center border border-[#1A1A1A]">
          <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-bold">Crunching the numbers...</p>
        </div>
      ) : (
        <>
          {/* Headline cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0D0D0D] p-6 rounded-3xl border border-[#1A1A1A] shadow-xl shadow-black/50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</p>
              <h3 className="text-2xl font-black text-white mt-1">{formatCurrency(data.revenue)}</h3>
              <p className="text-xs text-gray-500 mt-1">Paid invoices in range</p>
            </div>
            <div className="bg-[#0D0D0D] p-6 rounded-3xl border border-[#1A1A1A] shadow-xl shadow-black/50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expenses</p>
              <h3 className="text-2xl font-black text-white mt-1">{formatCurrency(data.totalExpenses)}</h3>
              <p className="text-xs text-gray-500 mt-1">All categories</p>
            </div>
            <div className="bg-[#0D0D0D] p-6 rounded-3xl border border-[#1A1A1A] shadow-xl shadow-black/50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Net Profit</p>
              <h3 className={`text-2xl font-black mt-1 flex items-center gap-2 ${data.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                {data.netProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {formatCurrency(data.netProfit)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Margin {data.margin.toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Breakdown table */}
            <div className="bg-[#0D0D0D] rounded-3xl border border-[#1A1A1A] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#111111] border-b border-[#1A1A1A]">
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Line</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  <tr>
                    <td className="px-6 py-3 font-bold text-white">Revenue (paid invoices)</td>
                    <td className="px-6 py-3 text-right font-black text-green-500">{formatCurrency(data.revenue)}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-bold text-gray-400 uppercase text-xs tracking-widest" colSpan={2}>Expenses</td>
                  </tr>
                  {Object.entries(data.expensesByCategory).map(([cat, val]) => (
                    <tr key={cat}>
                      <td className="px-6 py-3 pl-10 text-sm text-gray-300">{CATEGORY_LABELS[cat] || cat}</td>
                      <td className="px-6 py-3 text-right text-sm text-gray-300">{formatCurrency(val)}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#111111]/50">
                    <td className="px-6 py-3 font-bold text-white">Total Expenses</td>
                    <td className="px-6 py-3 text-right font-black text-white">{formatCurrency(data.totalExpenses)}</td>
                  </tr>
                  <tr className="bg-[#111111]">
                    <td className="px-6 py-4 font-black text-white uppercase text-sm tracking-tight">Net Profit</td>
                    <td className={`px-6 py-4 text-right font-black text-lg ${data.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {formatCurrency(data.netProfit)}
                      <span className="block text-[10px] text-gray-500 font-bold">Margin {data.margin.toFixed(1)}%</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Expense breakdown chart */}
            <div className="bg-[#0D0D0D] p-8 rounded-3xl border border-[#1A1A1A] shadow-xl shadow-black/50">
              <h3 className="flex items-center text-lg font-black text-white tracking-tight mb-6">
                <BarChart3 className="w-5 h-5 mr-2 text-[#A855F7]" />
                Where the money goes
              </h3>
              {chartData.length === 0 ? (
                <p className="text-gray-500 text-sm font-bold py-20 text-center">No expenses in this range.</p>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1A1A1A" />
                      <XAxis type="number" tick={{ fill: "#94A3B8", fontSize: 11 }} tickFormatter={(v) => `${v}`} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 600 }} width={90} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: "#A855F7", fillOpacity: 0.08 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#111111]/90 backdrop-blur-md border border-[#1A1A1A] p-3 rounded-xl">
                                <p className="text-xs font-bold text-white">{payload[0].payload.name}</p>
                                <p className="text-sm font-black text-[#A855F7]">{formatCurrency(payload[0].value as number)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill="#A855F7" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
