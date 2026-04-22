"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inventorySchema } from "@/lib/utils/validation";
import { z } from "zod";
import { Part } from "@/lib/types";

type InventoryFormData = z.infer<typeof inventorySchema>;

interface InventoryFormProps {
  initialData?: Part;
  onSubmit: (data: InventoryFormData) => Promise<void>;
  onCancel?: () => void;
}

export default function InventoryForm({ initialData, onSubmit, onCancel }: InventoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema) as any,
    defaultValues: initialData || {
      category: "Parts",
      quantity_in_stock: 0,
      reorder_level: 5,
      unit_price: 0,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Part Name</label>
          <input
            {...register("name")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. Brake Pads (Front)"
          />
          {errors.name && <p className="text-red-500 text-xs font-medium">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">SKU / Part Number</label>
          <input
            {...register("sku")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. BK-001"
          />
          {errors.sku && <p className="text-red-500 text-xs font-medium">{errors.sku.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Category</label>
          <select
            {...register("category")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none bg-[#0D0D0D]"
          >
            <option value="Engine">Engine</option>
            <option value="Brakes">Brakes</option>
            <option value="Suspension">Suspension</option>
            <option value="Electrical">Electrical</option>
            <option value="Body">Body</option>
            <option value="Lubricants">Lubricants</option>
            <option value="Filters">Filters</option>
            <option value="Other">Other</option>
          </select>
          {errors.category && <p className="text-red-500 text-xs font-medium">{errors.category.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Unit Price (AED)</label>
          <input
            {...register("unit_price")}
            type="number"
            step="0.01"
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="0.00"
          />
          {errors.unit_price && <p className="text-red-500 text-xs font-medium">{errors.unit_price.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Initial Quantity</label>
          <input
            {...register("quantity_in_stock")}
            type="number"
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="0"
          />
          {errors.quantity_in_stock && <p className="text-red-500 text-xs font-medium">{errors.quantity_in_stock.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Reorder Level</label>
          <input
            {...register("reorder_level")}
            type="number"
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="5"
          />
          {errors.reorder_level && <p className="text-red-500 text-xs font-medium">{errors.reorder_level.message}</p>}
          <p className="text-[10px] text-gray-400 font-medium italic">We'll alert you when stock falls below this level.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#111111]">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Supplier Name</label>
          <input
            {...register("supplier")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. Al Futtaim Motors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Supplier Contact</label>
          <input
            {...register("supplier_contact")}
            className="w-full px-4 py-3 rounded-xl border border-[#222222] focus:ring-2 focus:ring-[#A855F7] focus:border-[#1A1A1A] transition-all outline-none"
            placeholder="e.g. +971 4 123 4567"
          />
        </div>
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
          {isSubmitting ? "Processing..." : initialData ? "Update Part" : "Add to Inventory"}
        </button>
      </div>
    </form>
  );
}
