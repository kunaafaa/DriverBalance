"use client";

import { useEffect, useState } from "react";
import { Quotation } from "@/lib/types";
import { Plus, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-600",
  accepted: "bg-green-100 text-green-600",
  rejected: "bg-red-100 text-red-600",
  expired: "bg-yellow-100 text-yellow-600",
};

function QuotationsTableSkeleton() {
  return (
    <div className="bg-[#0D0D0D] rounded-3xl border border-[#1A1A1A] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#111111] border-b border-[#1A1A1A]">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Quotation #</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Plate</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
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
                <td className="px-6 py-4"><div className="h-4 w-36 bg-[#1A1A1A] rounded animate-pulse" /></td>
                <td className="px-6 py-4"><div className="h-4 w-20 bg-[#1A1A1A] rounded animate-pulse" /></td>
                <td className="px-6 py-4"><div className="h-4 w-20 bg-[#1A1A1A] rounded animate-pulse" /></td>
                <td className="px-6 py-4"><div className="h-4 w-16 bg-[#1A1A1A] rounded animate-pulse" /></td>
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

export default function QuotationsPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const { data } = await axios.get("/api/quotations");
        if (isMounted) setQuotations(data);
      } catch (error) {
        if (isMounted) console.error("Failed to fetch quotations", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Quotations</h1>
          <p className="text-gray-500 font-medium">Generate and manage cost estimates for vehicles.</p>
        </div>
        <Link
          href="/quotations/new"
          className="inline-flex items-center px-6 py-3 bg-[#A855F7] text-white font-bold rounded-2xl hover:bg-[#9333EA] transition-all shadow-lg shadow-[#A855F7]/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Quotation
        </Link>
      </div>

      {loading ? (
        <QuotationsTableSkeleton />
      ) : (
        <div className="bg-[#0D0D0D] rounded-3xl border border-[#1A1A1A] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#111111] border-b border-[#1A1A1A]">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Quotation #</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Plate</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {quotations.map((q) => (
                  <tr
                    key={q.id}
                    className="hover:bg-[#9333EA]/10 transition-all cursor-pointer"
                    onClick={() => router.push(`/quotations/${q.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <ClipboardList className="w-4 h-4 text-[#A855F7] mr-2" />
                        <span className="font-bold text-white">{q.quotation_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-300">
                      {q.car_year} {q.car_make} {q.car_model}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{q.license_plate}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{formatDate(q.issue_date)}</td>
                    <td className="px-6 py-4 text-sm font-black text-white">{formatCurrency(q.total)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[q.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {quotations.length === 0 && (
            <div className="py-20 text-center">
              <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-gray-500 font-bold">No quotations yet</h3>
              <p className="text-gray-400 text-sm">Create your first quotation to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
