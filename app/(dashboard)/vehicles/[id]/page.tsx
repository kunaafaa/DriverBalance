"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Vehicle, Customer, Appointment, Invoice, ServiceHistory, DiagnosticReport } from "@/lib/types";
import {
  Car,
  User,
  Calendar,
  ChevronLeft,
  History,
  Activity,
  Plus,
  ShieldCheck,
  Fuel,
  Hash,
  Stethoscope,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";

type TimelineEntry =
  | { kind: "invoice"; date: string; data: Invoice }
  | { kind: "diagnostic"; date: string; data: DiagnosticReport }
  | { kind: "appointment"; date: string; data: Appointment };

const diagStatusClass = (status: string) =>
  status === "verified" ? "bg-green-100 text-green-600" :
  status === "confirmed" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600";

const apptStatusClass = (status: string): string =>
  ({
    pending: "bg-yellow-100 text-yellow-600",
    confirmed: "bg-blue-100 text-blue-600",
    in_progress: "bg-[#A855F7]/10 text-[#A855F7]",
    completed: "bg-green-100 text-green-600",
    cancelled: "bg-red-100 text-red-600",
  } as Record<string, string>)[status] ?? "bg-gray-100 text-gray-600";

const invStatusClass = (status: string): string =>
  ({
    paid: "bg-green-100 text-green-600",
    issued: "bg-yellow-100 text-yellow-600",
    overdue: "bg-red-100 text-red-600",
    draft: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-600",
  } as Record<string, string>)[status] ?? "bg-gray-100 text-gray-600";

export default function VehicleProfilePage() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState<(Vehicle & { customers: Customer }) | null>(null);
  const [diagnosticReports, setDiagnosticReports] = useState<DiagnosticReport[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vehicle first — the license plate is needed to match invoices,
        // since the invoices table has no vehicle_id foreign key.
        const vRes = await axios.get(`/api/vehicles/${id}`);
        const vehicleData = vRes.data;
        setVehicle(vehicleData);

        const [dRes, aRes, iRes] = await Promise.all([
          axios.get(`/api/diagnostic-reports?vehicle_id=${id}`),
          axios.get(`/api/appointments?vehicle_id=${id}`),
          axios.get(`/api/invoices?license_plate=${encodeURIComponent(vehicleData.license_plate)}`),
        ]);
        setDiagnosticReports(dRes.data || []);
        setAppointments(aRes.data || []);
        setInvoices(iRes.data || []);
      } catch (error) {
        console.error("Failed to fetch vehicle data", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500 font-bold">Scanning vehicle sensors...</p>
    </div>
  );

  if (!vehicle) return <div>Vehicle not found</div>;

  const timeline: TimelineEntry[] = [
    ...invoices.map(i => ({ kind: "invoice" as const, date: i.issue_date, data: i })),
    ...diagnosticReports.map(d => ({ kind: "diagnostic" as const, date: d.created_at, data: d })),
    ...appointments.map(a => ({ kind: "appointment" as const, date: a.scheduled_date, data: a })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-[#0A0A0A] rounded-[30px] flex items-center justify-center text-white shadow-xl shadow-gray-200">
            <Car className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white leading-none">{vehicle.make} {vehicle.model}</h1>
            <p className="text-gray-500 font-bold flex items-center mt-2">
              <span className="bg-purple-100 text-white px-2 py-0.5 rounded text-[10px] uppercase tracking-widest mr-2">Registered</span>
              License Plate: <span className="text-white ml-1">{vehicle.license_plate}</span>
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/appointments/new?vehicle_id=${id}`}
            className="px-6 py-3 bg-[#0D0D0D] border border-[#1A1A1A] text-white font-black text-sm rounded-2xl flex items-center shadow-sm hover:border-[#A855F7] transition-all"
          >
            <Calendar className="w-4 h-4 mr-2 text-white" />
            Book Service
          </Link>
          <Link
            href={`/invoices/new?vehicle_id=${id}&customer_id=${vehicle.customer_id}`}
            className="px-6 py-3 bg-[#A855F7] text-white font-black text-sm rounded-2xl flex items-center shadow-lg shadow-[#A855F7]/20 hover:bg-[#9333EA] transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Quick Invoice
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Specs Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#0D0D0D] p-8 rounded-[35px] border border-[#1A1A1A] shadow-xl shadow-black/50 space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-[#111111] pb-4">Vehicle Specification</h3>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Year</p>
                <p className="text-sm font-bold text-white mt-1">{vehicle.year}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Color</p>
                <div className="flex items-center mt-1">
                   <div
                    className="w-3 h-3 rounded-full mr-2 border border-[#1A1A1A]"
                    style={{backgroundColor: vehicle.color?.toLowerCase() || 'gray'}}
                   />
                   <p className="text-sm font-bold text-white">{vehicle.color || "N/A"}</p>
                </div>
              </div>
              <div className="space-y-1 col-span-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">VIN Number</p>
                <p className="text-sm font-mono font-bold text-white mt-1 uppercase tracking-wider">{vehicle.vin}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Engine</p>
                <div className="flex items-center mt-1 text-white">
                  <Fuel className="w-3 h-3 mr-1 text-[#A855F7]" />
                  <p className="text-sm font-bold">{vehicle.engine_type}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Mileage</p>
                <div className="flex items-center mt-1 text-white">
                  <Activity className="w-3 h-3 mr-1 text-[#A855F7]" />
                  <p className="text-sm font-bold">{vehicle.current_mileage?.toLocaleString()} KM</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#111111] space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Owner Dashboard</p>
              <Link
                href={`/customers/${vehicle.customer_id}`}
                className="flex items-center p-4 bg-[#111111] rounded-2xl border border-[#1A1A1A] hover:border-[#A855F7] transition-all group"
              >
                <div className="w-10 h-10 bg-[#0D0D0D] rounded-xl flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-black text-white leading-none">{vehicle.customers?.name}</p>
                  <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">View Profile</p>
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-[#A855F7] p-8 rounded-[35px] text-white space-y-4 shadow-xl shadow-[#A855F7]/20">
            <ShieldCheck className="w-8 h-8 text-blue-200" />
            <div>
              <h4 className="text-lg font-black tracking-tight leading-none">Service Status</h4>
              <p className="text-xs font-medium text-purple-100 mt-2">Next service due in approximately 2,400 KM based on current usage patterns.</p>
            </div>
          </div>
        </div>

        {/* Service History Timeline */}
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-white tracking-tight flex items-center">
                <History className="w-5 h-5 mr-3 text-white" />
                Service History
              </h3>
              <Link
                href={`/diagnostic-reports/new?vehicle_id=${id}&customer_id=${vehicle.customer_id}`}
                className="text-xs font-black text-white uppercase tracking-widest hover:underline"
              >
                New Report
              </Link>
            </div>

            <div className="space-y-6 relative ml-4">
              {/* Vertical line */}
              <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#1A1A1A] pointer-events-none" />

              {timeline.map((item) => {
                const dotColor =
                  item.kind === "invoice" ? "bg-[#A855F7]" :
                  item.kind === "diagnostic" ? "bg-blue-500" : "bg-gray-400";

                return (
                  <div
                    key={`${item.kind}-${item.data.id}`}
                    className="relative pl-10 animate-in fade-in slide-in-from-left-4 duration-500"
                  >
                    <div className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full ${dotColor} border-4 border-white shadow-sm`} />

                    {item.kind === "invoice" ? (
                      <Link href={`/invoices/${item.data.id}`}>
                        <div className="bg-[#0D0D0D] p-6 rounded-[30px] border border-[#1A1A1A] shadow-sm hover:shadow-md transition-all">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center space-x-2">
                                <FileText className="w-3.5 h-3.5 text-[#A855F7]" />
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">
                                  {formatDate(item.data.issue_date)}
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${invStatusClass(item.data.status)}`}>
                                  {item.data.status}
                                </span>
                              </div>
                              <h4 className="text-base font-black text-white mt-1">Invoice {item.data.invoice_number}</h4>
                              {(item.data as any).invoice_items?.[0]?.description && (
                                <p className="text-sm text-gray-500 font-medium mt-1">
                                  {(item.data as any).invoice_items[0].description}
                                </p>
                              )}
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-base font-black text-white">{formatCurrency(item.data.total)}</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ) : item.kind === "diagnostic" ? (
                      <Link href={`/diagnostic-reports/${item.data.id}`}>
                        <div className="bg-[#0D0D0D] p-6 rounded-[30px] border border-[#1A1A1A] shadow-sm hover:shadow-md transition-all">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center space-x-2">
                                <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">
                                  {formatDate(item.data.created_at)}
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${diagStatusClass(item.data.status)}`}>
                                  {item.data.status}
                                </span>
                              </div>
                              <h4 className="text-base font-black text-white mt-1">Report {item.data.report_number}</h4>
                              {item.data.root_cause && (
                                <p className="text-sm text-gray-500 font-medium mt-1">
                                  {item.data.root_cause.length > 60
                                    ? item.data.root_cause.slice(0, 60) + "…"
                                    : item.data.root_cause}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <Link href={`/appointments/${item.data.id}`}>
                        <div className="bg-[#0D0D0D] p-6 rounded-[30px] border border-[#1A1A1A] shadow-sm hover:shadow-md transition-all">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">
                                  {formatDate(item.data.scheduled_date)}
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${apptStatusClass(item.data.status)}`}>
                                  {item.data.status.replace("_", " ")}
                                </span>
                              </div>
                              <h4 className="text-base font-black text-white mt-1">Appointment</h4>
                              {item.data.technician_assigned && (
                                <p className="text-sm text-gray-500 font-medium mt-1">Technician: {item.data.technician_assigned}</p>
                              )}
                              {item.data.notes && (
                                <p className="text-sm text-gray-500 font-medium mt-0.5">{item.data.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                );
              })}

              {timeline.length === 0 && (
                <div className="relative pl-10">
                  <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gray-200 border-4 border-white shadow-sm" />
                  <div className="bg-[#111111] p-10 rounded-[30px] border border-dashed border-[#222222] text-center">
                    <p className="text-sm font-bold text-gray-400">No service history yet.</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
