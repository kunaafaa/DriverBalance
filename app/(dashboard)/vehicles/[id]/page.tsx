"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Vehicle, Customer, Appointment, Invoice, ServiceHistory } from "@/lib/types";
import { 
  Car, 
  User, 
  Calendar, 
  Settings, 
  Tool, 
  ChevronLeft,
  History,
  Activity,
  Plus,
  ShieldCheck,
  Fuel,
  Hash
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils/formatting";

export default function VehicleProfilePage() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState<(Vehicle & { customers: Customer }) | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vRes, hRes] = await Promise.all([
          axios.get(`/api/vehicles/${id}`),
          axios.get(`/api/vehicles/${id}/history`), // Assuming this endpoint exists or filter by vehicle_id
        ]);
        setVehicle(vRes.data);
        setHistory(hRes.data || []);
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

        {/* History Timeline */}
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-white tracking-tight flex items-center">
                <History className="w-5 h-5 mr-3 text-white" />
                Maintenance History
              </h3>
            </div>
            
            <div className="space-y-6 relative ml-4">
              {/* Vertical Line */}
              <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#1A1A1A] pointer-events-none" />

              {history.map((record, index) => (
                <div key={record.id} className="relative pl-10 animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
                  {/* Timeline Dot */}
                  <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#A855F7] border-4 border-white shadow-sm" />
                  
                  <div className="bg-[#0D0D0D] p-6 rounded-[30px] border border-[#1A1A1A] shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">{formatDate(record.completed_at || record.created_at)}</span>
                          <span className="text-[10px] font-black px-2 py-0.5 bg-green-100 text-green-600 rounded uppercase tracking-widest">Completed</span>
                        </div>
                        <h4 className="text-lg font-black text-white mt-1">{record.service_description}</h4>
                        <p className="text-sm text-gray-500 font-medium mt-1">{record.notes || "Standard maintenance procedure."}</p>
                      </div>
                      <div className="text-left md:text-right shrink-0">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cost</p>
                        <p className="text-lg font-black text-white mt-1">AED {(record.total_cost || 0).toLocaleString()}</p>
                        <Link href={`/invoices/${record.invoice_id}`} className="text-[10px] font-black text-white uppercase tracking-widest hover:underline mt-2 inline-block">View Invoice</Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <div className="relative pl-10">
                  <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gray-200 border-4 border-white shadow-sm" />
                  <div className="bg-[#111111] p-10 rounded-[30px] border border-dashed border-[#222222] text-center">
                    <p className="text-sm font-bold text-gray-400">No maintenance records found for this vehicle.</p>
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
