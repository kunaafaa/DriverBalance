"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Customer, Vehicle, Appointment, Invoice, DiagnosticReport } from "@/lib/types";
import {
  User,
  Phone,
  MapPin,
  Car,
  FileText,
  Plus,
  Edit,
  Clock,
  Trash2,
  Stethoscope
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";

export default function CustomerProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [diagnosticReports, setDiagnosticReports] = useState<DiagnosticReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, vRes, aRes, iRes, dRes] = await Promise.all([
          axios.get(`/api/customers/${id}`),
          axios.get(`/api/vehicles?customer_id=${id}`),
          axios.get(`/api/appointments?customer_id=${id}`),
          axios.get(`/api/invoices?customer_id=${id}`),
          axios.get(`/api/diagnostic-reports?customer_id=${id}`),
        ]);
        setCustomer(cRes.data);
        setVehicles(vRes.data);
        setAppointments(aRes.data);
        setInvoices(iRes.data);
        setDiagnosticReports(dRes.data);
      } catch (error) {
        console.error("Failed to fetch customer data", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this customer? This action will also delete all associated vehicles, appointments, and invoices and cannot be undone.")) return;
    try {
      await axios.delete(`/api/customers/${id}`);
      router.push("/customers");
    } catch (error: any) {
      alert(`Failed to delete customer: ${error.response?.data?.error || error.message}`);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500 font-bold">Synchronizing profile...</p>
    </div>
  );

  if (!customer) return <div>Customer not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-[#A855F7] rounded-[30px] flex items-center justify-center text-white shadow-xl shadow-[#A855F7]/20">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">{customer.name}</h1>
            <p className="text-gray-500 font-bold flex items-center mt-1">
              <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest mr-2">Premium Client</span>
              Customer since {new Date(customer.created_at).getFullYear()}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/customers/${id}/edit`} 
            className="p-3 bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl text-gray-400 hover:text-white hover:border-[#A855F7] transition-all"
            title="Edit Customer"
          >
            <Edit className="w-5 h-5" />
          </Link>
          <button
            onClick={handleDelete}
            className="p-3 bg-[#0D0D0D] border border-red-100 rounded-2xl text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-all"
            title="Delete Customer"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <Link
            href={`/invoices/new?customer_id=${id}`}
            className="px-6 py-3 bg-[#A855F7] text-white font-black text-sm rounded-2xl flex items-center shadow-lg shadow-[#A855F7]/20 hover:bg-[#9333EA] transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Lifetime Value Stats */}
      {(() => {
        const paidInvoices = invoices.filter(i => i.status === "paid");
        const totalSpent = paidInvoices.reduce((acc, i) => acc + i.total, 0);
        const paidCount = paidInvoices.length;
        const lastVisitDate = paidCount > 0
          ? [...paidInvoices].sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())[0].issue_date
          : null;
        const avgInvoice = paidCount > 0 ? totalSpent / paidCount : 0;

        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0D0D0D] p-6 rounded-[30px] border border-[#1A1A1A] shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Spent</p>
              <p className="text-2xl font-black text-[#A855F7] mt-3">{formatCurrency(totalSpent)}</p>
              <p className="text-xs font-bold text-gray-500 mt-1">from paid invoices</p>
            </div>
            <div className="bg-[#0D0D0D] p-6 rounded-[30px] border border-[#1A1A1A] shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Invoices</p>
              <p className="text-2xl font-black text-[#A855F7] mt-3">{invoices.length}</p>
              <p className="text-xs font-bold text-gray-500 mt-1">{paidCount} paid</p>
            </div>
            <div className="bg-[#0D0D0D] p-6 rounded-[30px] border border-[#1A1A1A] shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Last Visit</p>
              <p className="text-2xl font-black text-[#A855F7] mt-3 truncate">
                {lastVisitDate ? formatDate(lastVisitDate) : "—"}
              </p>
              <p className="text-xs font-bold text-gray-500 mt-1">
                {lastVisitDate ? "most recent paid invoice" : "No visits yet"}
              </p>
            </div>
            <div className="bg-[#0D0D0D] p-6 rounded-[30px] border border-[#1A1A1A] shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Avg. Invoice</p>
              <p className="text-2xl font-black text-[#A855F7] mt-3">{formatCurrency(avgInvoice)}</p>
              <p className="text-xs font-bold text-gray-500 mt-1">per paid invoice</p>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact info Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#0D0D0D] p-8 rounded-[35px] border border-[#1A1A1A] shadow-xl shadow-black/50 space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-[#111111] pb-4">Contact Details</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-[#111111] rounded-xl text-white">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Phone</p>
                  <p className="text-sm font-bold text-white mt-1">{customer.phone}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="p-3 bg-[#111111] rounded-xl text-white">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Location</p>
                  <p className="text-sm font-bold text-white mt-1">{customer.city}, UAE</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#111111]">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 leading-none">Internal Notes</p>
              <p className="text-sm text-gray-300 italic bg-[#111111] p-4 rounded-2xl">{customer.notes || "No notes available."}</p>
            </div>
          </div>

          <div className="bg-[#0A0A0A] p-8 rounded-[35px] text-white overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Spend</p>
              <h4 className="text-3xl font-black mt-1">{formatCurrency(invoices.reduce((acc, inv) => acc + (inv.status === 'paid' ? inv.total : 0), 0))}</h4>
              <p className="text-xs font-bold text-slate-400 mt-4 flex items-center">
                <Clock className="w-3 h-3 mr-1 text-[#A855F7]" />
                Includes {invoices.filter(i => i.status === 'paid').length} paid invoices
              </p>
            </div>
            <FileText className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 rotate-12" />
          </div>
        </div>

        {/* Action Tabs / Lists */}
        <div className="lg:col-span-2 space-y-8">
          {/* Vehicles List */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-white tracking-tight flex items-center">
                <Car className="w-5 h-5 mr-3 text-white" />
                Owned Vehicles
              </h3>
              <Link href={`/vehicles/new?customer_id=${id}`} className="text-xs font-black text-white uppercase tracking-widest hover:underline">
                Register New
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.map(vehicle => (
                <Link 
                  key={vehicle.id} 
                  href={`/vehicles/${vehicle.id}`}
                  className="bg-[#0D0D0D] p-6 rounded-[30px] border border-[#1A1A1A] shadow-sm hover:shadow-xl hover:shadow-[#A855F7]/20/20 hover:border-[#A855F7]/50 transition-all flex items-center space-x-6 group"
                >
                  <div className="w-14 h-14 bg-[#111111] rounded-2xl flex items-center justify-center group-hover:bg-[#9333EA]/10 transition-colors">
                    <Car className="w-7 h-7 text-gray-300 group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white leading-tight">{vehicle.make} {vehicle.model}</h4>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{vehicle.license_plate}</p>
                    <p className="text-[10px] text-white font-bold mt-2 uppercase tracking-wide">{vehicle.year} • {vehicle.engine_type}</p>
                  </div>
                </Link>
              ))}
              {vehicles.length === 0 && (
                <div className="col-span-2 py-10 text-center bg-[#111111] rounded-[30px] border border-dashed border-[#222222]">
                  <p className="text-sm font-bold text-gray-400">No vehicles registered for this client.</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-white tracking-tight flex items-center">
                <Clock className="w-5 h-5 mr-3 text-white" />
                Recent Activity
              </h3>
            </div>
            <div className="bg-[#0D0D0D] rounded-[35px] border border-[#1A1A1A] shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {invoices.slice(0, 5).map(invoice => (
                  <div key={invoice.id} className="p-6 flex items-center justify-between hover:bg-[#111111]/50 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-[#A855F7]/10 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Invoice {invoice.invoice_number}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatDate(invoice.issue_date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white">{formatCurrency(invoice.total)}</p>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))}
                {invoices.length === 0 && (
                  <div className="p-10 text-center text-gray-400 font-bold text-sm">No activity history found.</div>
                )}
              </div>
            </div>
          </section>

          {/* Diagnostic Reports */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-white tracking-tight flex items-center">
                <Stethoscope className="w-5 h-5 mr-3 text-white" />
                Diagnostic Reports
              </h3>
              <Link href={`/diagnostic-reports/new?customer_id=${id}`} className="text-xs font-black text-white uppercase tracking-widest hover:underline">
                New Report
              </Link>
            </div>
            <div className="bg-[#0D0D0D] rounded-[35px] border border-[#1A1A1A] shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {diagnosticReports.slice(0, 5).map(report => (
                  <Link
                    key={report.id}
                    href={`/diagnostic-reports/${report.id}`}
                    className="p-6 flex items-center justify-between hover:bg-[#111111]/50 transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-[#A855F7]/10 rounded-xl flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Report {report.report_number}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatDate(report.created_at)}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                      report.status === 'verified' ? 'bg-green-100 text-green-600' :
                      report.status === 'confirmed' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {report.status}
                    </span>
                  </Link>
                ))}
                {diagnosticReports.length === 0 && (
                  <div className="p-10 text-center text-gray-400 font-bold text-sm">No diagnostic reports found.</div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
