"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Appointment } from "@/lib/types";

interface CalendarViewProps {
  appointments: (Appointment & { customers?: { name: string }, vehicles?: { make: string, model: string, license_plate: string } })[];
  onEventClick: (id: string) => void;
  onDateClick: (date: Date) => void;
  onEventDrop: (id: string, newDate: Date) => void;
}

const statusColors: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#000000",
  in_progress: "#10B981",
  completed: "#64748B",
  cancelled: "#EF4444",
};

export default function CalendarView({ 
  appointments, 
  onEventClick, 
  onDateClick,
  onEventDrop 
}: CalendarViewProps) {
  
  const events = appointments.map((app) => ({
    id: app.id,
    title: `${app.customers?.name} - ${app.vehicles?.license_plate}`,
    start: app.scheduled_date,
    end: new Date(new Date(app.scheduled_date).getTime() + app.estimated_duration_minutes * 60000).toISOString(),
    backgroundColor: statusColors[app.status] || "#000000",
    extendedProps: { ...app }
  }));

  return (
    <div className="bg-[#0D0D0D] p-6 rounded-3xl border border-[#1A1A1A] shadow-xl shadow-gray-200/30">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        dateClick={(info) => onDateClick(info.date)}
        eventClick={(info) => onEventClick(info.event.id)}
        eventDrop={(info) => {
          if (info.event.start) {
            onEventDrop(info.event.id, info.event.start);
          }
        }}
        height="700px"
      />
    </div>
  );
}
