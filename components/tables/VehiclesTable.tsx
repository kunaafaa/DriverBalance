"use client";

import { Vehicle } from "@/lib/types";
import { formatDate } from "@/lib/utils/formatting";
import Link from "next/link";
import { Eye, Trash2, Car, Hash, Calendar as CalendarIcon } from "lucide-react";

interface VehiclesTableProps {
  vehicles: (Vehicle & { customers?: { name: string } })[];
  onDelete: (id: string) => void;
}

export default function VehiclesTable({ vehicles, onDelete }: VehiclesTableProps) {
  return (
    <div className="bg-[#0D0D0D] rounded-2xl shadow-sm border border-[#1A1A1A] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#111111] border-b border-[#1A1A1A]">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">License Plate</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Owner</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Mileage</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-[#A855F7]/10/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-[#A855F7]/10 rounded-lg mr-3">
                      <Car className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-white">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center">
                        <Hash className="w-3 h-3 mr-1" />
                        {vehicle.vin}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-bold font-mono">
                    {vehicle.license_plate}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/customers/${vehicle.customer_id}`}
                    className="text-sm font-semibold text-white hover:underline"
                  >
                    {vehicle.customers?.name || "Unknown Owner"}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-100">
                    {vehicle.current_mileage?.toLocaleString()} <span className="text-xs font-normal text-gray-400">km</span>
                  </div>
                  <div className="text-[10px] text-gray-400 flex items-center mt-1">
                    <CalendarIcon className="w-2.5 h-2.5 mr-1" />
                    Last Service: {vehicle.last_service_date ? formatDate(vehicle.last_service_date) : "Never"}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      href={`/vehicles/${vehicle.id}`}
                      className="p-2 text-gray-400 hover:text-white hover:bg-[#A855F7]/10 rounded-lg transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => onDelete(vehicle.id)}
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
      
      {vehicles.length === 0 && (
        <div className="py-20 text-center">
          <Car className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-gray-500 font-bold">No vehicles found</h3>
          <p className="text-gray-400 text-sm">Add your first vehicle to get started.</p>
        </div>
      )}
    </div>
  );
}
