"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Customer } from "@/lib/types";
import CustomerForm from "@/components/forms/CustomerForm";
import { User, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { customerSchema } from "@/lib/utils/validation";

type CustomerFormData = z.infer<typeof customerSchema>;

export default function EditCustomerPage() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const { data } = await axios.get(`/api/customers/${id}`);
        setCustomer(data);
      } catch (error) {
        console.error("Failed to fetch customer data", error);
        alert("Failed to load customer. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchCustomer();
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleSubmit = async (data: CustomerFormData) => {
    try {
      await axios.patch(`/api/customers/${id}`, data);
      router.push(`/customers/${id}`);
      router.refresh();
    } catch (error: any) {
      alert(`Error updating customer: ${error.response?.data?.error || error.message}`);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500 font-bold">Loading profile data...</p>
    </div>
  );

  if (!customer) return <div>Customer not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href={`/customers/${id}`}
            className="inline-flex items-center text-gray-400 hover:text-white font-bold text-sm mb-4 transition-all"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to profile
          </Link>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#A855F7] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">Edit Profile</h1>
              <p className="text-gray-500 font-medium">{customer.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0D0D0D] p-8 md:p-10 rounded-[35px] shadow-xl shadow-black/50 border border-[#1A1A1A]">
        <CustomerForm 
          initialData={customer}
          onSubmit={handleSubmit} 
          onCancel={() => router.push(`/customers/${id}`)}
        />
      </div>
    </div>
  );
}
