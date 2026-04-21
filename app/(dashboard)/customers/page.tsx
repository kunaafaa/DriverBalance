"use client";

import { useEffect, useState } from "react";
import CustomersTable from "@/components/tables/CustomersTable";
import { Customer } from "@/lib/types";
import { Plus, Search, Filter } from "lucide-react";
import Link from "next/link";
import axios from "axios";

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
            placeholder="Search by name, email or phone..."
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
        <div className="bg-[#0D0D0D] rounded-2xl p-20 flex flex-col items-center justify-center border border-[#1A1A1A] shadow-sm">
          <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-bold">Loading records...</p>
        </div>
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
