"use client";

import { useState } from "react";
import axios from "axios";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}
function today() {
  return new Date().toISOString().split("T")[0];
}

const EXPORTS = [
  { type: "sales", label: "Sales (Invoices)", desc: "number, date, customer, subtotal, VAT, total, status, amount paid" },
  { type: "expenses", label: "Expenses", desc: "date, vendor, category, amount, VAT, payment method, has receipt" },
  { type: "bills", label: "Bills (AP)", desc: "vendor, bill number, date, due date, amount, VAT, amount paid, status" },
  { type: "payments", label: "Payments Received", desc: "invoice number, date, amount, method" },
  { type: "vat", label: "VAT Summary", desc: "VAT collected, VAT paid, net — estimate for reference only" },
];

export default function ExportReportPage() {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (type: string, filenameBase: string) => {
    setDownloading(type);
    try {
      const res = await axios.get(`/api/reports/export`, {
        params: { type, from, to },
        responseType: "arraybuffer",
      });
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${filenameBase}-${from}-to-${to}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to generate export");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Accountant Export</h1>
          <p className="text-gray-500 font-medium">Clean, categorized Excel files (.xlsx) your accountant can open in any spreadsheet app.</p>
        </div>
        <div className="flex items-center gap-3 bg-[#0D0D0D] p-3 rounded-2xl border border-[#1A1A1A]">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-[#111111] px-3 py-2 rounded-xl border border-[#1A1A1A] text-gray-300 text-sm font-bold outline-none"
          />
          <span className="text-gray-500 text-sm">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-[#111111] px-3 py-2 rounded-xl border border-[#1A1A1A] text-gray-300 text-sm font-bold outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {EXPORTS.map((exp) => (
          <div key={exp.type} className="bg-[#0D0D0D] p-6 rounded-3xl border border-[#1A1A1A] shadow-xl shadow-black/50 flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#A855F7]/10 rounded-2xl">
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-white">{exp.label}</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">{exp.desc}</p>
              </div>
            </div>
            <button
              onClick={() => handleDownload(exp.type, exp.type)}
              disabled={downloading !== null}
              className="inline-flex items-center px-4 py-2.5 bg-[#A855F7] text-white font-bold text-sm rounded-xl hover:bg-[#9333EA] transition-all shadow-lg shadow-[#A855F7]/20 disabled:opacity-50 shrink-0"
            >
              {downloading === exp.type ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Excel
            </button>
          </div>
        ))}
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
        <p className="text-xs text-amber-400/90 font-medium">
          The VAT summary is an <strong>estimate for reference only — confirm with your accountant before filing.</strong>{" "}
          These exports capture and organize your data; they are not a tax return.
        </p>
      </div>
    </div>
  );
}
