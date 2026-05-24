import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("quotations")
    .select("*, quotation_items(*)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createClient();
  const { items, id: _id, created_at: _ca, quotation_items: _qi, ...quotationFields } = await request.json();

  const { data, error } = await supabase
    .from("quotations")
    .update({ ...quotationFields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (items !== undefined) {
    const { error: deleteError } = await supabase
      .from("quotation_items")
      .delete()
      .eq("quotation_id", id);

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });

    if (items.length > 0) {
      const { error: insertError } = await supabase
        .from("quotation_items")
        .insert(
          items.map(({ id: _id, created_at: _ca, quotation_id: _qid, ...item }: Record<string, unknown>) => ({
            ...item,
            quotation_id: id,
            total: Number(item.quantity) * Number(item.unit_price),
          }))
        );

      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createClient();
  const { error } = await supabase.from("quotations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
