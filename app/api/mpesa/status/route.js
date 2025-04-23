import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request) {
  const url = new URL(request.url);
  const checkoutRequestId = url.searchParams.get("checkoutRequestId");

  if (!checkoutRequestId) {
    return NextResponse.json({ error: "Missing checkoutRequestId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("payments")
    .select("status")
    .eq("mpesa_checkout_request_id", checkoutRequestId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  return NextResponse.json({ status: data.status });
}
