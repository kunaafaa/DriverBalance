"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { DiagnosticReport } from "@/lib/types";
import DiagnosticReportForm from "@/components/forms/DiagnosticReportForm";
import { Stethoscope, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { diagnosticReportSchema } from "@/lib/utils/validation";

type DiagnosticReportFormData = z.infer<typeof diagnosticReportSchema>;

export default function EditDiagnosticReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data } = await axios.get(`/api/diagnostic-reports/${id}`);
        setReport({
          ...data,
          customer_id: data.customer_id || "",
          vehicle_id: data.vehicle_id || "",
          fault_codes: data.fault_codes?.length ? data.fault_codes : [{ code: "", description: "" }],
          measurements: data.measurements?.length ? data.measurements : [{ parameter: "", measured: "", spec: "", read: "" }],
          required_parts: data.required_parts?.length ? data.required_parts : [{ name: "", part_number: "", price: 0 }],
          labour_hours: data.labour_hours ?? 0,
          labour_cost: data.labour_cost ?? 0,
          diagnostic_fee: data.diagnostic_fee ?? 0,
        });
      } catch (error) {
        console.error("Failed to fetch diagnostic report data", error);
        alert("Failed to load diagnostic report. Please try again.");
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

  const handleSubmit = async (data: DiagnosticReportFormData) => {
    try {
      await axios.patch(`/api/diagnostic-reports/${id}`, data);
      router.push(`/diagnostic-reports/${id}`);
      router.refresh();
    } catch (error: any) {
      alert(`Error updating diagnostic report: ${error.response?.data?.error || error.message}`);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500 font-bold">Loading diagnostic report data...</p>
    </div>
  );

  if (!report) return <div>Diagnostic report not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href={`/diagnostic-reports/${id}`}
            className="inline-flex items-center text-gray-400 hover:text-white font-bold text-sm mb-4 transition-all"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to report
          </Link>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#A855F7] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">Edit Diagnostic Report</h1>
              <p className="text-gray-500 font-medium">{report.report_number}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0D0D0D] p-6 md:p-8 rounded-[35px] shadow-xl shadow-black/50 border border-[#1A1A1A]">
        <DiagnosticReportForm
          initialData={report}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/diagnostic-reports/${id}`)}
        />
      </div>
    </div>
  );
}
