"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { 
  TrendingUp, 
  Users, 
  Car, 
  Calendar, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { formatCurrency } from "@/lib/utils/formatting";
import Link from "next/link";

const data = [
  { name: "Jan", revenue: 4000 },
  { name: "Feb", revenue: 3000 },
  { name: "Mar", revenue: 5000 },
  { name: "Apr", revenue: 4500 },
  { name: "May", revenue: 6000 },
  { name: "Jun", revenue: 5500 },
];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("6m");

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: summary } = await axios.get(`/api/dashboard/summary?range=${timeRange}`);
        if (isMounted) setData(summary);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        if (isMounted) setError("Failed to load dashboard data. Please try again later.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDashboardData();
    return () => { isMounted = false; };
  }, [timeRange]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500 font-bold">Initializing DriverBalance intelligence...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 mb-4">
        <DollarSign className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Sync Error</h3>
      <p className="text-gray-400 max-w-md">{error}</p>
      <button 
        onClick={() => setTimeRange(timeRange)} // Re-trigger effect
        className="mt-6 px-6 py-2 bg-[#A855F7] text-white rounded-xl font-bold hover:bg-[#9333EA] transition-all"
      >
        Retry Sync
      </button>
    </div>
  );

  const stats = data?.stats || { customers: 0, vehicles: 0, appointments: 0, revenue: 0 };
  const chartData = data?.chartData || [];
  const activity = data?.activity || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Workshop Overview</h1>
          <p className="text-gray-400 font-medium">Welcome back, Admin. Here's a summary of DriverMade today.</p>
        </div>
        <div className="bg-[#0D0D0D] px-4 py-2 rounded-2xl border border-[#1A1A1A] shadow-sm flex items-center space-x-2">
          <Clock className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-gray-400">{new Date().toLocaleDateString("en-AE", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", value: formatCurrency(stats.revenue), icon: DollarSign, trend: "+12.5%" },
          { label: "Total Customers", value: stats.customers, icon: Users, trend: "+4.3%" },
          { label: "Active Vehicles", value: stats.vehicles, icon: Car, trend: "+8.1%" },
          { label: "Appointments", value: stats.appointments, icon: Calendar, trend: "-2.4%" },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#0D0D0D] p-6 rounded-3xl border border-[#1A1A1A] shadow-xl shadow-black/50 hover:shadow-purple-900/10 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 bg-[#A855F7]/10 rounded-2xl group-hover:bg-[#9333EA] transition-colors`}>
                <kpi.icon className={`w-6 h-6 text-white group-hover:text-white transition-colors`} />
              </div>
              <span className={`flex items-center text-[10px] font-black px-2 py-1 rounded-full ${kpi.trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {kpi.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {kpi.trend}
              </span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{kpi.label}</p>
            <h3 className="text-2xl font-black text-white mt-1">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#0D0D0D] p-8 rounded-3xl border border-[#1A1A1A] shadow-xl shadow-black/50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-white tracking-tight">Revenue Analytics</h3>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-[#111111] border-none outline-none rounded-xl px-4 py-2 text-xs font-bold text-gray-400 cursor-pointer hover:bg-[#1A1A1A] transition-colors"
            >
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 600}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 600}} 
                  tickFormatter={(val) => `AED ${val}`}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#111111]/90 backdrop-blur-md border border-[#1A1A1A] p-4 rounded-2xl shadow-2xl shadow-black animate-in fade-in zoom-in duration-200">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                          <p className="text-sm font-black text-[#A855F7] flex items-center">
                            Revenue: 
                            <span className="text-white ml-2">{formatCurrency(payload[0].value as number)}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#A855F7" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  activeDot={{ r: 6, fill: "#A855F7", stroke: "#FFFFFF", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0D0D0D] p-8 rounded-3xl border border-[#1A1A1A] shadow-xl shadow-black/50">
          <h3 className="text-lg font-black text-white tracking-tight mb-8">Recent Activity</h3>
          <div className="space-y-6">
            {activity.map((item: any, i: number) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-[#111111] rounded-xl flex items-center justify-center shrink-0 border border-[#1A1A1A]">
                  {item.type === 'invoice' ? <DollarSign className="w-5 h-5 text-green-500" /> : <Calendar className="w-5 h-5 text-blue-500" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{item.title}</p>
                  <p className="text-xs font-medium text-gray-400 mt-1">{item.description}</p>
                  <p className="text-[10px] font-bold text-[#A855F7] uppercase mt-2 tracking-widest">
                    {new Date(item.time).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {activity.length === 0 && (
              <div className="py-10 text-center">
                <Clock className="w-10 h-10 text-gray-500 mx-auto mb-4 opacity-20" />
                <p className="text-sm text-gray-500 font-bold">No recent business activity.</p>
              </div>
            )}
          </div>
          <Link 
            href="/appointments"
            className="block w-full mt-8 py-3 rounded-2xl bg-[#111111] text-gray-400 text-center text-xs font-black uppercase tracking-widest hover:bg-[#1A1A1A] transition-all"
          >
            View All Activity
          </Link>
        </div>
      </div>
    </div>
  );
}
