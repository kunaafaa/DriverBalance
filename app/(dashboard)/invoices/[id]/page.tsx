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
  const [invoice, setInvoice] = useState<(Invoice & { customers: Customer, invoice_items: InvoiceItem[], appointments?: { id: string, vehicles?: { id: string, make: string, model: string, year: number, license_plate: string } | null } | null }) | null>(null);
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
            onClick={() => window.print()}
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
            @page { size: A4; margin: 6mm; }
            body { -webkit-print-color-adjust: exact; }
          }
        `}</style>

        {/* Top Purple Bar */}
        <div className="h-4 bg-[#111827] w-full shrink-0 border-t-[16px] border-[#A855F7]"></div>
        {/* Logo + Address */}
        <div className="flex-1 p-10 md:p-16 print:p-4 flex flex-col">
          <div className="mb-8 print:mb-6 text-sm text-[#111827] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img
                src="/sixth-gear-logo.png"
                alt="Sixth Gear Garage"
                width={64}
                height={64}
                className="object-contain"
              />
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter leading-none text-[#0D0D0D]">
                  Sixth Gear Garage
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest mt-1 text-gray-500">
                  Abu Dhabi, UAE
                </span>
              </div>
            </div>
            <img
              src="/dm.png"
              alt="Logo"
              width={100}
              height={100}
              className="object-contain"
            />
          </div>

          {/* Two Column Info Section */}
          <div className="flex justify-between mb-8 print:mb-3 text-sm text-[#111827]">
            <div className="w-1/2 pr-4">
              <p className="text-xs font-bold text-[#111827] mb-4">TRN: 100234567800003</p>
              <h3 className="font-bold uppercase mb-2 text-xs">BILL TO</h3>
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-sm">{invoice.customers?.name}</p>
                <p>{invoice.customers?.phone}</p>
                {invoice.customers?.address && <p className="whitespace-pre-wrap">{invoice.customers?.address}</p>}
                {!invoice.customers?.address && <p>Abu Dhabi, UAE</p>}
              </div>
              {(invoice.car_make || invoice.car_model || invoice.car_year || invoice.license_plate) && (
                <div className="mt-4">
                  <h3 className="font-bold uppercase mb-2 text-xs">VEHICLE</h3>
                  <div className="space-y-1 text-xs">
                    {(invoice.car_make || invoice.car_model) && (
                      <p className="font-semibold text-sm">{[invoice.car_make, invoice.car_model].filter(Boolean).join(' ')}</p>
                    )}
                    {invoice.car_year && <p>{invoice.car_year}</p>}
                    {invoice.license_plate && <p>{invoice.license_plate}</p>}
                  </div>
                </div>
              )}
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

          {/* Items Table */}
          <table className="w-full text-[#111827] text-sm mb-2">
            <thead>
              <tr className="bg-[#111827] text-white text-xs">
                <th className="py-2 text-left font-bold uppercase w-12">SR.NO</th>
                <th className="py-2 text-left font-bold uppercase">DESCRIPTION</th>
                <th className="py-2 text-left font-bold uppercase w-12">QTY</th>
                <th className="py-2 text-right font-bold uppercase w-28">UNIT PRICE</th>
                <th className="py-2 text-right font-bold uppercase w-28">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {invoice.invoice_items?.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-200 last:border-0 hover:bg-[#111111]/50 print:text-xs">
                  <td className="py-2 print:py-1 text-left">{index + 1}</td>
                  <td className="py-2 print:py-1 text-left font-medium">{item.description}</td>
                  <td className="py-2 print:py-1 text-right">{item.quantity}</td>
                  <td className="py-2 print:py-1 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="py-2 print:py-1 text-right">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals + Thank You */}
          <div className="flex justify-between items-end text-sm text-[#111827] mb-6">
            <p className="italic text-gray-500 text-sm">Thank you for your business!</p>
            <table>
              <tbody>
                <tr>
                  <td className="py-1 text-right pr-6 text-xs font-bold uppercase text-gray-500">SUBTOTAL</td>
                  <td className="py-1 text-right">{formatCurrency(invoice.subtotal)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-right pr-6 text-xs font-bold uppercase text-gray-500">TAX RATE</td>
                  <td className="py-1 text-right">5%</td>
                </tr>
                <tr>
                  <td className="py-1 text-right pr-6 text-xs font-bold uppercase text-gray-500">TAX</td>
                  <td className="py-1 text-right">{formatCurrency(invoice.tax_amount)}</td>
                </tr>
                {invoice.discount > 0 && (
                  <tr>
                    <td className="py-1 text-right pr-6 text-xs font-bold uppercase text-red-600">DISCOUNT</td>
                    <td className="py-1 text-right text-red-600">-{formatCurrency(invoice.discount)}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-1 text-right pr-6 text-xs font-bold uppercase">TOTAL</td>
                  <td className="bg-[#A855F7] text-white font-bold text-right px-3 py-1">{formatCurrency(invoice.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature Block */}
          <div className="flex justify-end mt-8">
            <div className="mt-8 print:mt-2 text-center flex flex-col items-center pt-8 print:pt-2 mb-8">
              <img src="/sign.png" alt="Signature" className="h-16 object-contain mb-1 mx-auto" />
              <div className="h-[2px] w-40 bg-[#A855F7] mx-auto"></div>
              <p className="mt-1 text-[10px] font-bold uppercase text-[#111827] text-center">Authorized Signature</p>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mt-8 print:mt-4 text-[#111827] border-t border-[#222222] pt-4">
            <h3 className="font-bold uppercase mb-2 tracking-wide text-[10px]">TERMS & CONDITIONS</h3>
            <div className="space-y-1 text-xs text-gray-800">
              <p>Please make bank transfers payable to:</p>
              <p> SIXTH GEAR AUTO WORKSHOP LLC SPC</p>
              <p>Bank Name: ABU DHABI COMMERCIAL BANK</p>
              <p>Account Number: 14387056920001</p>
              <p>IBAN: AE850030014387056920001</p>
              <p>SWIFT/BIC: ADCBAEAAXXX</p>
              <p>Reference: {invoice.invoice_number}</p>
            </div>
          </div>
        </div>

        {/* Bottom Blue Bar */}
        <div className="h-4 bg-[#000000] w-full shrink-0 border-b-[16px] border-[#000000] print:mt-auto"></div>
      </div>
    </div>
  );
}
