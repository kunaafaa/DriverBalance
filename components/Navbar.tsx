"use client";

import { useSession } from "next-auth/react";
import { Bell, Search, User, Menu } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="h-20 bg-[#0D0D0D] border-b border-[#1A1A1A] flex items-center justify-between px-8 z-10">
      <div className="flex items-center md:hidden">
        <Menu className="w-6 h-6 text-gray-400" />
      </div>

      <div className="hidden md:flex items-center bg-[#111111] rounded-2xl px-4 py-2 w-96 border border-[#1A1A1A] focus-within:ring-2 focus-within:ring-[#A855F7]/30 transition-all">
        <Search className="w-4 h-4 text-gray-400 mr-2" />
        <input 
          type="text" 
          placeholder="Search for customers, vehicles or invoices..."
          className="bg-transparent border-none outline-none text-sm font-medium w-full text-white placeholder:text-gray-500"
        />
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
