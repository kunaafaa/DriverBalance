"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema } from "@/lib/utils/validation";
import { z } from "zod";
import { Expense } from "@/lib/types";
import axios from "axios";
import { Upload, FileCheck2, Loader2 } from "lucide-react";

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  initialData?: Expense;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel?: () => void;
}

const CATEGORIES: { value: string; label: string }[] = [
  { value: "rent", label: "Rent" },
  { value: "salaries", label: "Salaries" },
  { value: "cogs_parts", label: "Cost of Goods (Parts)" },
  { value: "tools", label: "Tools" },
  { value: "marketing", label: "Marketing" },
  { value: "utilities", label: "Utilities" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "bank_fees", label: "Bank Fees" },
  { value: "other", label: "Other" },
];

export default function ExpenseForm({ initialData, onSubmit, onCancel }: ExpenseFormProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: initialData
      ? {
          ...initialData,
          expense_date: initialData.expense_date?.split("T")[0],
        }
      : {
          expense_date: new Date().toISOString().split("T")[0],
          category: "other",
          amount: 0,
          vat_amount: 0,
          payment_method: "cash",
        },
  });

  const receiptUrl = watch("receipt_url");
  const watchedAmount = watch("amount");
  const isFirstRender = useRef(true);

  // Auto-calculate VAT (5%) when amount changes, skip initial render to
  // avoid overwriting the saved vat_amount when editing an existing expense.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const numAmt = Number(watchedAmount);
    setValue("vat_amount", Math.round(numAmt * 0.05 * 100) / 100, { shouldValidate: false });
  }, [watchedAmount, setValue]);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await axios.post<{ url: string }>("/api/expenses/upload-receipt", formData);
      setValue("receipt_url", data.url, { shouldValidate: true });
    } catch (err: any) {
      console.error("Receipt upload failed", err);
      const msg = err.response?.data?.error || "Upload failed";
      setUploadError(`${msg} — expense will be saved without receipt.`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Expense Date</label>
          <input
            {...register("expense_date")}
            type="date"
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
          />
          {errors.expense_date && <p className="text-red-500 text-xs font-medium">{errors.expense_date.message}</p>}
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
          <label className="text-sm font-semibold text-gray-700">Category</label>
          <select
            {...register("category")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none bg-[#0D0D0D]"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-xs font-medium">{errors.category.message}</p>}
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
          {errors.vat_amount && <p className="text-red-500 text-xs font-medium">{errors.vat_amount.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Vendor / Paid To</label>
          <input
            {...register("vendor")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. Al Futtaim Motors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Payment Method</label>
          <select
            {...register("payment_method")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none bg-[#0D0D0D]"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Notes</label>
        <textarea
          {...register("notes")}
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none resize-none"
          placeholder="Anything worth remembering about this expense..."
        />
      </div>

      {/* Receipt capture */}
      <div className="space-y-2 pt-4 border-t border-[#111111]">
        <label className="text-sm font-semibold text-gray-700">Receipt</label>
        <input type="hidden" {...register("receipt_url")} />
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center px-5 py-3 rounded-xl bg-[#A855F7]/10 text-white font-bold text-sm cursor-pointer hover:bg-[#A855F7] transition-all">
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? "Uploading..." : "Upload Receipt"}
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleReceiptUpload} disabled={uploading} />
          </label>
          {receiptUrl && (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-green-500 font-bold text-sm hover:underline"
            >
              <FileCheck2 className="w-4 h-4 mr-2" />
              Receipt attached — view
            </a>
          )}
        </div>
        {uploadError && <p className="text-red-500 text-xs font-medium">{uploadError}</p>}
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
          disabled={isSubmitting || uploading}
          className="px-8 py-3 rounded-xl bg-[#A855F7] text-white font-bold hover:bg-[#9333EA] disabled:bg-blue-300 transition-all shadow-lg shadow-[#A855F7]/20"
        >
          {isSubmitting ? "Processing..." : initialData ? "Update Expense" : "Log Expense"}
        </button>
      </div>
    </form>
  );
}
