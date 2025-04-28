"use server";

import axios from "axios";

interface Item {
  price: number;
  quantity: number;
  image_url?: string;
  name?: string;
}

interface Params {
  mpesa_number: string;
  name: string;
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
    name,
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
      TransactionDesc: `Payment by ${name} for order with ${checkoutItems.length} items, shipping to ${shipping_address}, email: ${email}`,
    };

    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      stkPushPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return { data: response.data };
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return { error: error.message };
    }
    return { error: "Something went wrong" };
  }
};
