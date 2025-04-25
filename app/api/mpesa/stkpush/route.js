import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import axios from "axios";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function getMpesaAccessToken() {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const url =
    process.env.MPESA_ENV === "production"
      ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
      : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  const response = await axios.get(url, {
    headers: { Authorization: `Basic ${auth}` },
  });

  return response.data.access_token;
}

export async function POST(request) {
  try {
    const {
      amount,
      phone,
      user_id,
      checkoutItems,
      shipping_address,
      email,
    } = await request.json();

    if (!phone || !amount || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get M-Pesa access token
    const accessToken = await getMpesaAccessToken();

    // Generate timestamp and password for STK Push
    const now = new Date();
    const timestamp = 
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");

    const shortCode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const password = Buffer.from(shortCode + passkey + timestamp).toString(
      "base64"
    );

    // Build STK Push request payload
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

    // Call M-Pesa STK Push API
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

    // Check STK Push response
    if (stkResponse.data.ResponseCode !== "0") {
      return NextResponse.json(
        { error: stkResponse.data.ResponseDescription || "STK Push failed" },
        { status: 400 }
      );
    }

    const checkoutRequestId = stkResponse.data.CheckoutRequestID;
    const nowISOString = new Date().toISOString();

    // Prepare data for DB inserts
    const paymentData = {
      user_id,
      phone_number: phone,
      amount,
      status: "pending",
      mpesa_checkout_request_id: checkoutRequestId,
      email,
      checkout_items: checkoutItems,
      updated_at: nowISOString,
    };

    const orderData = {
      user_id,
      amount,
      status: "pending",
      shipping_address,
      email,
      checkout_items: checkoutItems,
      updated_at: nowISOString,
      phone_number: phone,
    };

    // Insert payment record
    const { data: paymentInsertData, error: paymentError } = await supabase
      .from("payments")
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error("DB insert error (payments):", paymentError);
      return NextResponse.json(
        { error: "Database error on payments insert" },
        { status: 500 }
      );
    }

    // Insert order record
    const { data: orderInsertData, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("DB insert error (orders):", orderError);
      return NextResponse.json(
        { error: "Database error on orders insert" },
        { status: 500 }
      );
    }

    // Send confirmation email with alternative payment instructions
    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Your M-Pesa Payment Has Been Initiated - SafiMall",
        html: `
          <p>Dear Valued Customer,</p>

          <p>Thank you for shopping with SafiMall! Your payment of <strong>Ksh ${amount}</strong> has been successfully initiated.</p>

          <p>Please complete the payment on your phone when prompted by M-Pesa.</p>

          <p><em>If you do not receive the M-Pesa prompt within a few minutes, or if the payment fails, you can use the alternative manual payment method below:</em></p>

          <ul>
            <li><strong>Paybill Number:</strong> 123456</li>
            <li><strong>Account Number:</strong> <code>${checkoutRequestId ? checkoutRequestId.slice(-5) : phone_number.slice(-5)}</code></li>
            <li><strong>Amount:</strong> <code>Ksh ${amount}</code></li>
            <li><strong>Account Name:</strong> SafiMall</li>
          </ul>

          <p>Please ensure you use the exact account number above to help us identify your payment quickly.</p>

          <p>Once your payment is confirmed, your order will be processed immediately.</p>

          <p>If you need any assistance, please reply to this email or contact our support team.</p>

          <br/>
          <p>Warm regards,<br/>The SafiMall Team</p>

          <hr/>
          <small>This is an automated message. Please do not reply directly.</small>
        `,
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Continue without failing
    }

    return NextResponse.json({ checkoutRequestId });
  } catch (error) {
    console.error("STK Push error:", error.message, error.response?.data);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
