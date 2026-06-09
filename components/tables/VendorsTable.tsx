"use client";

import { Vendor } from "@/lib/types";
import Link from "next/link";
import { Edit2, Trash2, Building2, Phone, Mail } from "lucide-react";

interface VendorsTableProps {
  vendors: Vendor[];
  onDelete: (id: string) => void;
}

export default function VendorsTable({ vendors, onDelete }: VendorsTableProps) {
  return (
    <div className="bg-[#0D0D0D] rounded-2xl shadow-sm border border-[#1A1A1A] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#111111] border-b border-[#1A1A1A]">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Terms</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {vendors.map((vendor) => (
              <tr key={vendor.id} className="hover:bg-[#A855F7]/10 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg mr-3 bg-[#A855F7]/10">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-white">{vendor.name}</div>
                      {vendor.contact_person && <div className="text-xs text-gray-400">{vendor.contact_person}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-1 text-sm text-gray-300">
                    {vendor.phone && (
                      <div className="flex items-center"><Phone className="w-3 h-3 mr-2 text-[#A855F7]" />{vendor.phone}</div>
                    )}
                    {vendor.email && (
                      <div className="flex items-center"><Mail className="w-3 h-3 mr-2 text-[#A855F7]" />{vendor.email}</div>
                    )}
                    {!vendor.phone && !vendor.email && <span className="text-gray-600">—</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-[#1A1A1A] text-gray-300 rounded-full text-xs font-semibold capitalize">
                    {vendor.category || "general"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400 font-medium">{vendor.payment_terms || "—"}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      href={`/vendors/${vendor.id}/edit`}
                      className="p-2 text-gray-400 hover:text-white hover:bg-[#A855F7]/10 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => onDelete(vendor.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {vendors.length === 0 && (
        <div className="py-20 text-center">
          <Building2 className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h3 className="text-gray-500 font-bold">No vendors yet</h3>
          <p className="text-gray-600 text-sm">Add the businesses you buy from to start tracking bills.</p>
        </div>
      )}
    </div>
  );
}
