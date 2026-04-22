"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema } from "@/lib/utils/validation";
import { z } from "zod";
import { Appointment, Customer, Vehicle, ServiceType } from "@/lib/types";
import { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, User, Car, Wrench, Clock, ChevronRight } from "lucide-react";

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  initialData?: Appointment;
  onSubmit: (data: AppointmentFormData) => Promise<void>;
  onCancel?: () => void;
  defaultDate?: string;
}

export default function AppointmentForm({ initialData, onSubmit, onCancel, defaultDate }: AppointmentFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema) as any,
    defaultValues: (initialData as any) || {
      scheduled_date: defaultDate || new Date().toISOString().slice(0, 16),
      estimated_duration_minutes: 60,
      services: [],
    },
  });

  const watchedCustomerId = useWatch({
    control,
    name: "customer_id",
  });

  const watchedServices = useWatch({
    control,
    name: "services",
  }) || [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          axios.get("/api/customers?limit=100"),
          axios.get("/api/service-types"),
        ]);
        setCustomers(cRes.data.data);
        setServices(sRes.data);
      } catch (error) {
        console.error("Failed to fetch form data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!watchedCustomerId) {
        setVehicles([]);
        return;
      }
      try {
        const { data } = await axios.get(`/api/vehicles?customer_id=${watchedCustomerId}`);
        setVehicles(data);
      } catch (error) {
        console.error("Failed to fetch vehicles", error);
      }
    };
    fetchVehicles();
  }, [watchedCustomerId]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Customer & Vehicle */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest leading-none">
              <User className="w-3 h-3 mr-2 text-white" />
              Select Customer
            </label>
            <select
              {...register("customer_id")}
              className="w-full px-5 py-4 bg-[#111111] border-none rounded-[20px] font-bold text-white outline-none focus:ring-2 focus:ring-[#A855F7] transition-all appearance-none"
            >
              <option value="">Search customer profile...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
            {errors.customer_id && <p className="text-red-500 text-[10px] font-bold">{errors.customer_id.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest leading-none">
              <Car className="w-3 h-3 mr-2 text-white" />
              Select Vehicle
            </label>
            <select
              {...register("vehicle_id")}
              disabled={!watchedCustomerId}
              className="w-full px-5 py-4 bg-[#111111] border-none rounded-[20px] font-bold text-white outline-none focus:ring-2 focus:ring-[#A855F7] transition-all appearance-none disabled:opacity-50"
            >
              <option value="">{watchedCustomerId ? "Choose vehicle..." : "Select customer first"}</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.make} {v.model} ({v.license_plate})</option>
              ))}
            </select>
            {errors.vehicle_id && <p className="text-red-500 text-[10px] font-bold">{errors.vehicle_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest leading-none">
                <Calendar className="w-3 h-3 mr-2 text-white" />
                Date & Time
              </label>
              <input
                {...register("scheduled_date")}
                type="datetime-local"
                className="w-full px-5 py-4 bg-[#111111] border-none rounded-[20px] font-bold text-white outline-none focus:ring-2 focus:ring-[#A855F7] transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest leading-none">
                <Clock className="w-3 h-3 mr-2 text-white" />
                Duration (Min)
              </label>
              <input
                {...register("estimated_duration_minutes")}
                type="number"
                step="15"
                className="w-full px-5 py-4 bg-[#111111] border-none rounded-[20px] font-bold text-white outline-none focus:ring-2 focus:ring-[#A855F7] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Services */}
        <div className="space-y-6">
          <label className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest leading-none">
            <Wrench className="w-3 h-3 mr-2 text-white" />
            Service Packages
          </label>
          <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {[...services]
              .sort((a, b) => {
                const aOther = a.name.toLowerCase().includes("other");
                const bOther = b.name.toLowerCase().includes("other");
                if (aOther && !bOther) return 1;
                if (!aOther && bOther) return -1;
                return a.name.localeCompare(b.name);
              })
              .map((service) => {
                const isSelected = watchedServices.includes(service.id);
                return (
                  <label 
                    key={service.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all group ${
                      isSelected 
                        ? "bg-[#A855F7] border-[#A855F7] text-white shadow-lg shadow-[#A855F7]/20" 
                        : "bg-[#0D0D0D] border-[#1A1A1A] hover:border-[#A855F7]/50"
                    }`}
                  >
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        value={service.id} 
                        {...register("services")} 
                        className="hidden" 
                      />
                      <div>
                        <p className="text-sm font-black leading-none">{service.name}</p>
                        <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${
                          isSelected ? "text-blue-200" : "text-gray-400"
                        }`}>
                          {service.base_price > 0 ? `AED ${service.base_price}` : "Custom Price"} • {service.estimated_duration_minutes}m
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                      isSelected ? "text-white" : "text-gray-200"
                    }`} />
                  </label>
                );
              })}
            {services.length === 0 && (
              <div className="py-10 text-center bg-[#111111] rounded-2xl border border-dashed border-[#222222] text-gray-400 text-xs font-bold">
                No service packages defined.
              </div>
            )}
          </div>
          {errors.services && <p className="text-red-500 text-[10px] font-bold">{errors.services.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest leading-none">
          Technician Notes
        </label>
        <textarea
          {...register("notes")}
          rows={3}
          placeholder="Specify customer requests or vehicle complaints..."
          className="w-full px-6 py-4 bg-[#111111] border-none rounded-[25px] font-medium text-white placeholder:text-gray-600 outline-none focus:bg-[#0D0D0D] focus:ring-2 focus:ring-[#A855F7] transition-all resize-none"
        />
      </div>

      <div className="flex items-center justify-end space-x-4 pt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-4 rounded-2xl text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-[#1A1A1A] transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-12 py-4 rounded-2xl bg-[#A855F7] text-white font-black text-xs uppercase tracking-widest hover:bg-[#9333EA] disabled:bg-blue-300 transition-all shadow-xl shadow-[#A855F7]/20"
        >
          {isSubmitting ? "Scheduling..." : initialData ? "Update Booking" : "Confirm Appointment"}
        </button>
      </div>
    </form>
  );
}
