"use client";

import { Part } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/formatting";
import { Edit2, Trash2, Package, AlertTriangle } from "lucide-react";

interface InventoryTableProps {
  parts: Part[];
  onDelete: (id: string) => void;
  onUpdateStock: (id: string, newStock: number) => void;
}

export default function InventoryTable({ parts, onDelete, onUpdateStock }: InventoryTableProps) {
  return (
    <div className="bg-[#0D0D0D] rounded-2xl shadow-sm border border-[#1A1A1A] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#111111] border-b border-[#1A1A1A]">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Part Details</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Stock Level</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Unit Price</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {parts.map((part) => {
              const isLowStock = part.quantity_in_stock <= part.reorder_level;
              const isCritical = part.quantity_in_stock === 0;

              return (
                <tr key={part.id} className="hover:bg-[#A855F7]/10/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${isCritical ? 'bg-red-50' : 'bg-[#A855F7]/10'}`}>
                        <Package className={`w-5 h-5 ${isCritical ? 'text-red-500' : 'text-white'}`} />
                      </div>
                      <div>
                        <div className="font-bold text-white">{part.name}</div>
                        <div className="text-xs text-gray-400 font-mono tracking-tight">{part.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-[#1A1A1A] text-gray-600 rounded-full text-xs font-semibold">
                      {part.category || "General"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-black ${isLowStock ? 'text-red-600' : 'text-white'}`}>
                        {part.quantity_in_stock}
                      </span>
                      {isLowStock && (
                        <div className="group relative">
                          <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Reorder below {part.reorder_level}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="w-24 h-1.5 bg-[#1A1A1A] rounded-full mt-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${isLowStock ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min((part.quantity_in_stock / (part.reorder_level * 3)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-white">{formatCurrency(part.unit_price)}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Per unit</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                       <button
                        onClick={() => onUpdateStock(part.id, part.quantity_in_stock + 1)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-[#A855F7]/10 rounded-lg transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(part.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Plus(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
