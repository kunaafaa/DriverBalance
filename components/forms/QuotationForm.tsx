"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quotationSchema } from "@/lib/utils/validation";
import { z } from "zod";
import { Customer, Vehicle, Quotation, ItemType } from "@/lib/types";
import { Plus, Trash2, Calculator, Calendar, Car, FileText, User } from "lucide-react";
import axios from "axios";

type QuotationFormData = z.infer<typeof quotationSchema>;

function parsePastedLine(line: string): { description: string; quantity: number; unit_price: number; item_type: ItemType } {
  const PART_KEYWORDS = ["filter", "oil", "tyre", "tire", "brake", "sensor", "belt", "fluid", "bulb", "battery", "wiper", "plug", "bearing", "seal", "gasket", "disc", "rotor", "pump", "hose", "cap", "pad", "part"];
  let desc = line.trim();
  let quantity = 1;
  let unit_price = 0;

  if (line.includes("|")) {
    const segments = line.split("|").map((s) => s.trim()).filter(Boolean);
    let descIdx = 0, qtyIdx = -1, priceIdx = -1;
    if (segments.length >= 2 && /^\d+$/.test(segments[0])) {
      descIdx = 1; qtyIdx = 2; priceIdx = 3;
    } else {
      descIdx = 0; qtyIdx = 1; priceIdx = 2;
    }
    desc = segments[descIdx] ?? "";
    const qSeg = qtyIdx >= 0 ? segments[qtyIdx] : undefined;
    if (qSeg) { const m = qSeg.match(/(\d+)/); if (m) quantity = parseInt(m[1], 10); }
    const pSeg = priceIdx >= 0 ? segments[priceIdx] : undefined;
    if (pSeg) { const m = pSeg.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/); if (m) unit_price = parseFloat(m[1]) || 0; }
  } else {
    const qtyRules: Array<[RegExp, number]> = [
      [/\bx\s*(\d+)\b/i, 1],
      [/\b(\d+)\s*x\b/i, 1],
      [/\bqty\s*:?\s*(\d+)\b/i, 1],
    ];
    for (const [re, g] of qtyRules) {
      const m = desc.match(re);
      if (m) { quantity = parseInt(m[g], 10); desc = desc.replace(m[0], "").trim(); break; }
    }

    const aedM = desc.match(/\bAED\s*([\d,]+(?:\.\d+)?)/i);
    if (aedM) {
      unit_price = parseFloat(aedM[1].replace(/,/g, "")) || 0;
      desc = desc.replace(aedM[0], "").trim();
    } else {
      const eachM = desc.match(/([\d,]+(?:\.\d+)?)\s*each\b/i);
      if (eachM) {
        unit_price = parseFloat(eachM[1].replace(/,/g, "")) || 0;
        desc = desc.replace(eachM[0], "").trim();
      } else {
        const dashM = desc.match(/\s*-\s*([\d,]+(?:\.\d+)?)\s*$/);
        if (dashM) {
          unit_price = parseFloat(dashM[1].replace(/,/g, "")) || 0;
          desc = desc.replace(dashM[0], "").trim();
        } else {
          const colonM = desc.match(/:\s*([\d,]+(?:\.\d+)?)\s*$/);
          if (colonM) {
            unit_price = parseFloat(colonM[1].replace(/,/g, "")) || 0;
            desc = desc.replace(colonM[0], "").trim();
          } else {
            const lastM = desc.match(/\s([\d,]+(?:\.\d+)?)\s*$/);
            if (lastM) {
              unit_price = parseFloat(lastM[1].replace(/,/g, "")) || 0;
              desc = desc.replace(lastM[0], "").trim();
            }
          }
        }
      }
    }

    desc = desc
      .replace(/\+\s*VAT\b/gi, "")
      .replace(/\beach\b/gi, "")
      .replace(/\bAED\b/gi, "")
      .replace(/^\d+[\.\)]\s*/, "")
      .replace(/[:\-,|]+\s*$/, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  const item_type: ItemType = PART_KEYWORDS.some((k) => desc.toLowerCase().includes(k)) ? "part" : "service";
  return { description: desc, quantity, unit_price, item_type };
}

interface QuotationFormProps {
  initialData?: Quotation;
  onSubmit: (data: QuotationFormData) => Promise<void>;
  onCancel?: () => void;
}

