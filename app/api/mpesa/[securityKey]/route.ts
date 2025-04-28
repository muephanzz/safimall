import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient"; // Adjust import path as needed

interface Params {
  params: {
    securityKey: string;
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  const clientIp = request.headers.get('x-forwarded-for') ?? request.headers.get('remote-addr');
  const whitelist = [
    '196.201.214.200', '196.201.214.206', '196.201.213.114',
    '196.201.214.207', '196.201.214.208', '196.201.213.44',
    '196.201.212.127', '196.201.212.138', '196.201.212.129',
    '196.201.212.136', '196.201.212.74', '196.201.212.69'
  ];

  // IP whitelist check
  if (!clientIp || !whitelist.includes(clientIp)) {
    return NextResponse.json({ error: 'IP not whitelisted' }, { status: 403 });
  }

  // Security key validation
  const { securityKey } = params;
  if (securityKey !== process.env.MPESA_CALLBACK_SECRET_KEY) {
    return NextResponse.json({ error: 'Invalid security key' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const callback = data.Body.stkCallback;
    
    // Extract critical information
    const checkoutRequestId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;
    const resultDesc = callback.ResultDesc;
    const metadata = callback.CallbackMetadata?.Item || [];

    // Find payment record using checkoutRequestId
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('mpesa_checkout_request_id', checkoutRequestId)
      .single();

    if (paymentError || !paymentData) {
      console.error('Payment not found:', checkoutRequestId);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      status: resultCode === '0' ? 'paid' : 'failed',
      updated_at: new Date().toISOString(),
      metadata: {
        callback_data: data,
        result_code: resultCode,
        result_description: resultDesc
      }
    };

    // Extract values from metadata if payment succeeded
    if (resultCode === '0') {
      const amount = metadata.find((i: any) => i.Name === 'Amount')?.Value;
      const mpesaCode = metadata.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
      const phoneNumber = metadata.find((i: any) => i.Name === 'PhoneNumber')?.Value?.toString();

      Object.assign(updateData, {
        amount: amount || paymentData.amount,
        mpesa_code: mpesaCode,
        phone_number: phoneNumber || paymentData.phone_number
      });
    }

    // Update payment record
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentData.id);

    if (updatePaymentError) {
      console.error('Payment update failed:', updatePaymentError);
      throw new Error('Failed to update payment');
    }

    return NextResponse.json("ok", { status: 200 });

  } catch (error: any) {
    console.error('Callback processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
