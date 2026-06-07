"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { DiagnosticReport, Customer, Vehicle } from "@/lib/types";
import {
  Stethoscope,
  ChevronLeft,
  Edit,
  Trash2,
  Download,
  User,
  Car,
  AlertTriangle,
  Activity,
  Search,
  Package,
  Gauge,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import { generateDiagnosticReportPDF } from "@/lib/utils/pdf";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  confirmed: "bg-blue-100 text-blue-600",
  verified: "bg-green-100 text-green-600",
};

const cardClass = "bg-[#0D0D0D] p-8 rounded-[35px] border border-[#1A1A1A] shadow-xl shadow-black/50 space-y-6";

export default function DiagnosticReportDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<(DiagnosticReport & { customers?: Customer; vehicles?: Vehicle }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data } = await axios.get(`/api/diagnostic-reports/${id}`);
        setReport(data);
      } catch (error) {
        console.error("Failed to fetch diagnostic report", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchReport();
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this diagnostic report? This action cannot be undone.")) return;
    try {
      await axios.delete(`/api/diagnostic-reports/${id}`);
      router.push("/diagnostic-reports");
    } catch (error: any) {
      alert(`Failed to delete diagnostic report: ${error.response?.data?.error || error.message}`);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500 font-bold">Loading diagnostic report...</p>
    </div>
  );

  if (!report) return <div>Diagnostic report not found</div>;

  const partsTotal = (report.required_parts || []).reduce((acc, p) => acc + (Number(p.price) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link
          href="/diagnostic-reports"
          className="inline-flex items-center text-gray-400 hover:text-white font-bold text-sm transition-all"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to list
        </Link>
        <div className="flex space-x-3">
          <button
            onClick={() => generateDiagnosticReportPDF(report)}
            className="px-4 py-2 bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl text-gray-200 font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center hover:bg-[#111111]"
          >
            <Download className="w-4 h-4 mr-2 text-[#A855F7]" />
            PDF
          </button>
          <Link
            href={`/diagnostic-reports/${id}/edit`}
            className="px-4 py-2 bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl text-gray-200 font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center hover:bg-[#111111]"
          >
            <Edit className="w-4 h-4 mr-2 text-[#A855F7]" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-[#0D0D0D] border border-red-100 rounded-xl text-red-600 font-bold text-sm shadow-sm hover:bg-red-50 hover:shadow-md transition-all flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-[#A855F7] rounded-[30px] flex items-center justify-center text-white shadow-xl shadow-[#A855F7]/20">
            <Stethoscope className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">{report.report_number}</h1>
            <p className="text-gray-500 font-bold flex items-center mt-2">
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-widest mr-2 ${statusColors[report.status] ?? "bg-gray-100 text-gray-600"}`}>
                {report.status}
              </span>
              Logged {formatDate(report.created_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          <div className={cardClass}>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-[#111111] pb-4">Report Info</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Lead Engineer</p>
                <p className="text-sm font-bold text-white mt-1">{report.lead_engineer || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Platform</p>
                <p className="text-sm font-bold text-white mt-1">{report.platform || "—"}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#111111] space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Customer</p>
              {report.customers ? (
                <Link
                  href={`/customers/${report.customer_id}`}
                  className="flex items-center p-4 bg-[#111111] rounded-2xl border border-[#1A1A1A] hover:border-[#A855F7] transition-all group"
                >
                  <div className="w-10 h-10 bg-[#0D0D0D] rounded-xl flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-black text-white leading-none">{report.customers.name}</p>
                    <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">View Profile</p>
                  </div>
                </Link>
              ) : (
                <p className="text-sm text-gray-500 font-medium">No customer linked.</p>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Vehicle</p>
              {report.vehicles ? (
                <Link
                  href={`/vehicles/${report.vehicle_id}`}
                  className="flex items-center p-4 bg-[#111111] rounded-2xl border border-[#1A1A1A] hover:border-[#A855F7] transition-all group"
                >
                  <div className="w-10 h-10 bg-[#0D0D0D] rounded-xl flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                    <Car className="w-5 h-5" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-black text-white leading-none">{report.vehicles.make} {report.vehicles.model}</p>
                    <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{report.vehicles.license_plate}</p>
                  </div>
                </Link>
              ) : (
                <p className="text-sm text-gray-500 font-medium">No vehicle linked.</p>
              )}
            </div>
          </div>

          <div className="bg-[#0A0A0A] p-8 rounded-[35px] text-white space-y-2 shadow-xl shadow-black/50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Diagnostic Fee</p>
            <h4 className="text-3xl font-black mt-1">{formatCurrency(report.diagnostic_fee)}</h4>
            <p className="text-xs font-bold text-slate-400 mt-4 flex items-center">
              <Gauge className="w-3 h-3 mr-1 text-[#A855F7]" />
              Labour: {report.labour_hours || 0}h • {formatCurrency(report.labour_cost || 0)}
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* The Case */}
          <section className={cardClass}>
            <h3 className="text-lg font-black text-white tracking-tight flex items-center">
              <Stethoscope className="w-5 h-5 mr-3 text-[#A855F7]" />
              The Case
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Reported Symptom</p>
                <p className="text-sm text-gray-300 mt-1">{report.reported_symptom || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Occurs When</p>
                <p className="text-sm text-gray-300 mt-1">{report.occurs_when || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Prior Workshops</p>
                <p className="text-sm text-gray-300 mt-1">{report.prior_workshops || "—"}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Brief</p>
                <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">{report.brief || "—"}</p>
              </div>
            </div>
          </section>

          {/* Fault Codes */}
          <section className={cardClass}>
            <h3 className="text-lg font-black text-white tracking-tight flex items-center">
              <AlertTriangle className="w-5 h-5 mr-3 text-[#A855F7]" />
              Fault Codes
            </h3>
            {report.fault_codes && report.fault_codes.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-[#1A1A1A]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-[#111111] text-gray-400 text-xs uppercase tracking-widest">
                      <th className="px-4 py-3 font-bold w-32">Code</th>
                      <th className="px-4 py-3 font-bold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]">
                    {report.fault_codes.map((fc, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-bold text-white">{fc.code || "—"}</td>
                        <td className="px-4 py-3 text-gray-300">{fc.description || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 font-medium">No fault codes recorded.</p>
            )}
          </section>

          {/* Measurements */}
          <section className={cardClass}>
            <h3 className="text-lg font-black text-white tracking-tight flex items-center">
              <Activity className="w-5 h-5 mr-3 text-[#A855F7]" />
              Measurements
            </h3>
            {report.measurements && report.measurements.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-[#1A1A1A]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-[#111111] text-gray-400 text-xs uppercase tracking-widest">
                      <th className="px-4 py-3 font-bold">Parameter</th>
                      <th className="px-4 py-3 font-bold">Measured</th>
                      <th className="px-4 py-3 font-bold">Spec / Expected</th>
                      <th className="px-4 py-3 font-bold">Read</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]">
                    {report.measurements.map((m, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-bold text-white">{m.parameter || "—"}</td>
                        <td className="px-4 py-3 text-gray-300">{m.measured || "—"}</td>
                        <td className="px-4 py-3 text-gray-300">{m.spec || "—"}</td>
                        <td className="px-4 py-3 text-gray-300">{m.read || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 font-medium">No measurements recorded.</p>
            )}
          </section>

          {/* Root Cause */}
          <section className={cardClass}>
            <h3 className="text-lg font-black text-white tracking-tight flex items-center">
              <Search className="w-5 h-5 mr-3 text-[#A855F7]" />
              Root Cause
            </h3>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{report.root_cause || "—"}</p>
            <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
              report.status === "confirmed" || report.status === "verified" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
            }`}>
              <ClipboardCheck className="w-3 h-3 mr-1" />
              {report.status === "confirmed" || report.status === "verified" ? "Confirmed" : "Not Confirmed"}
            </span>
          </section>

          {/* Recommended Intervention */}
          <section className={cardClass}>
            <h3 className="text-lg font-black text-white tracking-tight flex items-center">
              <Package className="w-5 h-5 mr-3 text-[#A855F7]" />
              Recommended Intervention
            </h3>
            {report.required_parts && report.required_parts.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-[#1A1A1A]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-[#111111] text-gray-400 text-xs uppercase tracking-widest">
                      <th className="px-4 py-3 font-bold">Part</th>
                      <th className="px-4 py-3 font-bold">Part Number</th>
                      <th className="px-4 py-3 font-bold text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]">
                    {report.required_parts.map((p, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-bold text-white">{p.name || "—"}</td>
                        <td className="px-4 py-3 text-gray-300">{p.part_number || "—"}</td>
                        <td className="px-4 py-3 text-gray-300 text-right">{formatCurrency(Number(p.price) || 0)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="px-4 py-3 font-bold text-white" colSpan={2}>Parts Subtotal</td>
                      <td className="px-4 py-3 font-black text-white text-right">{formatCurrency(partsTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 font-medium">No parts required.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Labour</p>
                <p className="text-sm text-gray-300 mt-1">{report.labour_hours || 0} hours • {formatCurrency(report.labour_cost || 0)}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Advisory Notes</p>
                <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">{report.advisory_notes || "—"}</p>
              </div>
            </div>
          </section>

          {/* Verification */}
          <section className={cardClass}>
            <h3 className="text-lg font-black text-white tracking-tight flex items-center">
              <Gauge className="w-5 h-5 mr-3 text-[#A855F7]" />
              Verification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Before Fuel Trim</p>
                <p className="text-sm text-gray-300 mt-1">{report.before_fuel_trim || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">After Fuel Trim</p>
                <p className="text-sm text-gray-300 mt-1">{report.after_fuel_trim || "—"}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Verification Status</p>
                <p className="text-sm text-gray-300 mt-1">{report.verification_status || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Diagnostic Fee</p>
                <p className="text-sm text-gray-300 mt-1">{formatCurrency(report.diagnostic_fee)}</p>
              </div>
            </div>
          </section>

          {report.notes && (
            <section className={cardClass}>
              <h3 className="text-lg font-black text-white tracking-tight">Internal Notes</h3>
              <p className="text-sm text-gray-300 italic bg-[#111111] p-4 rounded-2xl whitespace-pre-wrap">{report.notes}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
