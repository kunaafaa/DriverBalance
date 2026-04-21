import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#000000] text-white print:bg-white print:block print:h-auto">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden print:block print:overflow-visible relative z-0">
        <div className="print:hidden">
          <Navbar />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}
