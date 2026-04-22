"use client";

import { useEffect, useState } from "react";
import { Invoice } from "@/lib/types";
import { Plus, Search, FileText, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchInvoices = async (isMounted = true) => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/invoices");
      if (isMounted) setInvoices(data);
    } catch (error) {
      console.error("Failed to fetch invoices", error);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchInvoices(isMounted);
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Invoices</h1>
          <p className="text-gray-500 font-medium">Track billing, payments, and financial records.</p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center px-6 py-3 bg-[#A855F7] text-white font-bold rounded-2xl hover:bg-[#9333EA] transition-all shadow-lg shadow-[#A855F7]/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Invoice
        </Link>
      </div>

      {loading ? (
        <div className="bg-[#0D0D0D] rounded-3xl p-20 flex flex-col items-center justify-center border border-[#1A1A1A] shadow-sm">
          <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-bold">Loading financials...</p>
        </div>
      ) : (
        <div className="bg-[#0D0D0D] rounded-3xl border border-[#1A1A1A] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#111111] border-b border-[#1A1A1A]">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((invoice) => (
                  <tr 
                    key={invoice.id} 
                    className="hover:bg-[#9333EA]/10 transition-all cursor-pointer" 
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-[#A855F7] mr-2" />
                        <span className="font-bold text-white">{invoice.invoice_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-300">
                      {invoice.customers?.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDate(invoice.issue_date)}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-white">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        invoice.status === "paid" ? "bg-green-100 text-green-600" : 
                        invoice.status === "issued" ? "bg-purple-100 text-purple-600" : "bg-yellow-100 text-yellow-600"
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {invoices.length === 0 && (
            <div className="py-20 text-center">
              <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-gray-500 font-bold">No invoices found</h3>
              <p className="text-gray-400 text-sm">Create your first invoice to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
