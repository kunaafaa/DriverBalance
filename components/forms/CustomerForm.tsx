"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema } from "@/lib/utils/validation";
import { z } from "zod";
import { Customer } from "@/lib/types";

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onCancel?: () => void;
}

export default function CustomerForm({ initialData, onSubmit, onCancel }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      city: "Abu Dhabi",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Full Name</label>
          <input
            {...register("name")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. Ahmad Khan"
          />
          {errors.name && <p className="text-red-500 text-xs font-medium">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Email Address</label>
          <input
            {...register("email")}
            type="email"
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. ahmad@example.com"
          />
          {errors.email && <p className="text-red-500 text-xs font-medium">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Phone Number</label>
          <input
            {...register("phone")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. 03001234567"
          />
          {errors.phone && <p className="text-red-500 text-xs font-medium">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">City</label>
          <input
            {...register("city")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. Rawalpindi"
          />
          {errors.city && <p className="text-red-500 text-xs font-medium">{errors.city.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Residential Address</label>
        <textarea
          {...register("address")}
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none resize-none"
          placeholder="e.g. House #1, Street #1, Bahria Town Phase 7"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Internal Notes</label>
        <textarea
          {...register("notes")}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none resize-none"
          placeholder="Add any specific details about the customer..."
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
          {isSubmitting ? "Processing..." : initialData ? "Update Customer" : "Create Customer"}
        </button>
      </div>
    </form>
  );
}
