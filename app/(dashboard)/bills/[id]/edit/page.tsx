"use client";

import BillForm from "@/components/forms/BillForm";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useEffect, useState } from "react";
import { Bill } from "@/lib/types";

export default function EditBillPage() {
  const router = useRouter();
  const { id } = useParams();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/api/bills/${id}`)
      .then(({ data }) => setBill(data))
      .catch((err) => console.error("Failed to fetch bill", err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: any) => {
    try {
      await axios.patch(`/api/bills/${id}`, data);
      router.push("/bills");
    } catch (error) {
      alert("Failed to update bill");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-bold">Loading bill...</p>
      </div>
    );
  }

  if (!bill) return <div className="text-gray-400">Bill not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link
          href="/bills"
          className="inline-flex items-center text-gray-400 hover:text-white font-bold text-sm mb-4 transition-all"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Bills
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-white">Edit Bill</h1>
      </div>

      <div className="bg-[#0D0D0D] p-8 rounded-3xl border border-[#1A1A1A] shadow-xl shadow-black/50">
        <BillForm initialData={bill} onSubmit={handleSubmit} onCancel={() => router.push("/bills")} />
      </div>
    </div>
  );
}
