"use client";

import { useEffect, useState } from "react";
import BillsTable from "@/components/tables/BillsTable";
import { Bill } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/formatting";
import { Plus, CreditCard } from "lucide-react";
import Link from "next/link";
import axios from "axios";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
];

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const fetchBills = async (statusFilter = "") => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/bills`, { params: { status: statusFilter } });
      setBills(data);
    } catch (error) {
      console.error("Failed to fetch bills", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills(status);
  }, [status]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bill?")) return;
    try {
      await axios.delete(`/api/bills/${id}`);
      fetchBills(status);
    } catch (error) {
      alert("Failed to delete bill");
    }
  };

  const handleRecordPayment = async (bill: Bill) => {
    const balance = Number(bill.amount || 0) - Number(bill.amount_paid || 0);
    const input = prompt(
      `Record a payment for ${bill.vendors?.name || "this bill"}.\nBalance due: ${formatCurrency(balance)}\n\nEnter payment amount (AED):`,
      balance.toFixed(2)
    );
    if (input === null) return;
    const amount = Number(input);
    if (isNaN(amount) || amount <= 0) {
      alert("Enter a valid amount.");
      return;
    }
    try {
      await axios.patch(`/api/bills/${bill.id}`, { record_payment: amount });
      fetchBills(status);
    } catch (error) {
      alert("Failed to record payment");
    }
  };

  const totalOutstanding = bills.reduce(
    (acc, b) => acc + Math.max(0, Number(b.amount || 0) - Number(b.amount_paid || 0)),
    0
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Bills</h1>
          <p className="text-gray-500 font-medium">Accounts payable — money you owe to vendors.</p>
        </div>
        <Link
          href="/bills/new"
          className="inline-flex items-center px-6 py-3 bg-[#A855F7] text-white font-bold rounded-2xl hover:bg-[#9333EA] transition-all shadow-lg shadow-[#A855F7]/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Bill
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-[#0D0D0D] p-4 rounded-3xl border border-[#1A1A1A] shadow-sm">
        <div className="flex gap-2 flex-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                status === f.value ? "bg-[#A855F7] text-white" : "bg-[#111111] text-gray-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-5 py-3 bg-[#111111] rounded-2xl border border-[#1A1A1A]">
          <CreditCard className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Outstanding</span>
          <span className="text-sm font-black text-amber-400">{formatCurrency(totalOutstanding)}</span>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#0D0D0D] rounded-3xl p-20 flex flex-col items-center justify-center border border-[#1A1A1A] shadow-sm">
          <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-bold">Loading bills...</p>
        </div>
      ) : (
        <BillsTable bills={bills} onDelete={handleDelete} onRecordPayment={handleRecordPayment} />
      )}
    </div>
  );
}
