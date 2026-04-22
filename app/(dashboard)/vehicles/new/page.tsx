"use client";

import VehicleForm from "@/components/forms/VehicleForm";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useEffect, useState } from "react";
import { Customer } from "@/lib/types";

import { Suspense } from "react";

function VehicleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedCustomer = searchParams.get("customer_id");
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data } = await axios.get("/api/customers");
        setCustomers(data.data);
      } catch (error) {
        console.error("Failed to load customers");
      }
    };
    fetchCustomers();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      await axios.post("/api/vehicles", data);
      router.push(preSelectedCustomer ? `/customers/${preSelectedCustomer}` : "/vehicles");
    } catch (error) {
      alert("Failed to register vehicle");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link 
          href={preSelectedCustomer ? `/customers/${preSelectedCustomer}` : "/vehicles"} 
          className="inline-flex items-center text-gray-400 hover:text-white font-bold text-sm mb-4 transition-all"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-white">Register New Vehicle</h1>
        <p className="text-gray-500 font-medium text-sm mt-1">Add a new car to a customer's profile.</p>
      </div>

      <div className="bg-[#0D0D0D] p-8 rounded-3xl border border-[#1A1A1A] shadow-xl shadow-black/50">
        <VehicleForm 
          customers={customers}
          initialData={preSelectedCustomer ? { customer_id: preSelectedCustomer } as any : undefined}
          onSubmit={handleSubmit} 
          onCancel={() => router.back()} 
        />
      </div>
    </div>
  );
}

export default function NewVehiclePage() {
  return (
    <Suspense fallback={<div className="text-white font-bold p-10">Loading vehicle registration...</div>}>
      <VehicleContent />
    </Suspense>
  );
}
