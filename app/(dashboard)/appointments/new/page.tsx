"use client";

import AppointmentForm from "@/components/forms/AppointmentForm";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  const handleSubmit = async (data: any) => {
    try {
      await axios.post("/api/appointments", data);
      router.push("/appointments");
    } catch (error) {
      alert("Failed to schedule appointment");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link 
          href="/appointments" 
          className="inline-flex items-center text-gray-400 hover:text-white font-bold text-sm mb-4 transition-all"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Calendar
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-white">Schedule Service</h1>
        <p className="text-gray-500 font-medium text-sm mt-1">Book a new maintenance or repair slot for a client vehicle.</p>
      </div>

      <div className="bg-[#0D0D0D] p-10 rounded-[40px] border border-[#1A1A1A] shadow-2xl shadow-black/50">
        <AppointmentForm 
          onSubmit={handleSubmit} 
          onCancel={() => router.push("/appointments")} 
          defaultDate={dateParam || undefined}
        />
      </div>
    </div>
  );
}
