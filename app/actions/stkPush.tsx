"use server";

import axios from "axios";
import { supabase } from "@/lib/supabaseClient"; // adjust import path as needed

interface Item {
  price: number;
  quantity: number;
  image_url?: string;
  name?: string;
}

interface Params {
  mpesa_number: string;
  amount: number;
  user_id: string;
  checkoutItems: Item[];
  shipping_address: string;
  email: string;
}

export const sendStkPush = async (body: Params) => {
  const mpesaEnv = process.env.MPESA_ENVIRONMENT;
  const MPESA_BASE_URL =
    mpesaEnv === "live"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

  const {
    mpesa_number: phoneNumber,
    amount,
    user_id,
    checkoutItems,
    shipping_address,
    email,
  } = body;

  try {
    // Generate authorization token
    const auth: string = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString("base64");

    const resp = await axios.get(
      `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          authorization: `Basic ${auth}`,
        },
        timeout: 20000, // 20 seconds, adjust as needed
      }
    );

    const token = resp.data.access_token;

    // Clean and format phone number for M-Pesa
    const cleanedNumber = phoneNumber.replace(/\D/g, "");
    const formattedPhone = `254${cleanedNumber.slice(-9)}`;

    // Timestamp and password for STK push
    const date = new Date();
    const timestamp =
      date.getFullYear().toString() +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      ("0" + date.getDate()).slice(-2) +
      ("0" + date.getHours()).slice(-2) +
      ("0" + date.getMinutes()).slice(-2) +
      ("0" + date.getSeconds()).slice(-2);

    const password: string = Buffer.from(
      process.env.MPESA_SHORTCODE! + process.env.MPESA_PASSKEY + timestamp
    ).toString("base64");

    // Insert initial payment record with status 'pending'
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id,
        phone_number: formattedPhone,
        amount,
        status: "pending",
        email,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error inserting payment:", paymentError);
      return { error: "Database error inserting payment" };
    }

    // Insert initial order record with status 'pending'
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id,
        phone_number: formattedPhone,
        amount,
        status: "pending",
        shipping_address,
        email,
        items: checkoutItems, // store as JSON
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error inserting order:", orderError);
      return { error: "Database error inserting order" };
    }

    // Build the STK Push request payload
    const stkPushPayload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: user_id, // Use user_id or any identifier you want
      TransactionDesc: `Payment for order with ${checkoutItems.length} items, shipping to ${shipping_address}, email: ${email}`,
    };

    // Call M-Pesa STK Push API
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      stkPushPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Update payment record with CheckoutRequestID from M-Pesa response
    const checkoutRequestId = response.data.CheckoutRequestID;

    await supabase
      .from("payments")
      .update({
        mpesa_checkout_request_id: checkoutRequestId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentData.id);

    // Optionally update orders table with mpesa_checkout_request_id if you track it there
    await supabase
      .from("orders")
      .update({
        mpesa_checkout_request_id: checkoutRequestId,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderData.id);

    return { data: response.data };
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return { error: error.message };
    }
    return { error: "Something went wrong" };
  }
};
