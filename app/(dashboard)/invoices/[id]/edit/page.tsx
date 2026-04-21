"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Invoice, InvoiceItem } from "@/lib/types";
import InvoiceForm from "@/components/forms/InvoiceForm";
import { FileText, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { invoiceSchema } from "@/lib/utils/validation";

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function EditInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<(Invoice & { invoice_items: InvoiceItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const { data } = await axios.get(`/api/invoices/${id}`);
        setInvoice({
          ...data,
          payment_method: data.payment_method || "pending",
          tax_rate: data.tax_rate ?? 5,
          discount: data.discount ?? 0,
          issue_date: data.issue_date ? data.issue_date.split("T")[0] : new Date().toISOString().split("T")[0],
          due_date: data.due_date ? data.due_date.split("T")[0] : undefined,
          appointment_id: data.appointment_id || undefined,
          notes: data.notes || undefined,
          items: data.invoice_items?.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            item_type: item.item_type,
          })) || [],
        });
      } catch (error) {
        console.error("Failed to fetch invoice data", error);
        alert("Failed to load invoice. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchInvoice();
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleSubmit = async (data: InvoiceFormData) => {
    try {
      const normalizedData = {
        ...data,
        subtotal: data.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0),
        tax_amount: (data.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0) * data.tax_rate) / 100,
        total: (data.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0) * (1 + data.tax_rate / 100)) - data.discount,
      };

      await axios.patch(`/api/invoices/${id}`, normalizedData);
      router.push(`/invoices/${id}`);
      router.refresh();
    } catch (error: any) {
      alert(`Error updating invoice: ${error.response?.data?.error || error.message}`);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500 font-bold">Loading invoice data...</p>
    </div>
  );

  if (!invoice) return <div>Invoice not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href={`/invoices/${id}`}
            className="inline-flex items-center text-gray-400 hover:text-white font-bold text-sm mb-4 transition-all"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to invoice
          </Link>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#A855F7] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">Edit Invoice</h1>
              <p className="text-gray-500 font-medium">{invoice.invoice_number}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0D0D0D] p-6 md:p-8 rounded-[35px] shadow-xl shadow-black/50 border border-[#1A1A1A]">
        <InvoiceForm 
          initialData={invoice as any}
          onSubmit={handleSubmit} 
          onCancel={() => router.push(`/invoices/${id}`)}
        />
      </div>
    </div>
  );
}
