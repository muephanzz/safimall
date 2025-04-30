export async function sendPaymentSuccessEmail({
    to,
    amount,
    items,
    shippingAddress,
    orderId,
  }: {
    to: string;
    amount: number;
    items: { name: string; quantity: number; price: number }[];
    shippingAddress: string;
    orderId: string;
  }) {
    const RESEND_API_KEY = process.env.NEXT_PUBLIC_RESEND_API_KEY || process.env.RESEND_API_KEY;
    const RESEND_API_URL = "https://api.resend.com/emails";
  
    const itemsHtml = items
      .map(
        (item) =>
          `<tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">Ksh ${item.price.toLocaleString()}</td>
          </tr>`
      )
      .join("");
  
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2a2a72;">Payment Confirmation</h2>
        <p>Dear Customer,</p>
        <p>We are pleased to inform you that your payment of <strong>Ksh ${amount.toLocaleString()}</strong> has been successfully received.</p>
        
        <h3>Order Summary (Order ID: <strong>${orderId}</strong>)</h3>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Product</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Quantity</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
  
        <h3>Shipping Address</h3>
        <p>${shippingAddress}</p>
  
        <p>You can track your order status and delivery updates by clicking the link below:</p>
        <p><a href="https://safimall.co.ke/orders/track/${orderId}" style="color: #2a2a72; text-decoration: none; font-weight: bold;">Track Your Order</a></p>
  
        <p>Thank you for shopping with SafiMall. We appreciate your business and look forward to serving you again!</p>
  
        <p>Best regards,<br/>The SafiMall Team</p>
      </div>
    `;
  
    const body = {
      from: "onboarding@resend.dev",
      to,
      subject: `Payment Confirmation - Order #${orderId}`,
      html,
    };
  
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }
  }
  