"use client";

import { Expense } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import Link from "next/link";
import { Edit2, Trash2, Receipt, FileWarning, ExternalLink } from "lucide-react";

interface ExpensesTableProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  rent: "Rent",
  salaries: "Salaries",
  cogs_parts: "COGS (Parts)",
  tools: "Tools",
  marketing: "Marketing",
  utilities: "Utilities",
  subscriptions: "Subscriptions",
  bank_fees: "Bank Fees",
  other: "Other",
};

export default function ExpensesTable({ expenses, onDelete }: ExpensesTableProps) {
  return (
    <div className="bg-[#0D0D0D] rounded-2xl shadow-sm border border-[#1A1A1A] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#111111] border-b border-[#1A1A1A]">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Receipt</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-[#A855F7]/10 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-300 font-medium">{formatDate(expense.expense_date)}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-white">{expense.vendor || "—"}</div>
                  {expense.notes && <div className="text-xs text-gray-500 truncate max-w-[200px]">{expense.notes}</div>}
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-[#1A1A1A] text-gray-300 rounded-full text-xs font-semibold">
                    {CATEGORY_LABELS[expense.category] || expense.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-black text-white">{formatCurrency(expense.amount)}</div>
                  {expense.vat_amount > 0 && (
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      incl. VAT {formatCurrency(expense.vat_amount)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {expense.receipt_url ? (
                    <a
                      href={expense.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-green-500 font-bold text-xs hover:underline"
                    >
                      <Receipt className="w-4 h-4 mr-1" />
                      View
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center text-amber-500/80 font-bold text-xs">
                      <FileWarning className="w-4 h-4 mr-1" />
                      No receipt
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      href={`/expenses/${expense.id}/edit`}
                      className="p-2 text-gray-400 hover:text-white hover:bg-[#A855F7]/10 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => onDelete(expense.id)}
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

      {expenses.length === 0 && (
        <div className="py-20 text-center">
          <Receipt className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h3 className="text-gray-500 font-bold">No expenses logged</h3>
          <p className="text-gray-600 text-sm">Log your first expense to start tracking the cash going out.</p>
        </div>
      )}
    </div>
  );
}
