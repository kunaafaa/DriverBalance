"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bell, Search, User, Menu, Users, Car, FileText, Stethoscope, Loader2 } from "lucide-react";
import axios from "axios";
import Logo from "./Logo";
import { formatCurrency } from "@/lib/utils/formatting";

interface SearchResults {
  customers: any[];
  vehicles: any[];
  invoices: any[];
  reports: any[];
}

const EMPTY_RESULTS: SearchResults = { customers: [], vehicles: [], invoices: [], reports: [] };

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = query.trim();

    if (!term) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setOpen(true);
      setLoading(true);
      try {
        const { data } = await axios.get("/api/search", { params: { q: term } });
        setResults(data);
      } catch (error) {
        console.error("Search failed", error);
        setResults(EMPTY_RESULTS);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const goTo = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const hasResults =
    results.customers.length > 0 ||
    results.vehicles.length > 0 ||
    results.invoices.length > 0 ||
    results.reports.length > 0;

  return (
    <header className="h-20 bg-[#0D0D0D] border-b border-[#1A1A1A] flex items-center justify-between px-8 z-10">
      <div className="flex items-center md:hidden space-x-4">
        <Menu className="w-6 h-6 text-gray-400" />
        <Logo iconOnly className="scale-75" />
      </div>

      <div ref={containerRef} className="hidden md:block relative w-96">
        <div className="flex items-center bg-[#111111] rounded-2xl px-4 py-2 w-96 border border-[#1A1A1A] focus-within:ring-2 focus-within:ring-[#A855F7]/30 transition-all">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim() && setOpen(true)}
            placeholder="Search for customers, vehicles or invoices..."
            className="bg-transparent border-none outline-none text-sm font-medium w-full text-white placeholder:text-gray-500"
          />
        </div>

        {open && (
          <div className="absolute top-full left-0 mt-2 w-full bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl shadow-lg shadow-black/30 overflow-hidden z-50 max-h-[28rem] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-[#A855F7] animate-spin" />
              </div>
            ) : !hasResults ? (
              <div className="px-4 py-8 text-center text-sm font-medium text-gray-400">
                No results found
              </div>
            ) : (
              <div className="divide-y divide-[#1A1A1A]">
                {results.customers.length > 0 && (
                  <div className="py-2">
                    <p className="px-4 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Customers</p>
                    {results.customers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => goTo(`/customers/${customer.id}`)}
                        className="w-full flex items-center px-4 py-2.5 hover:bg-[#A855F7]/10 transition-all text-left"
                      >
                        <Users className="w-4 h-4 text-[#A855F7] mr-3 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{customer.name}</p>
                          <p className="text-xs text-gray-400 truncate">{customer.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.vehicles.length > 0 && (
                  <div className="py-2">
                    <p className="px-4 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vehicles</p>
                    {results.vehicles.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        onClick={() => goTo(`/vehicles/${vehicle.id}`)}
                        className="w-full flex items-center px-4 py-2.5 hover:bg-[#A855F7]/10 transition-all text-left"
                      >
                        <Car className="w-4 h-4 text-[#A855F7] mr-3 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{vehicle.license_plate}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.invoices.length > 0 && (
                  <div className="py-2">
                    <p className="px-4 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Invoices</p>
                    {results.invoices.map((invoice) => (
                      <button
                        key={invoice.id}
                        onClick={() => goTo(`/invoices/${invoice.id}`)}
                        className="w-full flex items-center px-4 py-2.5 hover:bg-[#A855F7]/10 transition-all text-left"
                      >
                        <FileText className="w-4 h-4 text-[#A855F7] mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white truncate">{invoice.invoice_number}</p>
                          <p className="text-xs text-gray-400 truncate">{invoice.customers?.name}</p>
                        </div>
                        <p className="text-sm font-black text-white ml-3 flex-shrink-0">{formatCurrency(invoice.total)}</p>
                      </button>
                    ))}
                  </div>
                )}

                {results.reports.length > 0 && (
                  <div className="py-2">
                    <p className="px-4 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Diagnostic Reports</p>
                    {results.reports.map((report) => (
                      <button
                        key={report.id}
                        onClick={() => goTo(`/diagnostic-reports/${report.id}`)}
                        className="w-full flex items-center px-4 py-2.5 hover:bg-[#A855F7]/10 transition-all text-left"
                      >
                        <Stethoscope className="w-4 h-4 text-[#A855F7] mr-3 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{report.report_number}</p>
                          <p className="text-xs text-gray-400 truncate">{report.customers?.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative p-2 text-gray-400 hover:text-white hover:bg-[#A855F7]/10 rounded-xl transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0D0D0D]"></span>
        </button>

        <div className="h-10 w-[1px] bg-[#1A1A1A]"></div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white leading-none">{session?.user?.name || "Workshop Admin"}</p>
            <p className="text-[10px] font-bold text-white uppercase tracking-widest mt-1">Administrator</p>
          </div>
          <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center border border-[#222222]">
            <User className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