export default function QuotationForm({ initialData, onSubmit, onCancel }: QuotationFormProps) {
  const [customerQuery, setCustomerQuery] = useState(initialData?.customer_name || "");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [vehicleOptions, setVehicleOptions] = useState<Vehicle[]>([]);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema) as any,
    defaultValues: initialData || {
      quotation_number: `QUO-${Date.now().toString().slice(-6)}`,
      issue_date: new Date().toISOString().split("T")[0],
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      car_make: "",
      car_model: "",
      car_year: new Date().getFullYear(),
      license_plate: "",
      customer_name: "",
      customer_phone: "",
      items: [{ description: "", quantity: 1, unit_price: 0, item_type: "service" as ItemType }],
      tax_rate: 5,
      discount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchedItems = useWatch({ control, name: "items" });
  const watchedTaxRate = useWatch({ control, name: "tax_rate" });
  const watchedDiscount = useWatch({ control, name: "discount" });

  const subtotal = watchedItems.reduce((acc, item) => acc + (item.quantity * item.unit_price || 0), 0);
  const taxAmount = (subtotal * (watchedTaxRate || 0)) / 100;
  const total = subtotal + taxAmount - (watchedDiscount || 0);

  const handleDescriptionPaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return;
    e.preventDefault();

    const parsed = lines.map(parsePastedLine);
    const currentItems = watchedItems ?? [];
    const emptyIndices: number[] = [];
    for (let i = 0; i < currentItems.length; i++) {
      if (!currentItems[i]?.description) emptyIndices.push(i);
    }
    const fillQueue = [index, ...emptyIndices.filter((i) => i !== index)];

    parsed.forEach((item, i) => {
      if (i < fillQueue.length) {
        const rowIdx = fillQueue[i];
        setValue(`items.${rowIdx}.description` as any, item.description);
        setValue(`items.${rowIdx}.quantity` as any, item.quantity);
        setValue(`items.${rowIdx}.unit_price` as any, item.unit_price);
        setValue(`items.${rowIdx}.item_type` as any, item.item_type);
      } else {
        append({ description: item.description, quantity: item.quantity, unit_price: item.unit_price, item_type: item.item_type });
      }
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchCustomers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setCustomerResults([]);
      setShowDropdown(false);
      return;
    }
    try {
      const { data } = await axios.get(`/api/customers?search=${encodeURIComponent(query)}`);
      setCustomerResults(data.data || []);
      setShowDropdown(true);
    } catch {
      setCustomerResults([]);
    }
  };

  const fetchVehiclesForCustomer = async (customerId: string) => {
    setLoadingVehicle(true);
    try {
      const { data } = await axios.get(`/api/vehicles?customer_id=${customerId}`);
      const vehicles = data as Vehicle[];
      if (vehicles.length === 1) {
        setVehicleOptions([]);
        setValue("car_make", vehicles[0].make);
        setValue("car_model", vehicles[0].model);
        setValue("car_year", vehicles[0].year);
        setValue("license_plate", vehicles[0].license_plate);
      } else if (vehicles.length > 1) {
        setVehicleOptions(vehicles);
        setValue("car_make", "");
        setValue("car_model", "");
        setValue("car_year", undefined as any);
        setValue("license_plate", "");
      } else {
        setVehicleOptions([]);
      }
    } catch {
      setVehicleOptions([]);
    } finally {
      setLoadingVehicle(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setCustomerQuery(customer.name);
    setValue("customer_name", customer.name, { shouldValidate: true });
    setValue("customer_phone", customer.phone, { shouldValidate: true });
    setShowDropdown(false);
    setCustomerResults([]);
    fetchVehiclesForCustomer(customer.id);
  };

  const handleVehicleOptionSelect = (vehicleId: string) => {
    const v = vehicleOptions.find((veh) => veh.id === vehicleId);
    if (!v) return;
    setValue("car_make", v.make);
    setValue("car_model", v.model);
    setValue("car_year", v.year);
    setValue("license_plate", v.license_plate);
  };

  const customerNameReg = register("customer_name");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-[#111111] rounded-3xl border border-[#1A1A1A]">
        <div className="space-y-2">
          <label className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest">
            <FileText className="w-3 h-3 mr-2 text-[#A855F7]" />
            Quotation Number
          </label>
          <input
            {...register("quotation_number")}
            readOnly={!!initialData}
            className={`w-full px-4 py-2 rounded-xl border border-[#1A1A1A] font-bold outline-none focus:ring-2 focus:ring-[#A855F7] ${initialData ? "bg-[#1A1A1A] text-gray-500 cursor-not-allowed" : "bg-[#0D0D0D] text-white"}`}
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest">
            <Calendar className="w-3 h-3 mr-2 text-[#A855F7]" />
            Issue Date
          </label>
          <input
            {...register("issue_date")}
            type="date"
            className="w-full bg-[#0D0D0D] px-4 py-2 rounded-xl border border-[#1A1A1A] font-bold text-white outline-none focus:ring-2 focus:ring-[#A855F7]"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest">
            <Calendar className="w-3 h-3 mr-2 text-[#A855F7]" />
            Valid Until
          </label>
          <input
            {...register("valid_until")}
            type="date"
            className="w-full bg-[#0D0D0D] px-4 py-2 rounded-xl border border-[#1A1A1A] font-bold text-white outline-none focus:ring-2 focus:ring-[#A855F7]"
          />
        </div>
      </div>

      {/* Customer Info */}
      <div className="p-6 bg-[#111111] rounded-3xl border border-[#1A1A1A] space-y-4">
        <h3 className="flex items-center text-sm font-black text-white uppercase tracking-tight">
          <User className="w-4 h-4 mr-2 text-[#A855F7]" />
          Customer
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Name with autocomplete */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Customer Name</label>
            <input
              ref={customerNameReg.ref}
              name={customerNameReg.name}
              onBlur={customerNameReg.onBlur}
              value={customerQuery}
              onChange={(e) => {
                const val = e.target.value;
                setCustomerQuery(val);
                setValue("customer_name", val, { shouldValidate: true });
                searchCustomers(val);
                if (!val) setVehicleOptions([]);
              }}
              placeholder="e.g. Ahmed Al Mansouri"
              autoComplete="off"
              className="w-full bg-[#0D0D0D] px-4 py-2 rounded-xl border border-[#1A1A1A] font-bold text-white outline-none focus:ring-2 focus:ring-[#A855F7]"
            />
            {showDropdown && customerResults.length > 0 && (
              <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#111111] border border-[#1A1A1A] rounded-xl overflow-hidden shadow-xl">
                {customerResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleCustomerSelect(c)}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#1A1A1A] transition-all border-b border-[#1A1A1A] last:border-0"
                  >
                    <p className="text-sm font-bold text-white">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.phone}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Customer Phone */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Customer Phone</label>
            <input
              {...register("customer_phone")}
              placeholder="e.g. 050 123 4567"
              className="w-full bg-[#0D0D0D] px-4 py-2 rounded-xl border border-[#1A1A1A] font-bold text-white outline-none focus:ring-2 focus:ring-[#A855F7]"
            />
          </div>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="p-6 bg-[#111111] rounded-3xl border border-[#1A1A1A] space-y-4">
        <h3 className="flex items-center text-sm font-black text-white uppercase tracking-tight">
          <Car className="w-4 h-4 mr-2 text-[#A855F7]" />
          Vehicle Details
        </h3>

        {loadingVehicle && (
          <p className="text-xs text-gray-500 font-bold animate-pulse">Fetching vehicle info...</p>
        )}

        {!loadingVehicle && vehicleOptions.length > 1 && (
          <div className="space-y-2">
            <label className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest">
              <Car className="w-3 h-3 mr-2 text-[#A855F7]" />
              Select Vehicle
            </label>
            <select
              onChange={(e) => handleVehicleOptionSelect(e.target.value)}
              defaultValue=""
              className="w-full bg-[#0D0D0D] px-4 py-2 rounded-xl border border-[#1A1A1A] font-bold text-white outline-none focus:ring-2 focus:ring-[#A855F7]"
            >
              <option value="">Select a vehicle...</option>
              {vehicleOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} — Plate: {v.license_plate}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Car Make</label>
            <input
              {...register("car_make")}
              placeholder="e.g. Toyota"
              className="w-full bg-[#0D0D0D] px-4 py-2 rounded-xl border border-[#1A1A1A] font-bold text-white outline-none focus:ring-2 focus:ring-[#A855F7]"
            />
            {errors.car_make && <p className="text-red-500 text-[10px] font-bold">{errors.car_make.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Car Model</label>
            <input
              {...register("car_model")}
              placeholder="e.g. Camry"
              className="w-full bg-[#0D0D0D] px-4 py-2 rounded-xl border border-[#1A1A1A] font-bold text-white outline-none focus:ring-2 focus:ring-[#A855F7]"
            />
            {errors.car_model && <p className="text-red-500 text-[10px] font-bold">{errors.car_model.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Year</label>
            <input
              {...register("car_year")}
              type="number"
              placeholder="e.g. 2022"
              className="w-full bg-[#0D0D0D] px-4 py-2 rounded-xl border border-[#1A1A1A] font-bold text-white outline-none focus:ring-2 focus:ring-[#A855F7]"
            />
            {errors.car_year && <p className="text-red-500 text-[10px] font-bold">{errors.car_year.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">License Plate</label>
            <input
              {...register("license_plate")}
              placeholder="e.g. AB-12345"
              className="w-full bg-[#0D0D0D] px-4 py-2 rounded-xl border border-[#1A1A1A] font-bold text-white outline-none focus:ring-2 focus:ring-[#A855F7]"
            />
            {errors.license_plate && <p className="text-red-500 text-[10px] font-bold">{errors.license_plate.message}</p>}
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-tight">Quotation Items</h3>
          <button
            type="button"
            onClick={() => append({ description: "", quantity: 1, unit_price: 0, item_type: "service" })}
            className="inline-flex items-center px-4 py-2 bg-[#A855F7]/10 text-white text-xs font-bold rounded-xl hover:bg-[#A855F7] hover:text-white transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-12 gap-3 p-4 bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-right-4 duration-300"
            >
              <div className="col-span-12 md:col-span-5 space-y-1">
                <input
                  {...register(`items.${index}.description`)}
                  onPaste={(e) => handleDescriptionPaste(index, e)}
                  placeholder="Item description (Service or Part)"
                  className="w-full px-4 py-2 bg-[#111111] border-none rounded-xl text-sm font-medium outline-none focus:bg-[#0D0D0D] focus:ring-2 focus:ring-[#A855F7]"
                />
                {errors.items?.[index]?.description && (
                  <p className="text-red-500 text-[10px] font-bold">{errors.items[index]?.description?.message}</p>
                )}
              </div>

              <div className="col-span-4 md:col-span-2 space-y-1">
                <select
                  {...register(`items.${index}.item_type`)}
                  className="w-full px-4 py-2 bg-[#111111] border-none rounded-xl text-xs font-bold outline-none focus:bg-[#0D0D0D] focus:ring-2 focus:ring-[#A855F7]"
                >
                  <option value="service">Service</option>
                  <option value="part">Part</option>
                  <option value="labor">Labor</option>
                </select>
              </div>

              <div className="col-span-3 md:col-span-2 space-y-1">
                <input
                  {...register(`items.${index}.quantity`)}
                  type="number"
                  placeholder="Qty"
                  className="w-full px-4 py-2 bg-[#111111] border-none rounded-xl text-sm font-bold outline-none focus:bg-[#0D0D0D] focus:ring-2 focus:ring-[#A855F7]"
                />
              </div>

              <div className="col-span-3 md:col-span-2 space-y-1">
                <input
                  {...register(`items.${index}.unit_price`)}
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  className="w-full px-4 py-2 bg-[#111111] border-none rounded-xl text-sm font-bold outline-none focus:bg-[#0D0D0D] focus:ring-2 focus:ring-[#A855F7]"
                />
              </div>

              <div className="col-span-2 md:col-span-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary and Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#1A1A1A]">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Notes</label>
            <textarea
              {...register("notes")}
              rows={4}
              placeholder="Quote validity, terms, special conditions..."
              className="w-full px-4 py-3 bg-[#111111] rounded-2xl border-none text-sm font-medium outline-none resize-none focus:bg-[#0D0D0D] focus:ring-2 focus:ring-[#A855F7] transition-all"
            />
          </div>
        </div>

        <div className="bg-[#0A0A0A] rounded-3xl p-8 text-white space-y-6 shadow-2xl shadow-blue-900/20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black tracking-tight">Summary</h3>
            <Calculator className="w-5 h-5 text-purple-400" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm font-bold text-slate-400">
              <span>Subtotal</span>
              <span className="text-white">AED {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-slate-400">
              <span className="flex items-center">
                VAT
                <input
                  {...register("tax_rate")}
                  type="number"
                  className="w-12 ml-2 bg-[#111111] border-none rounded-lg px-2 py-1 text-xs text-purple-400 outline-none"
                />
                %
              </span>
              <span className="text-white">AED {taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-slate-400">
              <span>Discount</span>
              <div className="flex items-center">
                <span className="mr-2">AED</span>
                <input
                  {...register("discount")}
                  type="number"
                  className="w-20 bg-[#111111] border-none rounded-lg px-2 py-1 text-xs text-red-400 outline-none font-bold"
                />
              </div>
            </div>
            <div className="h-px bg-[#111111] my-4" />
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none">Quoted Total</p>
                <h4 className="text-4xl font-black mt-1">AED {total.toFixed(2)}</h4>
              </div>
              <span className="bg-[#A855F7] text-[10px] font-black px-2 py-1 rounded text-white uppercase tracking-widest mb-1">
                Estimate
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-4 rounded-2xl bg-[#111111] text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
            )}
            {Object.keys(errors).length > 0 && (
              <div className="text-red-400 text-xs font-bold bg-red-900/20 p-3 rounded-xl border border-red-900/50">
                Please fix the validation errors before submitting.
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-4 rounded-2xl bg-[#A855F7] text-white text-xs font-black uppercase tracking-widest hover:bg-purple-900 transition-all shadow-xl shadow-black/20 disabled:opacity-50"
            >
              {isSubmitting ? "Generating..." : initialData ? "Update Quotation" : "Generate Quotation"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
