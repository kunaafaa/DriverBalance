"use client";

import { useEffect, useState } from "react";
import VehiclesTable from "@/components/tables/VehiclesTable";
import { Vehicle } from "@/lib/types";
import { Plus, Search, Car } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchVehicles = async (searchQuery = "") => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/vehicles`, {
        params: { search: searchQuery },
      });
      setVehicles(data);
    } catch (error) {
      console.error("Failed to fetch vehicles", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVehicles(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete all history for this vehicle.")) return;
    try {
      await axios.delete(`/api/vehicles/${id}`);
      fetchVehicles(search);
    } catch (error) {
      alert("Failed to delete vehicle");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Vehicles</h1>
          <p className="text-gray-500 font-medium">Monitor customer cars and their maintenance cycles.</p>
        </div>
        <Link
          href="/vehicles/new"
          className="inline-flex items-center px-6 py-3 bg-[#A855F7] text-white font-bold rounded-2xl hover:bg-[#9333EA] transition-all shadow-lg shadow-[#A855F7]/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Register Vehicle
        </Link>
      </div>

      <div className="relative w-full md:w-96">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Make, model or plate..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-[#0D0D0D] rounded-xl border border-[#1A1A1A] shadow-sm focus:border-purple-900 transition-all outline-none font-medium text-sm"
        />
      </div>

      {loading ? (
        <div className="bg-[#0D0D0D] rounded-2xl p-20 flex flex-col items-center justify-center border border-[#1A1A1A] shadow-sm">
          <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-bold">Retrieving fleet data...</p>
        </div>
      ) : (
        <VehiclesTable
          vehicles={vehicles}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
