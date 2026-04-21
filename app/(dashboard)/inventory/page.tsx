"use client";

import { useEffect, useState } from "react";
import InventoryTable from "@/components/tables/InventoryTable";
import { Part } from "@/lib/types";
import { Plus, Search, Package, AlertCircle } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function InventoryPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);

  const fetchParts = async (searchQuery = "") => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/inventory`, {
        params: { search: searchQuery },
      });
      setParts(data);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchParts(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this part from inventory?")) return;
    try {
      await axios.delete(`/api/inventory/${id}`);
      fetchParts(search);
    } catch (error) {
      alert("Failed to remove part");
    }
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    try {
      await axios.patch(`/api/inventory/${id}`, { quantity_in_stock: newStock });
      fetchParts(search);
    } catch (error) {
       console.error("Failed to update stock");
    }
  };

  const filteredParts = showLowStock 
    ? parts.filter(p => p.quantity_in_stock <= p.reorder_level)
    : parts;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Inventory</h1>
          <p className="text-gray-500 font-medium">Manage spare parts, lubricants, and workshop supplies.</p>
        </div>
        <Link
          href="/inventory/new"
          className="inline-flex items-center px-6 py-3 bg-[#A855F7] text-white font-bold rounded-2xl hover:bg-[#9333EA] transition-all shadow-lg shadow-[#A855F7]/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Part
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-[#0D0D0D] p-4 rounded-3xl border border-[#1A1A1A] shadow-sm">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, SKU or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#111111] rounded-2xl border border-[#1A1A1A] focus:bg-[#0D0D0D] focus:border-purple-900 transition-all outline-none font-medium text-sm"
          />
        </div>
        <button 
          onClick={() => setShowLowStock(!showLowStock)}
          className={`inline-flex items-center px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
            showLowStock ? "bg-red-50 text-red-600 shadow-sm" : "bg-[#111111] text-gray-400 hover:text-white"
          }`}
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Low Stock Only
        </button>
      </div>

      {loading ? (
        <div className="bg-[#0D0D0D] rounded-3xl p-20 flex flex-col items-center justify-center border border-[#1A1A1A] shadow-sm">
          <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-bold">Scanning stock levels...</p>
        </div>
      ) : (
        <InventoryTable
          parts={filteredParts}
          onDelete={handleDelete}
          onUpdateStock={handleUpdateStock}
        />
      )}
    </div>
  );
}
