import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  
  // Try fetching from service_history table. Fallback if the table isn't seeded yet.
  const { data, error } = await supabase
    .from("service_history")
    .select("*")
    .eq("vehicle_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase Error (History API):", error);
    // Return empty array instead of throwing to prevent crashing the UI while schema is finalizing
    return NextResponse.json([]);
  }

  return NextResponse.json(data || []);
}
