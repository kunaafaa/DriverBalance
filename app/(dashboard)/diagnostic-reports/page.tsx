"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { formatDate } from "@/lib/utils/formatting";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  confirmed: "bg-blue-100 text-blue-600",
  verified: "bg-green-100 text-green-600",
};

function DiagnosticReportsTableSkeleton() {
  return (
    <div className="bg-[#0D0D0D] rounded-3xl border border-[#1A1A1A] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#111111] border-b border-[#1A1A1A]">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Report #</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A1A]">
            {[...Array(6)].map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#1A1A1A] rounded animate-pulse" />
                    <div className="h-4 w-28 bg-[#1A1A1A] rounded animate-pulse" />
                  </div>
                </td>
                <td className="px-6 py-4"><div className="h-4 w-32 bg-[#1A1A1A] rounded animate-pulse" /></td>
                <td className="px-6 py-4"><div className="h-4 w-36 bg-[#1A1A1A] rounded animate-pulse" /></td>
                <td className="px-6 py-4"><div className="h-4 w-20 bg-[#1A1A1A] rounded animate-pulse" /></td>
                <td className="px-6 py-4 text-right">
                  <div className="h-6 w-16 bg-[#1A1A1A] rounded-full animate-pulse inline-block" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DiagnosticReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get("/api/diagnostic-reports");
        if (isMounted) setReports(data);
      } catch (error) {
        if (isMounted) console.error("Failed to fetch diagnostic reports", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const filteredReports = reports.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.report_number?.toLowerCase().includes(q) ||
      r.customers?.name?.toLowerCase().includes(q) ||
      r.vehicles?.make?.toLowerCase().includes(q) ||
      r.vehicles?.model?.toLowerCase().includes(q) ||
      r.vehicles?.license_plate?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Diagnostic Reports</h1>
          <p className="text-gray-500 font-medium">Track vehicle diagnostics, fault findings, and verification outcomes.</p>
        </div>
        <Link
          href="/diagnostic-reports/new"
          className="inline-flex items-center px-6 py-3 bg-[#A855F7] text-white font-bold rounded-2xl hover:bg-[#9333EA] transition-all shadow-lg shadow-[#A855F7]/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Report
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-[#0D0D0D] p-4 rounded-3xl border border-[#1A1A1A] shadow-sm">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by report number, customer or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#111111] rounded-2xl border border-[#1A1A1A] focus:bg-[#0D0D0D] focus:border-purple-900 transition-all outline-none font-medium text-sm text-white"
          />
        </div>
      </div>

      {loading ? (
        <DiagnosticReportsTableSkeleton />
      ) : (
        <div className="bg-[#0D0D0D] rounded-3xl border border-[#1A1A1A] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#111111] border-b border-[#1A1A1A]">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Report #</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-[#9333EA]/10 transition-all cursor-pointer"
                    onClick={() => router.push(`/diagnostic-reports/${report.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Stethoscope className="w-4 h-4 text-[#A855F7] mr-2" />
                        <span className="font-bold text-white">{report.report_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-300">
                      {report.customers?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {report.vehicles ? `${report.vehicles.make} ${report.vehicles.model} (${report.vehicles.license_plate})` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDate(report.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[report.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="py-20 text-center">
              <Stethoscope className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-gray-500 font-bold">No diagnostic reports found</h3>
              <p className="text-gray-400 text-sm">Create your first diagnostic report to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
