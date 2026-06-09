"use client";

import { useEffect, useState } from "react";
import VendorsTable from "@/components/tables/VendorsTable";
import { Vendor } from "@/lib/types";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchVendors = async (searchQuery = "") => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/vendors`, { params: { search: searchQuery } });
      setVendors(data);
    } catch (error) {
      console.error("Failed to fetch vendors", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVendors(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this vendor?")) return;
    try {
      await axios.delete(`/api/vendors/${id}`);
      fetchVendors(search);
    } catch (error) {
      alert("Failed to delete vendor");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Vendors</h1>
          <p className="text-gray-500 font-medium">The businesses you buy from — parts, tools, services.</p>
        </div>
        <Link
          href="/vendors/new"
          className="inline-flex items-center px-6 py-3 bg-[#A855F7] text-white font-bold rounded-2xl hover:bg-[#9333EA] transition-all shadow-lg shadow-[#A855F7]/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Vendor
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-[#0D0D0D] p-4 rounded-3xl border border-[#1A1A1A] shadow-sm">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, contact or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#111111] rounded-2xl border border-[#1A1A1A] focus:bg-[#0D0D0D] focus:border-purple-900 transition-all outline-none font-medium text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-[#0D0D0D] rounded-3xl p-20 flex flex-col items-center justify-center border border-[#1A1A1A] shadow-sm">
          <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-bold">Loading vendors...</p>
        </div>
      ) : (
        <VendorsTable vendors={vendors} onDelete={handleDelete} />
      )}
    </div>
  );
}
