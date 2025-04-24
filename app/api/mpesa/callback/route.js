import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();

    const callback = body.Body.stkCallback;
    const checkoutRequestID = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;
    const resultDesc = callback.ResultDesc;

    let status = "failed";
    if (resultCode === 0) status = "paid";

    // Update payment status in DB
    const { data, error } = await supabase
      .from("payments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("mpesa_checkout_request_id", checkoutRequestID)
      .select()
      .single();

    if (error) {
      console.error("Failed to update payment status:", error);
      return NextResponse.json({ message: "Failed to update payment status" }, { status: 500 });
    }

    // Send confirmation email on success or failure
    if (data && data.email) {
      try {
        if (status === "paid") {
          await resend.emails.send({
            from: "onboarding@resend.dev",
            to: data.email,
            subject: "Payment Successful",
            html: `<p>Dear customer,</p><p>Your payment was successful. Thank you for your purchase!</p>`,
          });
        } else {
          await resend.emails.send({
            from: "onboarding@resend.dev",
            to: data.email,
            subject: "Payment Failed",
            html: `<p>Dear customer,</p><p>Your payment failed or was cancelled. Please try again or use an alternative payment method.</p>`,
          });
        }
      } catch (emailErr) {
        console.error("Error sending payment email:", emailErr);
      }
    }

    return NextResponse.json({ message: "Payment status updated" });
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
