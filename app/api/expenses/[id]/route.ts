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
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const body = await request.json();

  if ("amount" in body) body.amount = Number(body.amount) || 0;
  if ("vat_amount" in body) body.vat_amount = Number(body.vat_amount) || 0;
  if ("receipt_url" in body && !body.receipt_url) body.receipt_url = null;
  body.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("expenses")
    .update(body)
    .eq("id", id)
    .select();

  if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  return NextResponse.json(data[0]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) return NextResponse.json({ error: "Something went wrong" }, { status: 400 });

  return NextResponse.json({ success: true });
}
