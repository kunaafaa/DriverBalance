"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehicleSchema } from "@/lib/utils/validation";
import { z } from "zod";
import { Vehicle, Customer } from "@/lib/types";

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  initialData?: Vehicle;
  customers: Customer[];
  onSubmit: (data: VehicleFormData) => Promise<void>;
  onCancel?: () => void;
}

export default function VehicleForm({ initialData, customers, onSubmit, onCancel }: VehicleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: initialData || {
      engine_type: "Petrol",
      mileage_at_registration: 0,
      current_mileage: 0,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Owner / Customer</label>
          <select
            {...register("customer_id")}
            disabled={!!initialData}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none bg-[#0D0D0D] disabled:bg-[#111111] disabled:cursor-not-allowed"
          >
            <option value="">Select a customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
          {errors.customer_id && <p className="text-red-500 text-xs font-medium">{errors.customer_id.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">License Plate</label>
          <input
            {...register("license_plate")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none uppercase font-mono"
            placeholder="e.g. ABC-123"
          />
          {errors.license_plate && <p className="text-red-500 text-xs font-medium">{errors.license_plate.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Make</label>
          <input
            {...register("make")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. Toyota"
          />
          {errors.make && <p className="text-red-500 text-xs font-medium">{errors.make.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Model</label>
          <input
            {...register("model")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. Corolla"
          />
          {errors.model && <p className="text-red-500 text-xs font-medium">{errors.model.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Manufacturing Year</label>
          <input
            {...register("year")}
            type="number"
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. 2022"
          />
          {errors.year && <p className="text-red-500 text-xs font-medium">{errors.year.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">VIN (Vehicle ID Number)</label>
          <input
            {...register("vin")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none uppercase font-mono"
            placeholder="17 character VIN"
          />
          {errors.vin && <p className="text-red-500 text-xs font-medium">{errors.vin.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Engine Type</label>
          <select
            {...register("engine_type")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none bg-[#0D0D0D]"
          >
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Current Mileage (km)</label>
          <input
            {...register("current_mileage")}
            type="number"
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. 45000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Vehicle Notes / Specs</label>
        <textarea
          {...register("notes")}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none resize-none"
          placeholder="Add any specific modifications or known issues..."
        />
      </div>

      <div className="flex items-center justify-end space-x-4 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-xl text-gray-600 font-semibold hover:bg-[#1A1A1A] transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 rounded-xl bg-[#A855F7] text-white font-bold hover:bg-[#9333EA] disabled:bg-blue-300 transition-all shadow-lg shadow-[#A855F7]/20"
        >
          {isSubmitting ? "Saving..." : initialData ? "Update Vehicle" : "Add Vehicle"}
        </button>
      </div>
    </form>
  );
}
