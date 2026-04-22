"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Invoice, InvoiceItem, Customer } from "@/lib/types";
import {
  FileText,
  Download,
  Printer,
  ChevronLeft,
  Mail,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Trash2
} from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<(Invoice & { customers: Customer, invoice_items: InvoiceItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const { data } = await axios.get(`/api/invoices/${id}`);
        setInvoice(data);
      } catch (error) {
        console.error("Failed to fetch invoice", error);
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

  const handlePrint = () => {
    window.print();
  };

  const handleMarkAsPaid = async () => {
    try {
      await axios.patch(`/api/invoices/${id}`, { status: 'paid' });
      if (invoice) {
        setInvoice({ ...invoice, status: 'paid' });
      }
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this invoice? This action cannot be undone.")) return;
    try {
      await axios.delete(`/api/invoices/${id}`);
      router.push("/invoices");
    } catch (error: any) {
      alert(`Failed to delete invoice: ${error.response?.data?.error || error.message}`);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500 font-bold">Rendering invoice...</p>
    </div>
  );

  if (!invoice) return <div>Invoice not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <Link
          href="/invoices"
          className="inline-flex items-center text-gray-400 hover:text-white font-bold text-sm transition-all"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to list
        </Link>
        <div className="flex space-x-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl text-gray-200 font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center hover:bg-[#111111]"
          >
            <Printer className="w-4 h-4 mr-2 text-[#A855F7]" />
            Print
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl text-gray-200 font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center hover:bg-[#111111]"
          >
            <Download className="w-4 h-4 mr-2 text-[#A855F7]" />
            PDF
          </button>
          
          <Link
            href={`/invoices/${id}/edit`}
            className="px-4 py-2 bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl text-gray-200 font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center hover:bg-[#111111]"
          >
            <FileText className="w-4 h-4 mr-2 text-[#A855F7]" />
            Edit
          </Link>
          
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-[#0D0D0D] border border-red-100 rounded-xl text-red-600 font-bold text-sm shadow-sm hover:bg-red-50 hover:shadow-md transition-all flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
          {invoice.status !== 'paid' && (
            <button
              onClick={handleMarkAsPaid}
              className="px-6 py-2 bg-[#A855F7] text-white font-black text-sm rounded-xl shadow-lg shadow-[#A855F7]/20 hover:bg-[#9333EA] transition-all flex items-center"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Mark as Paid
            </button>
          )}
        </div>
      </div>

      {/* Invoice Document */}
      {/* Invoice Document - Classic Corporate Design */}
      <div className="bg-white shadow-black/50 print:shadow-none print:shadow-none print:border-none max-w-[800px] mx-auto relative flex flex-col" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        
        <style>{`
          @media print {
            @page { size: A4; margin: 10mm; }
            body { -webkit-print-color-adjust: exact; }
          }
        `}</style>
        
        {/* Top Blue Bar */}
        <div className="h-4 bg-[#111827] w-full shrink-0 border-t-[16px] border-[#A855F7]"></div>

        <div className="flex-1 p-10 md:p-16 print:p-8 flex flex-col">
          <div className="mb-8 print:mb-6 text-sm text-[#111827]">
            <Logo variant="dark" className="mb-2" />
            <div className="space-y-1">
              <p>Industrial Area 1</p>
              <p>Abu Dhabi, UAE</p>
              <p className="mt-1 text-xs text-gray-500">TRN: 100234567800003</p>
            </div>
          </div>

          {/* Two Column Info Section */}
          <div className="flex justify-between mb-8 print:mb-6 text-sm text-[#111827]">
            <div className="w-1/2 pr-4">
              <h3 className="font-bold uppercase mb-2 text-xs">BILL TO</h3>
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-sm">{invoice.customers?.name}</p>
                <p>{invoice.customers?.phone}</p>
                {invoice.customers?.address && <p className="whitespace-pre-wrap">{invoice.customers?.address}</p>}
                {!invoice.customers?.address && <p>Abu Dhabi, UAE</p>}
              </div>
            </div>

            <div className="w-1/2 flex justify-end">
              <table className="text-sm">
                <tbody>
                  <tr>
                    <td className="font-bold uppercase pb-1 pr-6 whitespace-nowrap text-xs text-right">INVOICE #</td>
                    <td className="pb-1 text-right whitespace-nowrap">{invoice.invoice_number}</td>
                  </tr>
                  <tr>
                    <td className="font-bold uppercase pb-1 pr-6 whitespace-nowrap text-xs text-right">DATE ISSUED</td>
                    <td className="pb-1 text-right whitespace-nowrap">{formatDate(invoice.issue_date)}</td>
                  </tr>
                  <tr>
                    <td className="font-bold uppercase pb-1 pr-6 whitespace-nowrap text-xs text-right">DUE DATE</td>
                    <td className="pb-1 text-right whitespace-nowrap">Upon receipt</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Highlight Bar */}
          <div className="border-t-2 border-b-2 border-[#A855F7] py-3 mb-8 print:mb-6 flex justify-between items-center">
            <h2 className="text-3xl font-bold text-[#111827] tracking-tight">Invoice Total</h2>
            <span className="text-3xl font-bold text-[#111827]">{formatCurrency(invoice.total)}</span>
          </div>

          {/* Items Table */}
          <table className="w-full text-[#111827] text-sm mb-6 print:mb-4">
            <thead>
              <tr className="border-b-2 border-[#A855F7] text-xs">
                <th className="py-2 text-left font-bold uppercase w-12">QTY</th>
                <th className="py-2 text-left font-bold uppercase">DESCRIPTION</th>
                <th className="py-2 text-right font-bold uppercase w-28">UNIT PRICE</th>
                <th className="py-2 text-right font-bold uppercase w-28">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {invoice.invoice_items?.map((item) => (
                <tr key={item.id} className="border-b border-gray-200 last:border-0 hover:bg-[#111111]/50">
                  <td className="py-2 text-left">{item.quantity}</td>
                  <td className="py-2 text-left font-medium">
                    {item.description}
                  </td>
                  <td className="py-2 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="py-2 text-right">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals & Signature */}
          <div className="flex justify-end text-sm text-[#111827]">
            <div className="w-64">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-1 text-right pr-6">Subtotal</td>
                    <td className="py-1 text-right">{formatCurrency(invoice.subtotal)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-right pr-6">Sales Tax 5%</td>
                    <td className="py-1 text-right">{formatCurrency(invoice.tax_amount)}</td>
                  </tr>
                  {invoice.discount > 0 && (
                    <tr>
                      <td className="py-1 text-right pr-6 text-red-600">Discount</td>
                      <td className="py-1 text-right text-red-600">-{formatCurrency(invoice.discount)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Signature Block */}
              <div className="mt-8 text-right flex flex-col items-end pt-8">
                <div className="h-[2px] w-40 bg-[#A855F7]"></div>
                <p className="mt-1 text-[10px] font-bold uppercase text-[#111827]">Authorized Signature</p>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mt-8 print:mt-4 text-[#111827] border-t border-[#222222] pt-4">
            <h3 className="font-bold uppercase mb-2 tracking-wide text-[10px]">TERMS & CONDITIONS</h3>
            <div className="space-y-1 text-xs text-gray-800">
              <p>Payment is due within 7 days of invoice date.</p>
              <p>Please make bank transfers payable to: DriverMade.co</p>
            </div>
          </div>
        </div>

        {/* Bottom Blue Bar */}
        <div className="h-4 bg-[#000000] w-full shrink-0 border-b-[16px] border-[#000000] print:mt-auto"></div>
      </div>
    </div>
  );
}
