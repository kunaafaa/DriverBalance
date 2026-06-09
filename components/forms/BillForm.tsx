"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { billSchema } from "@/lib/utils/validation";
import { z } from "zod";
import { Bill, Vendor } from "@/lib/types";
import axios from "axios";

type BillFormData = z.infer<typeof billSchema>;

interface BillFormProps {
  initialData?: Bill;
  onSubmit: (data: BillFormData) => Promise<void>;
  onCancel?: () => void;
}

const CATEGORIES = [
  "rent", "salaries", "cogs_parts", "tools", "marketing",
  "utilities", "subscriptions", "bank_fees", "other",
];

export default function BillForm({ initialData, onSubmit, onCancel }: BillFormProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BillFormData>({
    resolver: zodResolver(billSchema) as any,
    defaultValues: initialData
      ? {
          ...initialData,
          bill_date: initialData.bill_date?.split("T")[0],
          due_date: initialData.due_date?.split("T")[0] ?? "",
          vendor_id: initialData.vendor_id ?? "",
        }
      : {
          bill_date: new Date().toISOString().split("T")[0],
          category: "cogs_parts",
          amount: 0,
          vat_amount: 0,
        },
  });

  const watchedAmount = watch("amount");
  const isFirstRender = useRef(true);

  // Auto-calculate VAT (5%) when amount changes, skip initial render to
  // avoid overwriting the saved vat_amount when editing an existing bill.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const numAmt = Number(watchedAmount);
    setValue("vat_amount", Math.round(numAmt * 0.05 * 100) / 100, { shouldValidate: false });
  }, [watchedAmount, setValue]);

  useEffect(() => {
    axios
      .get("/api/vendors")
      .then(({ data }) => setVendors(data))
      .catch((err) => console.error("Failed to fetch vendors", err));
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Vendor</label>
          <select
            {...register("vendor_id")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none bg-[#0D0D0D]"
          >
            <option value="">Select a vendor...</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          {errors.vendor_id && <p className="text-red-500 text-xs font-medium">{errors.vendor_id.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Bill Number</label>
          <input
            {...register("bill_number")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. INV-99213"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Bill Date</label>
          <input
            {...register("bill_date")}
            type="date"
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
          />
          {errors.bill_date && <p className="text-red-500 text-xs font-medium">{errors.bill_date.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Due Date</label>
          <input
            {...register("due_date")}
            type="date"
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Category</label>
          <select
            {...register("category")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none bg-[#0D0D0D]"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Amount (AED) — total incl. VAT</label>
          <input
            {...register("amount")}
            type="number"
            step="0.01"
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="0.00"
          />
          {errors.amount && <p className="text-red-500 text-xs font-medium">{errors.amount.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">VAT Amount (AED)</label>
          <input
            {...register("vat_amount")}
            type="number"
            step="0.01"
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="0.00"
          />
          <p className="text-[10px] text-gray-400 font-medium italic">Auto-calculated at 5% — override if needed.</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Notes</label>
        <textarea
          {...register("notes")}
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none resize-none"
          placeholder="What is this bill for?"
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
          {isSubmitting ? "Processing..." : initialData ? "Update Bill" : "Add Bill"}
        </button>
      </div>
    </form>
  );
}
