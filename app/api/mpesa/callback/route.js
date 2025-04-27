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

    let status = "pending";
    if (resultCode === 0) status = "paid";

    // Extract metadata object (if available)
    const metadata = callback.CallbackMetadata || null;

    // Update payment status and save metadata as JSON object
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .update({
        status,
        updated_at: new Date().toISOString(),
        metadata, // save the metadata object here
      })
      .eq("mpesa_checkout_request_id", checkoutRequestID)
      .select()
      .single();

    if (paymentError) {
      console.error("Failed to update payment status:", paymentError);
      return NextResponse.json(
        { message: "Failed to update payment status" },
        { status: 500 }
      );
    }

    // Update order status in DB
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("mpesa_checkout_request_id", checkoutRequestID)
      .select()
      .single();

    if (orderError) {
      console.error("Failed to update order status:", orderError);
      return NextResponse.json(
        { message: "Failed to update order status" },
        { status: 500 }
      );
    }

    // Send confirmation email on success or failure
    if (paymentData && paymentData.email) {
      try {
        const lastFiveAccNum = paymentData.order_id
          ? String(paymentData.order_id).slice(-5)
          : "XXXXX";

        if (status === "pending") {
          await resend.emails.send({
            from: "onboarding@resend.dev",
            to: paymentData.email,
            subject: "Payment Successful - Thank You for Shopping with SafiMall!",
            html: `
              <p>Dear Valued Customer,</p>
              <p>We are delighted to inform you that your payment has been <strong>successfully received</strong>. Thank you for choosing SafiMall for your purchase.</p>
              <p>Your order is now being processed and will be shipped to you shortly.</p>
              <p>If you have any questions or need assistance, feel free to reply to this email or contact our support team.</p>
              <br/>
              <p>Warm regards,<br/>The SafiMall Team</p>
              <hr/>
              <small>This is an automated message. Please do not reply directly.</small>
            `,
          });
        } else {
          await resend.emails.send({
            from: "onboarding@resend.dev",
            to: paymentData.email,
            subject: "Payment Unsuccessful - Alternative Payment Instructions",
            html: `
              <p>Dear Valued Customer,</p>
              <p>Unfortunately, we were unable to confirm your payment for your recent order.</p>
              <p>To complete your purchase, please use the manual payment option below:</p>
              <ul>
                <li><strong>Paybill Number:</strong> 123456</li>
                <li><strong>Account Number:</strong> <code>${lastFiveAccNum}</code></li>
                <li><strong>Account Name:</strong> SafiMall</li>
              </ul>
              <p>Please ensure you use the exact account number above to help us identify your payment quickly.</p>
              <p>Once you have completed the payment, your order will be verified and processed automatically.</p>
              <p>If you need any assistance, please contact our support team.</p>
              <br/>
              <p>Thank you for shopping with SafiMall!</p>
              <p>Warm regards,<br/>The SafiMall Team</p>
              <hr/>
              <small>This is an automated message. Please do not reply directly.</small>
            `,
          });
        }
      } catch (emailErr) {
        console.error("Error sending payment email:", emailErr);
      }
    }

    return NextResponse.json({ message: "Payment status updated" });
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
