"use client";

import { Bill } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import Link from "next/link";
import { Edit2, Trash2, CreditCard, AlertTriangle } from "lucide-react";

interface BillsTableProps {
  bills: Bill[];
  onDelete: (id: string) => void;
  onRecordPayment: (bill: Bill) => void;
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-600",
  partial: "bg-yellow-100 text-yellow-600",
  unpaid: "bg-gray-200 text-gray-600",
};

function isOverdue(bill: Bill): boolean {
  if (!bill.due_date || bill.status === "paid") return false;
  return new Date(bill.due_date).getTime() < Date.now();
}

export default function BillsTable({ bills, onDelete, onRecordPayment }: BillsTableProps) {
  return (
    <div className="bg-[#0D0D0D] rounded-2xl shadow-sm border border-[#1A1A1A] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#111111] border-b border-[#1A1A1A]">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Balance Due</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bills.map((bill) => {
              const overdue = isOverdue(bill);
              const balance = Number(bill.amount || 0) - Number(bill.amount_paid || 0);
              return (
                <tr key={bill.id} className="hover:bg-[#A855F7]/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{bill.vendors?.name || "—"}</div>
                    <div className="text-xs text-gray-500">{bill.bill_number || "No bill #"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center text-sm font-medium ${overdue ? "text-red-500" : "text-gray-300"}`}>
                      {overdue && <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />}
                      {bill.due_date ? formatDate(bill.due_date) : "—"}
                    </div>
                    {overdue && <div className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-0.5">Overdue</div>}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-white">{formatCurrency(bill.amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-black ${balance > 0 ? "text-amber-400" : "text-green-500"}`}>
                      {formatCurrency(balance)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_STYLES[bill.status]}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {bill.status !== "paid" && (
                        <button
                          onClick={() => onRecordPayment(bill)}
                          className="px-3 py-2 text-xs font-bold text-white bg-[#A855F7]/20 hover:bg-[#A855F7] rounded-lg transition-all flex items-center"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                          Record Payment
                        </button>
                      )}
                      <Link
                        href={`/bills/${bill.id}/edit`}
                        className="p-2 text-gray-400 hover:text-white hover:bg-[#A855F7]/10 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => onDelete(bill.id)}
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

      {bills.length === 0 && (
        <div className="py-20 text-center">
          <CreditCard className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h3 className="text-gray-500 font-bold">No bills recorded</h3>
          <p className="text-gray-600 text-sm">Add money you owe to vendors so nothing slips through.</p>
        </div>
      )}
    </div>
  );
}
