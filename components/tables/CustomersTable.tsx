"use client";

import { Customer } from "@/lib/types";
import { formatDate } from "@/lib/utils/formatting";
import Link from "next/link";
import { Eye, Edit2, Trash2, Phone } from "lucide-react";

interface CustomersTableProps {
  customers: Customer[];
  pagination: {
    page: number;
    pages: number;
    total: number;
  };
  onPageChange: (page: number) => void;
  onDelete: (id: string) => void;
}

export default function CustomersTable({
  customers,
  pagination,
  onPageChange,
  onDelete,
}: CustomersTableProps) {
  return (
    <div className="bg-[#0D0D0D] rounded-2xl shadow-sm border border-[#1A1A1A] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#111111] border-b border-[#1A1A1A]">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">City</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-[#A855F7]/10/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-white">{customer.name}</div>
                  <div className="text-xs text-gray-400">ID: {customer.id.slice(0, 8)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center text-sm text-gray-300">
                      <Phone className="w-3 h-3 mr-2 text-[#A855F7]" />
                      {customer.phone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-[#1A1A1A] text-gray-300 rounded-full text-xs font-semibold">
                    {customer.city}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {formatDate(customer.created_at)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="p-2 text-gray-400 hover:text-white hover:bg-[#A855F7]/10 rounded-lg transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => onDelete(customer.id)}
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

      {/* Pagination */}
      <div className="px-6 py-4 bg-[#111111] border-t border-[#1A1A1A] flex items-center justify-between">
        <div className="text-sm text-gray-500 font-medium">
          Showing <span className="text-white">{customers.length}</span> of{" "}
          <span className="text-white">{pagination.total}</span> customers
        </div>
        <div className="flex items-center space-x-2">
          <button
            disabled={pagination.page === 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="px-4 py-2 text-sm font-bold text-gray-600 bg-[#0D0D0D] border border-[#222222] rounded-xl hover:bg-[#111111] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <div className="px-4 py-2 text-sm font-bold bg-[#A855F7] text-white rounded-xl">
            {pagination.page}
          </div>
          <button
            disabled={pagination.page === pagination.pages}
            onClick={() => onPageChange(pagination.page + 1)}
            className="px-4 py-2 text-sm font-bold text-gray-600 bg-[#0D0D0D] border border-[#222222] rounded-xl hover:bg-[#111111] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
