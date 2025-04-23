import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import axios from "axios";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function getMpesaAccessToken() {
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");

  const response = await axios.get(
    process.env.MPESA_ENV === "production"
      ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
      : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: { Authorization: `Basic ${auth}` },
    }
  );

  return response.data.access_token;
}

export async function POST(request) {
  try {
    const { amount, phone, user_id, checkoutItems, shipping_address, email } = await request.json();

    if (!phone || !amount || !user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const accessToken = await getMpesaAccessToken();

    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const shortCode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const password = Buffer.from(shortCode + passkey + timestamp).toString("base64");

    const stkPushRequest = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: shortCode,
      PhoneNumber: phone,
      CallBackURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mpesa/callback`,
      AccountReference: user_id,
      TransactionDesc: `Payment for order by user ${user_id}`,
    };

    const stkResponse = await axios.post(
      process.env.MPESA_ENV === "production"
        ? "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        : "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      stkPushRequest,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (stkResponse.data.ResponseCode !== "0") {
      return NextResponse.json(
        { error: stkResponse.data.ResponseDescription || "STK Push failed" },
        { status: 400 }
      );
    }

    // Save payment record with status pending
    const { error: dbError } = await supabase.from("payments").insert({
      user_id,
      phone_number: phone,
      amount,
      status: "pending",
      mpesa_checkout_request_id: stkResponse.data.CheckoutRequestID,
      shipping_address,
      email,
      checkout_items: checkoutItems, // you may want to JSON.stringify this if column is text/json
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Send confirmation email via Resend
    try {
      await resend.emails.send({
        from: "sales@yourdomain.com",
        to: email,
        subject: "M-Pesa Payment Initiated",
        html: `<p>Dear customer,</p>
               <p>Your payment of Ksh ${amount} has been initiated. Please complete the payment on your phone.</p>
               <p>Thank you for shopping with us.</p>`,
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Continue without failing
    }

    return NextResponse.json({ checkoutRequestId: stkResponse.data.CheckoutRequestID });
  } catch (error) {
    console.error("STK Push error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
