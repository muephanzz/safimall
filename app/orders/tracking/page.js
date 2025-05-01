"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import Image from "next/image";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";
import { format } from "date-fns";

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState(null);

  const statusSteps = ["pending", "paid", "processing", "shipped", "completed"];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return;

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("order_id, status, total, shipping_address, items")
      .eq("user_id", user.id);

    if (!orderError && orderData) {
      const parsedOrders = orderData.map(order => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      }));
      setOrders(parsedOrders);
    }
  };

  const handleTrackOrder = async () => {
    setLoading(true);
    setError("");
    setOrder(null);

    if (!orderId.trim()) {
      toast.error("Order number cannot be empty!");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error || !data) {
      toast.error(`No order found for "${orderId}"`);
    } else {
      // Parse items here
      if (typeof data.items === 'string') {
        data.items = JSON.parse(data.items);
      }

      setOrder(data);
      simulateShipmentTracking(data.status);
    }

    setLoading(false);
  };

  const handleCancelOrder = async () => {
    if (!order || !["pending", "paid"].includes(order.status)) {
      toast.error("Order cannot be cancelled after processing.");
      return;
    }

    setUpdating(true);
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("order_id", order.order_id);

    if (!error) {
      setOrder((prev) => ({ ...prev, status: "cancelled" }));
      toast.success("Order cancelled!");
    } else {
      toast.error("Failed to cancel the order.");
    }

    setUpdating(false);
  };
  
  const getExpectedArrival = (order) => {
    if (!order?.updated_at) return "N/A";
  
    const updatedAt = new Date(order.updated_at);
    const arrival = new Date(updatedAt.getTime() + 40 * 60000); // 40 minutes after updated_at
  
    return `Today ${arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };  
  
  const simulateShipmentTracking = (status, shippingAddress) => {
    if (status === "pending") {
      setTrackingInfo({
        status,
        message: "Your order is pending. We will confirm your payment shortly.",
        progress: 0,
        courier: null,
        helpNumber: null,
        expectedArrival: null,
        currentLocation: null,
      });
    } else if (status === "paid") {
      setTrackingInfo({
        status,
        message: "Your payment has been received. Your order is being prepared.",
        progress: 25,
        courier: null,
        helpNumber: null,
        expectedArrival: null,
        currentLocation: null,
      });
    } else if (status === "processing") {
      setTrackingInfo({
        status,
        message: "Your order is being processed and will be delivered soon.",
        progress: 50,
        courier: null,
        helpNumber: null,
        expectedArrival: null,
        currentLocation: null,
      });
    } else if (status === "shipped") {
      setTrackingInfo({
        status,
        message: null,
        courier: "Personal Car",
        helpNumber: "0798229783",
        expectedArrival: getExpectedArrival(),
        currentLocation: "On the way to" + " " + order.shipping_address || "On the way",
        progress: 75,
      });
    } else if (status === "completed") {
      setTrackingInfo({
        status,
        message: null,
        courier: "Personal Car",
        helpNumber: "0798229783",
        expectedArrival: "Delivered",
        currentLocation: "Delivered to customer",
        progress: 100,
      });
    } else {
      setTrackingInfo(null);
    }
  };
  
  const downloadPDF = async (order) => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: [80, 297], // Standard thermal receipt width
      hotfixes: ["pxscaling"] // Better pixel scaling
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 4;
    let yPos = 14;

    // Generate QR Code
    const qrCodeData = await QRCode.toDataURL(order.order_id, {
      margin: 2,
      width: 60
    });

    // Header Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("SafiMall Online Shopping", pageWidth / 2, yPos, { align: "center" });
    yPos += 6;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("P.O Box 068-60100, Embu", pageWidth / 2, yPos, { align: "center" });
    yPos += 4;
    doc.text("www.safimall.com, 0798229783", pageWidth / 2, yPos, { align: "center" });
    yPos += 4;
    doc.text("VAT No: P051XXXXXXXX", pageWidth / 2, yPos, { align: "center" });
    yPos += 8;

    // Order Meta
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.text(`ORDER: #${order.order_id}`, margin, yPos);
    yPos += 5;
    doc.text(`DATE: ${format(new Date(order.created_at), "dd/MM/yy HH:mm")}`, margin, yPos);
    yPos += 5;
    doc.text(`PHONE: ${"0" + (order.phone_number).slice(3)}`, margin, yPos);
    yPos += 5;
    doc.text(`NAME: ${order.profiles?.first_name}`, margin, yPos);
    yPos += 5;
    doc.text(`STATUS: ${order.status.toUpperCase()}`, margin, yPos);
    yPos += 8;

    // items Table
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    doc.text("ITEM", margin, yPos);
    doc.text("QTY", pageWidth - margin - 24, yPos, { align: "right" });
    doc.text("TOTAL", pageWidth - margin, yPos, { align: "right" });
    yPos += 6;

    order.items.forEach(item => {
      doc.text(item.name.substring(0, 22), margin, yPos);
      doc.text(`${item.quantity}x`, pageWidth - margin - 24, yPos, { align: "right" });
      doc.text(`Ksh ${(item.price * item.quantity).toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
      yPos += 6;
    });

    // Totals
    yPos += 6;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;
    doc.text("SUBTOTAL:", pageWidth - margin - 44, yPos);
    doc.text(`Ksh ${order.amount.toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
    yPos += 6;
    doc.text("VAT (16%):", pageWidth - margin - 44, yPos);
    doc.text(`Ksh ${(order.amount * 0.16).toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
    yPos += 6;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", pageWidth - margin - 44, yPos);
    doc.text(`Ksh ${(order.amount * 1.16).toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
    yPos += 10;

    // QR Code
    doc.addImage(qrCodeData, "PNG", pageWidth / 2 - 15, yPos, 30, 30);
    yPos += 35;

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Thank you for shopping with us!", pageWidth / 2, yPos, { align: "center" });
    yPos += 4;
    doc.text("Returns within 7 days with receipt", pageWidth / 2, yPos, { align: "center" });

    doc.save(`receipt_${order.order_id}.pdf`);
  };

  return (
    <div className="min-h-screen md:w-3/4 w-full bg-gradient-to-br from-slate-50 to-blue-50 py-14 lg:py-24 px-0 sm:px-0 lg:px-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <span className="bg-blue-600 text-white p-2 rounded-lg">📦</span>
          Order Tracking
        </h1>

        <div className="flex gap-4 mb-8">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter order number"
            className="flex-1 px-6 py-3 border-2 border-blue-100 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition"
          />
          <Button
            onClick={handleTrackOrder}
            className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700 rounded-xl transition-transform hover:scale-105"
            disabled={loading}
          >
            {loading ? "Searching..." : "Track Order"}
          </Button>
        </div>

        {order && trackingInfo && (
          <div className="space-y-8">
            <div className="mt-8 border-l-4 border-blue-600 bg-blue-50 p-6 rounded-xl border border-blue-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Order #{order.order_id}
                </h2>
                <p className="text-slate-600 mt-1">
                  Placed on {format(new Date(order.created_at), "PPp")}
                </p>
              </div>

              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" 
                    viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Shipment Tracking
              </h3>
              {trackingInfo.message ? (
                <p className="text-gray-700">{trackingInfo.message}</p>
                
              ) : (
                <>
                  <div className="mb-6">
                    <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${trackingInfo.progress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-sm text-gray-600">
                      {statusSteps.map((step, index) => (
                        <span
                          key={step}
                          className={index * 25 <= trackingInfo.progress ? "text-blue-600" : ""}
                        >
                          {step.charAt(0).toUpperCase() + step.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>
                      <p className="text-gray-500">Shipping Address</p>
                      <p className="font-medium">{order.shipping_address}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Payment Method</p>
                      <p className="font-medium">Mobile Money (M-Pesa)</p>
                    </div>
                    <div>
                      <p className="font-semibold">Courier</p>
                      <p>{trackingInfo.courier || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Help Number</p>
                      {trackingInfo.helpNumber ? (
                        <a href={`tel:${trackingInfo.helpNumber}`} className="text-blue-600 underline">
                          {trackingInfo.helpNumber}
                        </a>
                      ) : (
                        <p>N/A</p>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">Expected Arrival</p>
                      <p>{trackingInfo.expectedArrival || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Current Location</p>
                      <p>{trackingInfo.currentLocation || "N/A"}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Order Items:</h3>
              {order.items && order.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {order.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <Image
                                  src={item.image_url}
                                  width={40}
                                  height={40}
                                  className="rounded-md object-cover"
                                  alt={item.name}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{item.quantity}</div>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="text-sm text-gray-500">Ksh {item.price.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              Ksh {(item.price * item.quantity).toFixed(2)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">Unable to load items.</p>
              )}
            </div>

            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <div className="mt-6 space-y-2">
                <div className="flex justify-between font-medium">
                  <span>Subtotal</span>
                  <span>Ksh {(order.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
                <div className="flex justify-between text-blue-600 font-bold">
                  <span>Total</span>
                  <span>Ksh {(order.amount).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-8 flex justify-between items-center">
                {["paid", "processing", "shipped", "completed"].includes(order.status) && (
                  <Button 
                    onClick={() => downloadPDF(order)}
                  >
                    Download Receipt
                  </Button>
                    )}
                {["pending", "paid"].includes(order.status) && (
                  <Button
                    onClick={handleCancelOrder}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={updating}
                  >
                    {updating ? "Cancelling..." : "Cancel Order"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
