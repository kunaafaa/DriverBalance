"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Users,
  Car,
  Calendar,
  FileText,
  Package,
  Settings,
  LogOut
} from "lucide-react";
import { signOut } from "next-auth/react";
import Logo from "./Logo";

const menuItems = [
  { name: "Dashboard", icon: BarChart2, href: "/" },
  { name: "Customers", icon: Users, href: "/customers" },
  { name: "Vehicles", icon: Car, href: "/vehicles" },
  { name: "Appointments", icon: Calendar, href: "/appointments" },
  { name: "Invoices", icon: FileText, href: "/invoices" },
  { name: "Inventory", icon: Package, href: "/inventory" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-72 bg-[#0D0D0D] border-r border-[#1A1A1A] z-20">
      <div className="p-8">
        <Logo />
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive
                ? "bg-[#A855F7] text-white shadow-lg shadow-[#A855F7]/20 shadow-offset-y-2"
                : "text-gray-400 hover:text-white hover:bg-[#A855F7]/10"
                }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "group-hover:text-white"}`} />
              <span className="font-bold text-sm tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[#111111]">
        <button
          onClick={() => signOut()}
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-2xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout Session</span>
        </button>
      </div>
    </aside>
  );
}
