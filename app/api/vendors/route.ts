import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  let query = supabase.from("vendors").select("*");

  if (search) {
    query = query.or(`name.ilike.%${search}%,contact_person.ilike.%${search}%,category.ilike.%${search}%`);
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const body = await request.json();

  const { data, error } = await supabase.from("vendors").insert([body]).select();

  if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  return NextResponse.json(data[0], { status: 201 });
}
