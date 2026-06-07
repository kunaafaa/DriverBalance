"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { diagnosticReportSchema } from "@/lib/utils/validation";
import { z } from "zod";
import { DiagnosticReport, Customer, Vehicle } from "@/lib/types";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Plus,
  Trash2,
  FileText,
  User,
  Car,
  Wrench,
  Stethoscope,
  AlertTriangle,
  Activity,
  ClipboardCheck,
  Search,
  Package,
  Gauge,
} from "lucide-react";

type DiagnosticReportFormData = z.infer<typeof diagnosticReportSchema>;

interface DiagnosticReportFormProps {
  initialData?: DiagnosticReport;
  defaultCustomerId?: string;
  defaultVehicleId?: string;
  onSubmit: (data: DiagnosticReportFormData) => Promise<void>;
  onCancel?: () => void;
}

const inputClass = "w-full bg-[#0D0D0D] px-4 py-2 rounded-xl border border-[#1A1A1A] font-bold text-white outline-none focus:ring-2 focus:ring-[#A855F7]";
const textareaClass = "w-full px-4 py-3 bg-[#0D0D0D] rounded-2xl border border-[#1A1A1A] text-sm font-medium text-white outline-none resize-none focus:ring-2 focus:ring-[#A855F7] transition-all";
const rowInputClass = "w-full px-4 py-2 bg-[#111111] border-none rounded-xl text-sm font-medium text-white outline-none focus:bg-[#0D0D0D] focus:ring-2 focus:ring-[#A855F7]";
const addButtonClass = "inline-flex items-center px-4 py-2 bg-[#A855F7]/10 text-white text-xs font-bold rounded-xl hover:bg-[#A855F7] hover:text-white transition-all";
const sectionTitleClass = "text-sm font-black text-white uppercase tracking-tight flex items-center";
const groupBoxClass = "p-6 bg-[#111111] rounded-3xl border border-[#1A1A1A]";
const rowClass = "grid grid-cols-12 gap-3 p-4 bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-right-4 duration-300";

