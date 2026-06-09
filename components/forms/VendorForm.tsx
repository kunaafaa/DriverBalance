"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorSchema } from "@/lib/utils/validation";
import { z } from "zod";
import { Vendor } from "@/lib/types";

type VendorFormData = z.infer<typeof vendorSchema>;

interface VendorFormProps {
  initialData?: Vendor;
  onSubmit: (data: VendorFormData) => Promise<void>;
  onCancel?: () => void;
}

export default function VendorForm({ initialData, onSubmit, onCancel }: VendorFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema) as any,
    defaultValues: initialData || { category: "parts" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Vendor Name</label>
          <input
            {...register("name")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. Gulf Auto Parts LLC"
          />
          {errors.name && <p className="text-red-500 text-xs font-medium">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Contact Person</label>
          <input
            {...register("contact_person")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. Rashid Ahmed"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Phone</label>
          <input
            {...register("phone")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. +971 50 123 4567"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Email</label>
          <input
            {...register("email")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. sales@gulfauto.ae"
          />
          {errors.email && <p className="text-red-500 text-xs font-medium">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Category</label>
          <select
            {...register("category")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none bg-[#0D0D0D]"
          >
            <option value="parts">Parts</option>
            <option value="tools">Tools</option>
            <option value="utilities">Utilities</option>
            <option value="services">Services</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Payment Terms</label>
          <input
            {...register("payment_terms")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder='e.g. "Net 30" or "On delivery"'
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Notes</label>
        <textarea
          {...register("notes")}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none resize-none"
          placeholder="Account numbers, delivery quirks, anything useful..."
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
          {isSubmitting ? "Processing..." : initialData ? "Update Vendor" : "Add Vendor"}
        </button>
      </div>
    </form>
  );
}
