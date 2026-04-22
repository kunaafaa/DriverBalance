"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AppointmentForm from "@/components/forms/AppointmentForm";
import { ChevronLeft, Trash2, Calendar, User, Car, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { formatDateTime } from "@/lib/utils/formatting";

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const { data } = await axios.get(`/api/appointments/${id}`);
        // Transform the joined data to match form expectations if needed
        const formattedData = {
          ...data,
          services: data.appointment_services?.map((as: any) => as.service_type_id) || []
        };
        setAppointment(formattedData);
      } catch (err) {
        console.error("Failed to fetch appointment", err);
        setError("Appointment not found or access denied.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAppointment();
  }, [id]);

  const handleSubmit = async (data: any) => {
    try {
      await axios.patch(`/api/appointments/${id}`, data);
      router.push("/appointments");
    } catch (err) {
      alert("Failed to update appointment");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await axios.delete(`/api/appointments/${id}`);
      router.push("/appointments");
    } catch (err) {
      alert("Failed to cancel appointment");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500 font-bold">Retrieving appointment details...</p>
    </div>
  );

  if (error || !appointment) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 mb-4">
        <Calendar className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Not Found</h3>
      <p className="text-gray-400 max-w-md">{error || "The appointment could not be found."}</p>
      <Link 
        href="/appointments"
        className="mt-6 px-6 py-2 bg-[#A855F7] text-white rounded-xl font-bold hover:bg-[#9333EA] transition-all"
      >
        Back to Calendar
      </Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Link 
            href="/appointments" 
            className="inline-flex items-center text-gray-400 hover:text-white font-bold text-sm mb-4 transition-all group"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Calendar
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-4xl font-black tracking-tight text-white">Edit Appointment</h1>
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              appointment.status === 'confirmed' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
              appointment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
              'bg-blue-500/20 text-blue-500 border border-blue-500/30'
            }`}>
              {appointment.status}
            </span>
          </div>
          <p className="text-gray-500 font-medium text-sm mt-2 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2 text-[#A855F7]" />
            Reference ID: {appointment.id}
          </p>
        </div>

        <button
          onClick={handleDelete}
          className="inline-flex items-center px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 font-bold rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/5"
        >
          <Trash2 className="w-5 h-5 mr-2" />
          Cancel Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-[#0D0D0D] p-10 rounded-[40px] border border-[#1A1A1A] shadow-2xl shadow-black/50">
            <AppointmentForm 
              initialData={appointment}
              onSubmit={handleSubmit} 
              onCancel={() => router.push("/appointments")} 
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0D0D0D] p-8 rounded-[40px] border border-[#1A1A1A] shadow-xl">
            <h3 className="text-lg font-black text-white mb-6 tracking-tight">Summary</h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-[#A855F7]/10 rounded-2xl">
                  <User className="w-5 h-5 text-[#A855F7]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</p>
                  <p className="font-bold text-white text-lg">{appointment.customers?.name}</p>
                  <p className="text-xs text-gray-500">{appointment.customers?.phone}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 bg-[#A855F7]/10 rounded-2xl">
                  <Car className="w-5 h-5 text-[#A855F7]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vehicle</p>
                  <p className="font-bold text-white text-lg">{appointment.vehicles?.make} {appointment.vehicles?.model}</p>
                  <p className="text-xs text-gray-500">{appointment.vehicles?.license_plate}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 bg-[#A855F7]/10 rounded-2xl">
                  <Calendar className="w-5 h-5 text-[#A855F7]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scheduled For</p>
                  <p className="font-bold text-white text-lg">{formatDateTime(appointment.scheduled_date)}</p>
                  <p className="text-xs text-gray-500">{appointment.estimated_duration_minutes} minutes estimated</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#A855F7]/5 p-8 rounded-[40px] border border-[#A855F7]/10">
            <h4 className="text-white font-black text-xs uppercase tracking-widest mb-4">Pro Tip</h4>
            <p className="text-gray-400 text-xs leading-relaxed font-medium">
              Updating the status to <span className="text-white">Completed</span> will allow you to generate an invoice directly from this appointment in the next step.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