export default function DiagnosticReportForm({ initialData, defaultCustomerId, defaultVehicleId, onSubmit, onCancel }: DiagnosticReportFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DiagnosticReportFormData>({
    resolver: zodResolver(diagnosticReportSchema) as any,
    defaultValues: initialData || {
      report_number: `DM-${Date.now().toString().slice(-6)}`,
      status: "draft",
      customer_id: defaultCustomerId || "",
      vehicle_id: defaultVehicleId || "",
      reported_symptom: "",
      occurs_when: "",
      prior_workshops: "",
      brief: "",
      fault_codes: [{ code: "", description: "" }],
      measurements: [{ parameter: "", measured: "", spec: "", read: "" }],
      root_cause: "",
      required_parts: [{ name: "", part_number: "", price: 0 }],
      labour_hours: 0,
      labour_cost: 0,
      advisory_notes: "",
      before_fuel_trim: "",
      after_fuel_trim: "",
      verification_status: "",
      diagnostic_fee: 0,
      notes: "",
    },
  });

  const faultCodes = useFieldArray({ control, name: "fault_codes" });
  const measurements = useFieldArray({ control, name: "measurements" });
  const requiredParts = useFieldArray({ control, name: "required_parts" });

  const watchedCustomerId = useWatch({ control, name: "customer_id" });
  const watchedStatus = useWatch({ control, name: "status" });
  const isConfirmed = watchedStatus === "confirmed" || watchedStatus === "verified";

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data } = await axios.get("/api/customers?limit=100");
        setCustomers(data.data);
      } catch (error) {
        console.error("Failed to fetch customers", error);
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!watchedCustomerId) {
        setVehicles([]);
        return;
      }
      setLoadingVehicles(true);
      try {
        const { data } = await axios.get(`/api/vehicles?customer_id=${watchedCustomerId}`);
        setVehicles(data);
      } catch (error) {
        console.error("Failed to fetch vehicles", error);
      } finally {
        setLoadingVehicles(false);
      }
    };
    fetchVehicles();
  }, [watchedCustomerId]);

  const customerSelectReg = register("customer_id");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Section 1 — Report Info */}
      <div className="space-y-4">
        <h3 className={sectionTitleClass}>
          <FileText className="w-4 h-4 mr-2 text-[#A855F7]" />
          Report Info
        </h3>
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${groupBoxClass}`}>
          <div className="space-y-2">
            <label className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest">
              <FileText className="w-3 h-3 mr-2 text-[#A855F7]" />
              Report Number
            </label>
            <input
              {...register("report_number")}
              readOnly={!!initialData}
              className={`w-full px-4 py-2 rounded-xl border border-[#1A1A1A] font-bold outline-none focus:ring-2 focus:ring-[#A855F7] ${initialData ? "bg-[#1A1A1A] text-gray-500 cursor-not-allowed" : "bg-[#0D0D0D] text-white"}`}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest">
              <User className="w-3 h-3 mr-2 text-[#A855F7]" />
              Lead Engineer
            </label>
            <input {...register("lead_engineer")} placeholder="e.g. Ahmed Khalil" className={inputClass} />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest">
              <Wrench className="w-3 h-3 mr-2 text-[#A855F7]" />
              Platform
            </label>
            <input {...register("platform")} placeholder="e.g. ISTA, AUTEL, LAUNCH" className={inputClass} />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest">
              <User className="w-3 h-3 mr-2 text-[#A855F7]" />
              Customer
            </label>
            <select
              {...customerSelectReg}
              onChange={(e) => {
                customerSelectReg.onChange(e);
                setValue("vehicle_id", "");
              }}
              disabled={loadingCustomers}
              className={inputClass}
            >
              <option value="">Select a customer...</option>
              {initialData?.customer_id && initialData?.customers && (
                <option value={initialData.customer_id}>
                  {initialData.customers.name} ({initialData.customers.phone})
                </option>
              )}
              {customers.map((c) => {
                if (c.id === initialData?.customer_id) return null;
                return (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                );
              })}
            </select>
            {errors.customer_id && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.customer_id.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest">
              <Car className="w-3 h-3 mr-2 text-[#A855F7]" />
              Vehicle
            </label>
            <select
              {...register("vehicle_id")}
              disabled={!watchedCustomerId || loadingVehicles}
              className={`${inputClass} disabled:opacity-50`}
            >
              <option value="">{watchedCustomerId ? "Choose vehicle..." : "Select customer first"}</option>
              {initialData?.vehicle_id && initialData?.vehicles && !vehicles.some((v) => v.id === initialData.vehicle_id) && (
                <option value={initialData.vehicle_id}>
                  {initialData.vehicles.make} {initialData.vehicles.model} ({initialData.vehicles.license_plate})
                </option>
              )}
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.make} {v.model} ({v.license_plate})</option>
              ))}
            </select>
            {errors.vehicle_id && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.vehicle_id.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest">
              <ClipboardCheck className="w-3 h-3 mr-2 text-[#A855F7]" />
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["draft", "confirmed", "verified"] as const).map((s) => (
                <label
                  key={s}
                  className={`flex items-center justify-center px-3 py-2.5 rounded-xl border cursor-pointer transition-all font-bold text-[10px] uppercase tracking-widest ${
                    watchedStatus === s
                      ? "bg-[#A855F7] border-[#A855F7] text-white shadow-lg"
                      : "bg-[#0D0D0D] border-[#1A1A1A] text-gray-400 hover:border-[#A855F7]"
                  }`}
                >
                  <input {...register("status")} type="radio" value={s} className="hidden" />
                  {s}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 — The Case */}
      <div className="space-y-4">
        <h3 className={sectionTitleClass}>
          <Stethoscope className="w-4 h-4 mr-2 text-[#A855F7]" />
          The Case
        </h3>
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${groupBoxClass}`}>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Reported Symptom</label>
            <textarea {...register("reported_symptom")} rows={2} placeholder="What the customer reported..." className={textareaClass} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Occurs When</label>
            <textarea {...register("occurs_when")} rows={2} placeholder="Cold start, under load, idle..." className={textareaClass} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Prior Workshops</label>
            <textarea {...register("prior_workshops")} rows={2} placeholder="Previous diagnostic attempts..." className={textareaClass} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Brief</label>
            <textarea {...register("brief")} rows={3} placeholder="Summary of the case..." className={textareaClass} />
          </div>
        </div>
      </div>

      {/* Section 3 — Fault Codes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={sectionTitleClass}>
            <AlertTriangle className="w-4 h-4 mr-2 text-[#A855F7]" />
            Fault Codes
          </h3>
          <button type="button" onClick={() => faultCodes.append({ code: "", description: "" })} className={addButtonClass}>
            <Plus className="w-4 h-4 mr-2" />
            Add Code
          </button>
        </div>
        <div className="space-y-3">
          {faultCodes.fields.map((field, index) => (
            <div key={field.id} className={rowClass}>
              <div className="col-span-4 md:col-span-3 space-y-1">
                <input {...register(`fault_codes.${index}.code`)} placeholder="e.g. P0420" className={`${rowInputClass} font-bold`} />
              </div>
              <div className="col-span-7 md:col-span-8 space-y-1">
                <input {...register(`fault_codes.${index}.description`)} placeholder="Description" className={rowInputClass} />
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button type="button" onClick={() => faultCodes.remove(index)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {faultCodes.fields.length === 0 && (
            <div className="py-8 text-center bg-[#111111] rounded-2xl border border-dashed border-[#222222]">
              <p className="text-xs font-bold text-gray-400">No fault codes recorded.</p>
            </div>
          )}
        </div>
      </div>

      {/* Section 4 — Measurements */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={sectionTitleClass}>
            <Activity className="w-4 h-4 mr-2 text-[#A855F7]" />
            Measurements
          </h3>
          <button type="button" onClick={() => measurements.append({ parameter: "", measured: "", spec: "", read: "" })} className={addButtonClass}>
            <Plus className="w-4 h-4 mr-2" />
            Add Measurement
          </button>
        </div>
        <div className="space-y-3">
          {measurements.fields.map((field, index) => (
            <div key={field.id} className={rowClass}>
              <div className="col-span-6 md:col-span-3 space-y-1">
                <input {...register(`measurements.${index}.parameter`)} placeholder="Parameter" className={`${rowInputClass} font-bold`} />
              </div>
              <div className="col-span-6 md:col-span-3 space-y-1">
                <input {...register(`measurements.${index}.measured`)} placeholder="Measured" className={rowInputClass} />
              </div>
              <div className="col-span-6 md:col-span-2 space-y-1">
                <input {...register(`measurements.${index}.spec`)} placeholder="Spec / Expected" className={rowInputClass} />
              </div>
              <div className="col-span-5 md:col-span-3 space-y-1">
                <input {...register(`measurements.${index}.read`)} placeholder="Read" className={rowInputClass} />
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button type="button" onClick={() => measurements.remove(index)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {measurements.fields.length === 0 && (
            <div className="py-8 text-center bg-[#111111] rounded-2xl border border-dashed border-[#222222]">
              <p className="text-xs font-bold text-gray-400">No measurements recorded.</p>
            </div>
          )}
        </div>
      </div>

      {/* Section 5 — Root Cause */}
      <div className="space-y-4">
        <h3 className={sectionTitleClass}>
          <Search className="w-4 h-4 mr-2 text-[#A855F7]" />
          Root Cause
        </h3>
        <div className={`space-y-4 ${groupBoxClass}`}>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Root Cause</label>
            <textarea {...register("root_cause")} rows={4} placeholder="Identified root cause of the fault..." className={textareaClass} />
          </div>
          <div className="flex items-center justify-between p-4 bg-[#0D0D0D] rounded-2xl border border-[#1A1A1A]">
            <div>
              <p className="text-sm font-black text-white">Root Cause Confirmed</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Marks this report as confirmed once verified</p>
            </div>
            <button
              type="button"
              onClick={() => setValue("status", isConfirmed ? "draft" : "confirmed", { shouldDirty: true })}
              className={`relative w-14 h-8 rounded-full transition-all ${isConfirmed ? "bg-[#A855F7]" : "bg-[#1A1A1A]"}`}
            >
              <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${isConfirmed ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Section 6 — Recommended Intervention */}
      <div className="space-y-4">
        <h3 className={sectionTitleClass}>
          <Package className="w-4 h-4 mr-2 text-[#A855F7]" />
          Recommended Intervention
        </h3>

        <div className="flex items-center justify-between">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Required Parts</p>
          <button type="button" onClick={() => requiredParts.append({ name: "", part_number: "", price: 0 })} className={addButtonClass}>
            <Plus className="w-4 h-4 mr-2" />
            Add Part
          </button>
        </div>
        <div className="space-y-3">
          {requiredParts.fields.map((field, index) => (
            <div key={field.id} className={rowClass}>
              <div className="col-span-12 md:col-span-5 space-y-1">
                <input {...register(`required_parts.${index}.name`)} placeholder="Part name" className={rowInputClass} />
              </div>
              <div className="col-span-6 md:col-span-3 space-y-1">
                <input {...register(`required_parts.${index}.part_number`)} placeholder="Part number" className={rowInputClass} />
              </div>
              <div className="col-span-5 md:col-span-3 space-y-1">
                <input {...register(`required_parts.${index}.price`)} type="number" step="0.01" placeholder="Price" className={`${rowInputClass} font-bold`} />
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button type="button" onClick={() => requiredParts.remove(index)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {requiredParts.fields.length === 0 && (
            <div className="py-8 text-center bg-[#111111] rounded-2xl border border-dashed border-[#222222]">
              <p className="text-xs font-bold text-gray-400">No parts required.</p>
            </div>
          )}
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${groupBoxClass}`}>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Labour Hours</label>
            <input {...register("labour_hours")} type="number" step="0.5" className={inputClass} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Labour Cost (AED)</label>
            <input {...register("labour_cost")} type="number" step="0.01" className={inputClass} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Advisory Notes</label>
            <textarea {...register("advisory_notes")} rows={3} placeholder="Recommendations for the customer..." className={textareaClass} />
          </div>
        </div>
      </div>

      {/* Section 7 — Verification */}
      <div className="space-y-4">
        <h3 className={sectionTitleClass}>
          <Gauge className="w-4 h-4 mr-2 text-[#A855F7]" />
          Verification
        </h3>
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${groupBoxClass}`}>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Before Fuel Trim</label>
            <input {...register("before_fuel_trim")} placeholder="e.g. +18% LTFT" className={inputClass} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">After Fuel Trim</label>
            <input {...register("after_fuel_trim")} placeholder="e.g. +2% LTFT" className={inputClass} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Verification Status</label>
            <input {...register("verification_status")} placeholder="e.g. Test drive completed, fault not present" className={inputClass} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Diagnostic Fee (AED)</label>
            <input {...register("diagnostic_fee")} type="number" step="0.01" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#1A1A1A]">
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Internal Notes</label>
          <textarea {...register("notes")} rows={4} placeholder="Internal notes for this report..." className={textareaClass} />
        </div>

        <div className="flex items-end">
          <div className="flex items-center space-x-4 w-full">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-4 rounded-2xl bg-[#111111] text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-4 rounded-2xl bg-[#A855F7] text-white text-xs font-black uppercase tracking-widest hover:bg-purple-900 transition-all shadow-xl shadow-black/20 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : initialData ? "Update Report" : "Create Report"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
