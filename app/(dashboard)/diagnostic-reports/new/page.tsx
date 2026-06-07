"use client";

import DiagnosticReportForm from "@/components/forms/DiagnosticReportForm";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import axios from "axios";

import { Suspense } from "react";

function NewDiagnosticReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get("customer_id");
  const vehicleIdParam = searchParams.get("vehicle_id");

  const handleSubmit = async (data: any) => {
    try {
      await axios.post("/api/diagnostic-reports", data);
      router.push("/diagnostic-reports");
    } catch (error: any) {
      alert(`Failed to create diagnostic report: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link
          href="/diagnostic-reports"
          className="inline-flex items-center text-gray-400 hover:text-white font-bold text-sm mb-4 transition-all"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Diagnostic Reports
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-white">New Diagnostic Report</h1>
        <p className="text-gray-500 font-medium text-sm mt-1">Document a vehicle diagnosis from symptom to verification.</p>
      </div>

      <div className="bg-[#0D0D0D] p-8 rounded-[40px] border border-[#1A1A1A] shadow-2xl shadow-black/50">
        <DiagnosticReportForm
          defaultCustomerId={customerIdParam || undefined}
          defaultVehicleId={vehicleIdParam || undefined}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/diagnostic-reports")}
        />
      </div>
    </div>
  );
}

export default function NewDiagnosticReportPage() {
  return (
    <Suspense fallback={<div className="text-white font-bold p-10">Loading form...</div>}>
      <NewDiagnosticReportContent />
    </Suspense>
  );
}
