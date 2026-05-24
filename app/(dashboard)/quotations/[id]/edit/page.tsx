"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Quotation, QuotationItem } from "@/lib/types";
import QuotationForm from "@/components/forms/QuotationForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function EditQuotationPage() {
    const { id } = useParams();
    const router = useRouter();
    const [quotation, setQuotation] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) { setLoading(false); return; }
        const fetch = async () => {
            try {
                const { data } = await axios.get(`/api/quotations/${id}`);
                // Map quotation_items to items for the form
                setQuotation({
                    ...data,
                    items: data.quotation_items?.map((item: QuotationItem) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        item_type: item.item_type,
                    })) || [],
                    issue_date: data.issue_date?.split("T")[0],
                    valid_until: data.valid_until?.split("T")[0],
                });
            } catch (error) {
                console.error("Failed to fetch quotation", error);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    const handleSubmit = async (data: any) => {
        try {
            const subtotal = data.items.reduce(
                (acc: number, item: any) => acc + item.quantity * item.unit_price, 0
            );
            const taxAmount = (subtotal * data.tax_rate) / 100;
            const total = subtotal + taxAmount - data.discount;

            await axios.patch(`/api/quotations/${id}`, {
                ...data,
                subtotal,
                tax_amount: taxAmount,
                total,
            });
            router.push(`/quotations/${id}`);
        } catch (error: any) {
            alert(`Failed to update quotation: ${error.response?.data?.error || error.message}`);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 font-bold">Loading quotation...</p>
        </div>
    );

    if (!quotation) return <div className="text-white">Quotation not found</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <Link
                    href={`/quotations/${id}`}
                    className="inline-flex items-center text-gray-400 hover:text-white font-bold text-sm mb-4 transition-all"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Quotation
                </Link>
                <h1 className="text-3xl font-black tracking-tight text-white">Edit Quotation</h1>
                <p className="text-gray-500 font-medium text-sm mt-1">Update the details of this quotation.</p>
            </div>

            <div className="bg-[#0D0D0D] p-8 rounded-[40px] border border-[#1A1A1A] shadow-2xl shadow-black/50">
                <QuotationForm
                    initialData={quotation}
                    onSubmit={handleSubmit}
                    onCancel={() => router.push(`/quotations/${id}`)}
                />
            </div>
        </div>
    );
}