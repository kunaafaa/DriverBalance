"use client";

import ExpenseForm from "@/components/forms/ExpenseForm";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function NewExpensePage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      await axios.post("/api/expenses", data);
      router.push("/expenses");
    } catch (error) {
      alert("Failed to log expense");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link
          href="/expenses"
          className="inline-flex items-center text-gray-400 hover:text-white font-bold text-sm mb-4 transition-all"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Expenses
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-white">Log Expense</h1>
        <p className="text-gray-500 font-medium text-sm mt-1">Capture money going out, with a receipt if you have one.</p>
      </div>

      <div className="bg-[#0D0D0D] p-8 rounded-3xl border border-[#1A1A1A] shadow-xl shadow-black/50">
        <ExpenseForm onSubmit={handleSubmit} onCancel={() => router.push("/expenses")} />
      </div>
    </div>
  );
}
