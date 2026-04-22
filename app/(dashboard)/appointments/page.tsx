"use client";

import { useEffect, useState } from "react";
import CalendarView from "@/components/appointments/CalendarView";
import { Appointment } from "@/lib/types";
import { Plus, List, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  const fetchAppointments = async (isMounted = true) => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/appointments");
      if (isMounted) setAppointments(data);
    } catch (error) {
      console.error("Failed to fetch appointments", error);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchAppointments(isMounted);
    return () => { isMounted = false; };
  }, []);

  const handleEventDrop = async (id: string, newDate: Date) => {
    try {
      await axios.patch(`/api/appointments/${id}`, {
        scheduled_date: newDate.toISOString(),
      });
      fetchAppointments();
    } catch (error) {
      alert("Failed to reschedule appointment");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Appointments</h1>
          <p className="text-gray-500 font-medium">Schedule and manage vehicle services efficiently.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-[#0D0D0D] p-1 rounded-2xl border border-[#1A1A1A] shadow-sm flex">
            <button 
              onClick={() => setViewMode("calendar")}
              className={`p-2 rounded-xl transition-all ${viewMode === "calendar" ? "bg-[#A855F7] text-white shadow-lg shadow-[#A855F7]/20" : "text-gray-400 hover:text-white"}`}
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-xl transition-all ${viewMode === "list" ? "bg-[#A855F7] text-white shadow-lg shadow-[#A855F7]/20" : "text-gray-400 hover:text-white"}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <Link
            href="/appointments/new"
            className="inline-flex items-center px-6 py-3 bg-[#A855F7] text-white font-bold rounded-2xl hover:bg-[#9333EA] transition-all shadow-lg shadow-[#A855F7]/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Appointment
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#0D0D0D] rounded-3xl p-20 flex flex-col items-center justify-center border border-[#1A1A1A] shadow-sm">
          <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-bold">Synchronizing calendar...</p>
        </div>
      ) : viewMode === "calendar" ? (
        <CalendarView
          appointments={appointments}
          onEventClick={(id) => router.push(`/appointments/${id}`)}
          onDateClick={(date) => router.push(`/appointments/new?date=${date.toISOString()}`)}
          onEventDrop={handleEventDrop}
        />
      ) : (
        <div className="bg-[#0D0D0D] p-20 text-center rounded-3xl border border-[#111111] shadow-sm">
          <List className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-gray-500 font-bold">List View coming soon</h3>
          <p className="text-gray-400 text-sm">Use the calendar view for now.</p>
        </div>
      )}
    </div>
  );
}
