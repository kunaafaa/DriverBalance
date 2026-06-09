"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Quotation, QuotationItem } from "@/lib/types";
import {
  ClipboardList,
  Download,
  Printer,
  ChevronLeft,
  Trash2,
  CheckCircle2,
  XCircle,
  Car,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-yellow-100 text-yellow-700",
};

export default function QuotationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [quotation, setQuotation] = useState<(Quotation & { quotation_items: QuotationItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const fetch = async () => {
      try {
        const { data } = await axios.get(`/api/quotations/${id}`);
        setQuotation(data);
      } catch (error) {
        console.error("Failed to fetch quotation", error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleMarkAccepted = async () => {
    try {
      await axios.patch(`/api/quotations/${id}`, { status: "accepted" });
      if (quotation) setQuotation({ ...quotation, status: "accepted" });
    } catch { alert("Failed to update status"); }
  };

  const handleMarkRejected = async () => {
    try {
      await axios.patch(`/api/quotations/${id}`, { status: "rejected" });
      if (quotation) setQuotation({ ...quotation, status: "rejected" });
    } catch { alert("Failed to update status"); }
  };

  const handleConvert = async () => {
    if (!window.confirm("Convert this quotation to an invoice? This will create a new invoice with all items from this quotation.")) return;
    setConverting(true);
    try {
      const { data } = await axios.post(`/api/quotations/${id}/convert`);
      router.push(`/invoices/${data.id}`);
    } catch (error: any) {
      alert(`Failed to convert: ${error.response?.data?.error || error.message}`);
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this quotation permanently?")) return;
    try {
      await axios.delete(`/api/quotations/${id}`);
      router.push("/quotations");
    } catch (error: any) {
      alert(`Failed to delete: ${error.response?.data?.error || error.message}`);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500 font-bold">Loading quotation...</p>
    </div>
  );

  if (!quotation) return <div className="text-white">Quotation not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Action Bar */}
      <div className="flex flex-col gap-2 print:hidden max-w-[800px] mx-auto w-full">
        <Link
          href="/quotations"
          className="inline-flex items-center text-gray-400 hover:text-white font-bold text-sm transition-all"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to list
        </Link>
        <div className="flex flex-nowrap gap-2 overflow-x-auto">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl text-gray-200 font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center hover:bg-[#111111] whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-[#A855F7]" />
            Print
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl text-gray-200 font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center hover:bg-[#111111] whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-[#A855F7]" />
            PDF
          </button>
          <Link
            href={`/quotations/${id}/edit`}
            className="px-3 py-1.5 bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl text-gray-200 font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center hover:bg-[#111111] whitespace-nowrap"
          >
            <ClipboardList className="w-3.5 h-3.5 mr-1.5 text-[#A855F7]" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 bg-[#0D0D0D] border border-red-100 rounded-xl text-red-600 font-bold text-xs shadow-sm hover:bg-red-50 hover:shadow-md transition-all flex items-center whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </button>
          {["draft", "sent", "accepted"].includes(quotation.status?.toLowerCase()) && (
            <button
              onClick={handleConvert}
              disabled={converting}
              className="px-3 py-1.5 bg-[#0D0D0D] border border-[#A855F7] rounded-xl text-[#A855F7] font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center hover:bg-[#A855F7]/10 disabled:opacity-60 whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              {converting ? "Converting..." : "Convert to Invoice"}
            </button>
          )}
          {(quotation.status === "draft" || quotation.status === "sent") && (
            <>
              <button
                onClick={handleMarkAccepted}
                className="px-3 py-1.5 bg-[#0D0D0D] border border-green-700 rounded-xl text-green-400 font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center hover:bg-green-900/20 whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Mark Accepted
              </button>
              <button
                onClick={handleMarkRejected}
                className="px-3 py-1.5 bg-[#0D0D0D] border border-red-800 rounded-xl text-red-500 font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center hover:bg-red-900/20 whitespace-nowrap"
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                Mark Rejected
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quotation Document */}
      <div
        className="bg-white shadow-black/50 print:shadow-none print:border-none max-w-[800px] mx-auto relative flex flex-col"
        style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
      >
        <style>{`
          @media print {
            @page { size: A4; margin: 6mm; }
            body { -webkit-print-color-adjust: exact; }
          }
        `}</style>

        {/* Top bar */}
        <div className="h-4 bg-[#111827] w-full shrink-0 border-t-[16px] border-[#A855F7]"></div>

        <div className="flex-1 p-10 md:p-16 print:p-4 flex flex-col">
          {/* Logo + Address */}
          <div className="mb-8 print:mb-6 text-sm text-[#111827] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img
                src="/sixth-gear-logo.png"
                alt="Sixth Gear Garage"
                width={64}
                height={64}
                className="object-contain"
                loading="lazy"
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
              loading="lazy"
            />
          </div>

          {/* Two-column info */}
          <div className="flex justify-between mb-8 print:mb-6 text-sm text-[#111827]">
            <div className="w-1/2 pr-4">
              <p className="text-xs font-bold text-[#111827] mb-4">TRN: 100234567800003</p>
              <h3 className="font-bold uppercase mb-2 text-xs">VEHICLE</h3>
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-sm">{quotation.car_year} {quotation.car_make} {quotation.car_model}</p>
                <p>Plate: {quotation.license_plate}</p>
                {quotation.customer_name && <p className="mt-2 font-semibold">{quotation.customer_name}</p>}
                {quotation.customer_phone && <p>{quotation.customer_phone}</p>}
              </div>
            </div>

            <div className="w-1/2 flex justify-end">
              <table className="text-sm">
                <tbody>
                  <tr>
                    <td className="font-bold uppercase pb-1 pr-6 whitespace-nowrap text-xs text-right">QUOTATION #</td>
                    <td className="pb-1 text-right whitespace-nowrap">{quotation.quotation_number}</td>
                  </tr>
                  <tr>
                    <td className="font-bold uppercase pb-1 pr-6 whitespace-nowrap text-xs text-right">DATE ISSUED</td>
                    <td className="pb-1 text-right whitespace-nowrap">{formatDate(quotation.issue_date)}</td>
                  </tr>
                  {quotation.valid_until && (
                    <tr>
                      <td className="font-bold uppercase pb-1 pr-6 whitespace-nowrap text-xs text-right">VALID UNTIL</td>
                      <td className="pb-1 text-right whitespace-nowrap">{formatDate(quotation.valid_until)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="font-bold uppercase pb-1 pr-6 whitespace-nowrap text-xs text-right">STATUS</td>
                    <td className="pb-1 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${statusColors[quotation.status]}`}>
                        {quotation.status}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Items table */}
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
              {quotation.quotation_items?.map((item, index) => (
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
                  <td className="py-1 text-right">{formatCurrency(quotation.subtotal)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-right pr-6 text-xs font-bold uppercase text-gray-500">TAX RATE</td>
                  <td className="py-1 text-right">{quotation.tax_rate}%</td>
                </tr>
                <tr>
                  <td className="py-1 text-right pr-6 text-xs font-bold uppercase text-gray-500">TAX</td>
                  <td className="py-1 text-right">{formatCurrency(quotation.tax_amount)}</td>
                </tr>
                {quotation.discount > 0 && (
                  <tr>
                    <td className="py-1 text-right pr-6 text-xs font-bold uppercase text-red-600">DISCOUNT</td>
                    <td className="py-1 text-right text-red-600">-{formatCurrency(quotation.discount)}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-1 text-right pr-6 text-xs font-bold uppercase">TOTAL</td>
                  <td className="bg-[#A855F7] text-white font-bold text-right px-3 py-1">{formatCurrency(quotation.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature Block */}
          <div className="flex justify-end mt-8">
            <div className="mt-8 print:mt-2 text-center flex flex-col items-center pt-8 print:pt-2 mb-8">
              <img src="/sign.png" alt="Signature" className="h-16 object-contain mb-1 mx-auto" loading="lazy" />
              <div className="h-[2px] w-40 bg-[#A855F7] mx-auto"></div>
              <p className="mt-1 text-[10px] font-bold uppercase text-[#111827] text-center">Authorized Signature</p>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div className="mt-8 print:mt-4 text-[#111827] border-t border-[#222222] pt-4">
              <h3 className="font-bold uppercase mb-2 tracking-wide text-[10px]">NOTES</h3>
              <p className="text-xs text-gray-800 whitespace-pre-wrap">{quotation.notes}</p>
            </div>
          )}

          {/* Terms */}
          <div className="mt-6 print:mt-4 text-[#111827] border-t border-[#222222] pt-4">
            <h3 className="font-bold uppercase mb-2 tracking-wide text-[10px]">TERMS & CONDITIONS</h3>
            <div className="space-y-1 text-xs text-gray-800">
              <p>This quotation is valid for 30 days from the date of issue.</p>
              <p>Prices are subject to change after the validity period.</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="h-4 bg-[#000000] w-full shrink-0 border-b-[16px] border-[#000000] print:mt-auto"></div>
      </div>
    </div>
  );
}
