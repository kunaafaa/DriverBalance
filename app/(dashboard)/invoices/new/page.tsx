"use client";

import InvoiceForm from "@/components/forms/InvoiceForm";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function NewInvoicePage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      // Data normalization for backend
      const normalizedData = {
        ...data,
        subtotal: data.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0),
        tax_amount: (data.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0) * data.tax_rate) / 100,
        total: (data.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0) * (1 + data.tax_rate / 100)) - data.discount,
        status: "issued"
      };

      await axios.post("/api/invoices", normalizedData);
      router.push("/invoices");
    } catch (error: any) {
      alert(`Failed to create invoice: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link 
          href="/invoices" 
          className="inline-flex items-center text-gray-400 hover:text-white font-bold text-sm mb-4 transition-all"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Invoices
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-white">Create New Invoice</h1>
        <p className="text-gray-500 font-medium text-sm mt-1">Generate a professional tax invoice for a customer service or parts sale.</p>
      </div>

      <div className="bg-[#0D0D0D] p-8 rounded-[40px] border border-[#1A1A1A] shadow-2xl shadow-black/50">
        <InvoiceForm 
          onSubmit={handleSubmit} 
          onCancel={() => router.push("/invoices")} 
        />
      </div>
    </div>
  );
}
