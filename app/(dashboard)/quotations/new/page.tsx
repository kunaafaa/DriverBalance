"use client";

import QuotationForm from "@/components/forms/QuotationForm";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function NewQuotationPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      const subtotal = data.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0);
      const taxAmount = (subtotal * data.tax_rate) / 100;
      const total = subtotal + taxAmount - data.discount;

      await axios.post("/api/quotations", {
        ...data,
        subtotal,
        tax_amount: taxAmount,
        total,
      });
      router.push("/quotations");
    } catch (error: any) {
      alert(`Failed to create quotation: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link
          href="/quotations"
          className="inline-flex items-center text-gray-400 hover:text-white font-bold text-sm mb-4 transition-all"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Quotations
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-white">New Quotation</h1>
        <p className="text-gray-500 font-medium text-sm mt-1">Generate a cost estimate for a vehicle service or repair.</p>
      </div>

      <div className="bg-[#0D0D0D] p-8 rounded-[40px] border border-[#1A1A1A] shadow-2xl shadow-black/50">
        <QuotationForm
          onSubmit={handleSubmit}
          onCancel={() => router.push("/quotations")}
        />
      </div>
    </div>
  );
}
