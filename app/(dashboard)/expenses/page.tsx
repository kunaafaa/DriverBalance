"use client";

import { useEffect, useState } from "react";
import ExpensesTable from "@/components/tables/ExpensesTable";
import { Expense } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/formatting";
import { Plus, Search, Wallet } from "lucide-react";
import Link from "next/link";
import axios from "axios";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "rent", label: "Rent" },
  { value: "salaries", label: "Salaries" },
  { value: "cogs_parts", label: "COGS (Parts)" },
  { value: "tools", label: "Tools" },
  { value: "marketing", label: "Marketing" },
  { value: "utilities", label: "Utilities" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "bank_fees", label: "Bank Fees" },
  { value: "other", label: "Other" },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const fetchExpenses = async (searchQuery = "", cat = "") => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/expenses`, {
        params: { search: searchQuery, category: cat },
      });
      setExpenses(data);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpenses(search, category);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, category]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await axios.delete(`/api/expenses/${id}`);
      fetchExpenses(search, category);
    } catch (error) {
      alert("Failed to delete expense");
    }
  };

  const total = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Expenses</h1>
          <p className="text-gray-500 font-medium">Every dirham going out — logged, categorized, receipt-backed.</p>
        </div>
        <Link
          href="/expenses/new"
          className="inline-flex items-center px-6 py-3 bg-[#A855F7] text-white font-bold rounded-2xl hover:bg-[#9333EA] transition-all shadow-lg shadow-[#A855F7]/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Log Expense
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-[#0D0D0D] p-4 rounded-3xl border border-[#1A1A1A] shadow-sm">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vendor, notes or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#111111] rounded-2xl border border-[#1A1A1A] focus:bg-[#0D0D0D] focus:border-purple-900 transition-all outline-none font-medium text-sm"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-3 bg-[#111111] rounded-2xl border border-[#1A1A1A] text-gray-300 font-bold text-sm outline-none focus:bg-[#0D0D0D]"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 px-5 py-3 bg-[#111111] rounded-2xl border border-[#1A1A1A]">
          <Wallet className="w-4 h-4 text-[#A855F7]" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</span>
          <span className="text-sm font-black text-white">{formatCurrency(total)}</span>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#0D0D0D] rounded-3xl p-20 flex flex-col items-center justify-center border border-[#1A1A1A] shadow-sm">
          <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-bold">Loading expenses...</p>
        </div>
      ) : (
        <ExpensesTable expenses={expenses} onDelete={handleDelete} />
      )}
    </div>
  );
}
