"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import Image from "next/image";
import { motion } from "framer-motion";
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
  const getStatusIndex = (status) => statusSteps.indexOf(status);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return;

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("order_id, status, total, shipping_address, checkout_items")
      .eq("user_id", user.id);

    if (!orderError && orderData) {
      const parsedOrders = orderData.map(order => ({
        ...order,
        checkout_items: typeof order.checkout_items === 'string' ? JSON.parse(order.checkout_items) : order.checkout_items,
      }));
      setOrders(parsedOrders);
    }
  };


  const copyToClipboard = (orderId) => {
    navigator.clipboard.writeText(orderId);
    toast.success("Order ID copied!");
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
      // Parse checkout_items here
      if (typeof data.checkout_items === 'string') {
        data.checkout_items = JSON.parse(data.checkout_items);
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

  const simulateShipmentTracking = (status) => {
    if (status === "shipped" || status === "completed") {
      setTrackingInfo({
        courier: "SwiftX Delivery",
        trackingNumber: "SWX12345678KE",
        expectedArrival: "2 - 4 days",
        currentLocation: "Nairobi Dispatch Center",
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
    const margin = 14;
    let yPos = margin;

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
    doc.link("www.safimall.com", pageWidth / 2, yPos, { align: "center" });
    yPos += 4;
    doc.text("0798229783", pageWidth / 2, yPos, { align: "center" });
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
    doc.text(`STATUS: ${order.status.toUpperCase()}`, margin, yPos);
    yPos += 8;

    // checkout_Items Table
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    doc.text("ITEM", margin, yPos);
    doc.text("QTY", pageWidth - margin - 20, yPos, { align: "right" });
    doc.text("TOTAL", pageWidth - margin, yPos, { align: "right" });
    yPos += 6;

    order.checkout_items.forEach(item => {
      doc.text(item.name.substring(0, 22), margin, yPos);
      doc.text(`${item.quantity}x`, pageWidth - margin - 20, yPos, { align: "right" });
      doc.text(`Ksh ${(item.price * item.quantity).toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
      yPos += 6;
    });

    // Totals
    yPos += 6;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;
    doc.text("SUBTOTAL:", pageWidth - margin - 40, yPos);
    doc.text(`Ksh ${order.amount.toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
    yPos += 6;
    doc.text("VAT (16%):", pageWidth - margin - 40, yPos);
    doc.text(`Ksh ${(order.amount * 0.16).toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
    yPos += 6;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", pageWidth - margin - 40, yPos);
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
    <div className="mt-28 p-6 max-w-6xl mx-auto bg-gradient-to-br from-white to-slate-100 shadow-2xl rounded-3xl border border-gray-200">
      <div className="max-w-4xl mx-auto">
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

          {order && (
            <div className="space-y-8">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                      Order #{order.order_id}
                    </h2>
                    <p className="text-slate-600 mt-1">
                      Placed on {format(new Date(order.created_at), "PPp")}
                    </p>
                  </div>
                  <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {order.status.toUpperCase()}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-medium text-slate-700">Shipping Address</h3>
                    <p className="text-slate-600">{order.shipping_address}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-slate-700">Payment Method</h3>
                    <p className="text-slate-600">Mobile Money (M-Pesa)</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Order Items:</h3>
                {order.checkout_items && order.checkout_items.length > 0 ? (
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
                        {order.checkout_items.map((item, index) => (
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
                  <Button onClick={() => downloadPDF(order)}>Download Receipt</Button>
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
    </div>
  );
}
