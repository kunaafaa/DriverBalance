"use client";

import { useEffect, useState } from "react";
import CustomersTable from "@/components/tables/CustomersTable";
import { Customer } from "@/lib/types";
import { Plus, Search, Filter } from "lucide-react";
import Link from "next/link";
import axios from "axios";

function CustomersTableSkeleton() {
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
          <tbody className="divide-y divide-[#1A1A1A]">
            {[...Array(8)].map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div className="h-4 w-32 bg-[#1A1A1A] rounded animate-pulse mb-2" />
                  <div className="h-3 w-20 bg-[#1A1A1A] rounded animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-3 w-28 bg-[#1A1A1A] rounded animate-pulse mb-2" />
                  <div className="h-3 w-36 bg-[#1A1A1A] rounded animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 w-20 bg-[#1A1A1A] rounded-full animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-20 bg-[#1A1A1A] rounded animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-8 h-8 bg-[#1A1A1A] rounded-lg animate-pulse" />
                    <div className="w-8 h-8 bg-[#1A1A1A] rounded-lg animate-pulse" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-[#111111] border-t border-[#1A1A1A]">
        <div className="h-4 w-40 bg-[#1A1A1A] rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const fetchCustomers = async (page = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/customers`, {
        params: { page, limit: 10, search: searchQuery },
      });
      setCustomers(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch customers", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(1, search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer? All their vehicles and records will be lost.")) return;
    try {
      await axios.delete(`/api/customers/${id}`);
      fetchCustomers(pagination.page, search);
    } catch (error) {
      alert("Failed to delete customer");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Customers</h1>
          <p className="text-gray-500 font-medium">Manage your customer relationships and service history.</p>
        </div>
        <Link
          href="/customers/new"
          className="inline-flex items-center px-6 py-3 bg-[#A855F7] text-white font-bold rounded-2xl hover:bg-[#9333EA] transition-all shadow-lg shadow-[#A855F7]/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Customer
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-[#0D0D0D] p-4 rounded-2xl border border-[#1A1A1A] shadow-sm">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#111111] rounded-xl border border-[#1A1A1A] focus:bg-[#0D0D0D] focus:border-purple-900 transition-all outline-none font-medium text-sm"
          />
        </div>
        <button className="inline-flex items-center px-4 py-3 text-gray-400 hover:text-white transition-all font-bold">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </button>
      </div>

      {loading ? (
        <CustomersTableSkeleton />
      ) : (
        <CustomersTable
          customers={customers}
          pagination={pagination}
          onPageChange={(page) => fetchCustomers(page, search)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
