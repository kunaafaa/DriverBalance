"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { formatCurrency } from "@/lib/utils/formatting";
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Flag } from "lucide-react";

type Bucket = "current" | "1-30" | "31-60" | "60+";
const BUCKET_ORDER: Bucket[] = ["current", "1-30", "31-60", "60+"];
const BUCKET_LABELS: Record<Bucket, string> = {
  current: "Current",
  "1-30": "1–30 days",
  "31-60": "31–60 days",
  "60+": "60+ days",
};

interface AgingRow {
  id: string;
  balance: number;
  days_overdue: number;
  bucket: Bucket;
  customer?: string;
  invoice_number?: string;
  vendor?: string;
  bill_number?: string;
}

interface AgingData {
  ar: { rows: AgingRow[]; totals: Record<Bucket, number> };
  ap: { rows: AgingRow[]; totals: Record<Bucket, number> };
  flags: { detail: string[] };
}

function BucketTotals({ totals }: { totals: Record<Bucket, number> }) {
  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      {BUCKET_ORDER.map((b) => (
        <div key={b} className="bg-[#111111] rounded-xl p-3 border border-[#1A1A1A]">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{BUCKET_LABELS[b]}</p>
          <p className={`text-sm font-black mt-1 ${b === "60+" && totals[b] > 0 ? "text-red-500" : "text-white"}`}>
            {formatCurrency(totals[b] || 0)}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function AgingReportPage() {
  const [data, setData] = useState<AgingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/reports/aging")
      .then(({ data }) => setData(data))
      .catch((err) => console.error("Failed to fetch aging report", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-bold">Building the aging report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">Money &amp; Flags</h1>
        <p className="text-gray-500 font-medium">Who owes you, who you owe, and what needs attention.</p>
      </div>

      {/* Action flags */}
      <div className="bg-[#0D0D0D] p-6 rounded-3xl border border-[#1A1A1A] shadow-xl shadow-black/50">
        <h3 className="flex items-center text-sm font-black text-white uppercase tracking-tight mb-4">
          <Flag className="w-4 h-4 mr-2 text-amber-400" />
          Action Flags
        </h3>
        {data.flags.detail.length === 0 ? (
          <p className="text-green-500 text-sm font-bold">All clear — nothing needs attention.</p>
        ) : (
          <ul className="space-y-2">
            {data.flags.detail.map((f, i) => (
              <li key={i} className="flex items-center text-sm font-medium text-amber-400/90">
                <AlertTriangle className="w-4 h-4 mr-2" />
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Accounts Receivable */}
      <div className="bg-[#0D0D0D] p-6 rounded-3xl border border-[#1A1A1A] shadow-xl shadow-black/50">
        <h3 className="flex items-center text-lg font-black text-white tracking-tight mb-4">
          <ArrowDownCircle className="w-5 h-5 mr-2 text-green-500" />
          Accounts Receivable (money owed to you)
        </h3>
        <BucketTotals totals={data.ar.totals} />
        <div className="overflow-x-auto rounded-2xl border border-[#1A1A1A]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#111111] border-b border-[#1A1A1A]">
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Balance Due</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Days Overdue</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Bucket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {data.ar.rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-6 py-3 font-bold text-white">{r.customer}</td>
                  <td className="px-6 py-3 text-sm text-gray-300">{r.invoice_number}</td>
                  <td className="px-6 py-3 text-sm font-black text-amber-400">{formatCurrency(r.balance)}</td>
                  <td className="px-6 py-3 text-sm text-gray-300">{r.days_overdue}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${r.bucket === "60+" ? "bg-red-100 text-red-600" : "bg-[#1A1A1A] text-gray-400"}`}>
                      {BUCKET_LABELS[r.bucket]}
                    </span>
                  </td>
                </tr>
              ))}
              {data.ar.rows.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-bold text-sm">No outstanding receivables.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accounts Payable */}
      <div className="bg-[#0D0D0D] p-6 rounded-3xl border border-[#1A1A1A] shadow-xl shadow-black/50">
        <h3 className="flex items-center text-lg font-black text-white tracking-tight mb-4">
          <ArrowUpCircle className="w-5 h-5 mr-2 text-red-500" />
          Accounts Payable (money you owe)
        </h3>
        <BucketTotals totals={data.ap.totals} />
        <div className="overflow-x-auto rounded-2xl border border-[#1A1A1A]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#111111] border-b border-[#1A1A1A]">
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Bill #</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Balance Due</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Days Overdue</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Bucket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {data.ap.rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-6 py-3 font-bold text-white">{r.vendor}</td>
                  <td className="px-6 py-3 text-sm text-gray-300">{r.bill_number}</td>
                  <td className="px-6 py-3 text-sm font-black text-amber-400">{formatCurrency(r.balance)}</td>
                  <td className="px-6 py-3 text-sm text-gray-300">{r.days_overdue}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${r.bucket === "60+" ? "bg-red-100 text-red-600" : "bg-[#1A1A1A] text-gray-400"}`}>
                      {BUCKET_LABELS[r.bucket]}
                    </span>
                  </td>
                </tr>
              ))}
              {data.ap.rows.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-bold text-sm">No outstanding payables.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
