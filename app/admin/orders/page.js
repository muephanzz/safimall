"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminLayout from "@/components/AdminLayout";
import withAdminAuth from "@/components/withAdminAuth";
import Image from "next/image";
import toast from "react-hot-toast"; // Notifications
import { Loader2, Trash2, RefreshCw } from "lucide-react"; // Icons

const statusSteps = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchOrders();
  }, [filter, sortOrder]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);

    try {
      let query = supabase.from("orders").select("*");

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      query = query.order("order_id", { ascending: sortOrder === "asc" });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders.");
      } else {
        setOrders(data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [filter, sortOrder]);

  const handleStatusUpdate = async (order_id, newStatus) => {
    const validTransitions = {
      pending: ["paid", "cancelled"],
      paid: ["processing", "shipped", "cancelled"],
      processing: ["shipped", "completed", "cancelled"], // Corrected this line
      shipped: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    const currentStatus = orders.find((order) => order.order_id === order_id)?.status;

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      toast.error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      return;
    }

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("order_id", order_id);

      if (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update order status.");
      } else {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update order status.");
    }
  };

  const handleDelete = async (order_id) => {
    const confirmation = window.confirm("Are you sure you want to delete this order?");
    if (!confirmation) return;

    try {
      const { error } = await supabase.from("orders").delete().eq("order_id", order_id);

      if (error) {
        console.error("Error deleting order:", error);
        toast.error("Failed to delete order.");
      } else {
        toast.success("Order deleted successfully.");
        fetchOrders();
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order.");
    }
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Manage Orders</h1>

      {/* Filters and Sort */}
      <div className="flex flex-wrap checkout_items-center gap-4 mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:border-blue-300 bg-white text-gray-700"
        >
          <option value="all">All Statuses</option>
          {statusSteps.map((status) => (
            <option
              key={status}
              value={status}
              className="capitalize" // Capitalize status
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="p-2 border rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:border-blue-300 bg-white text-gray-700"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>

        <button
          onClick={handleRefresh}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-200 transition-colors"
        >
          <RefreshCw size={16} className="inline-block mr-2" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center checkout_items-center min-h-[50vh]">
          <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-gray-600">No orders found.</p>
      ) : (
        <ul className="space-y-6">
          {orders.map((order) => {
            const checkout_items = typeof order.checkout_items === "string" ? JSON.parse(order.checkout_items) : order.checkout_items;

            return (
              <li
                key={order.order_id}
                className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200"
              >
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:checkout_items-start gap-3 mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order ID: <span className="text-blue-600">{order.order_id}</span>
                      </h3>
                      <p className="text-sm text-gray-500">
                        User ID: {order.user_id} | Email: {order.email}
                      </p>
                      <p className="text-gray-700 mt-2">
                        Shipping: {order.shipping_address}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-semibold text-gray-800">
                        Total: Ksh {order.total}
                      </span>
                      <span
                        className={`inline-flex checkout_items-center px-3 py-0.5 rounded-full text-sm font-medium capitalize ml-2 ${statusColors[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Order Progress
                    </h4>
                    <div className="flex justify-between checkout_items-center relative">
                      {statusSteps.map((step, index) => {
                        const isActive = statusSteps.indexOf(order.status) >= index;
                        const isCompleted = statusSteps.indexOf(order.status) > index;
                        return (
                          <div key={index} className="flex-1 flex flex-col checkout_items-center">
                            <div
                              className={`w-6 h-6 rounded-full z-10 flex checkout_items-center justify-center ${
                                isActive ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-700"
                              }`}
                            >
                              {isCompleted && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="w-4 h-4"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M19.916 4.626a.75.75 0 010 1.061l-9.9 9.9-5.21-5.21a.75.75 0 011.06-1.06l4.68 4.68 9.39-9.39a.75.75 0 011.06 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <span
                              className={`text-xs mt-1 ${
                                isActive ? "text-blue-600" : "text-gray-400"
                              }`}
                            >
                              {step}
                            </span>
                            {index < statusSteps.length - 1 && (
                              <div
                                className={`absolute top-3 w-full h-1 ${
                                  isCompleted ? "bg-blue-400" : "bg-gray-200"
                                }`}
                                style={{ zIndex: 0 }}
                              ></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* checkout_items */}
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                      checkout_items:
                    </h4>
                    {checkout_items?.length > 0 ? (
                      <ul className="space-y-3">
                        {checkout_items.map((item, index) => (
                          <li key={index} className="flex checkout_items-center gap-4">
                            <Image
                              src={item.image_url}
                              width={80}
                              height={80}
                              alt={item.name}
                              className="rounded object-cover shadow-sm"
                            />
                            <div>
                              <p className="font-medium text-gray-800">{item.name}</p>
                              <p className="text-gray-600">Qty: {item.quantity}</p>
                              <p className="text-blue-600 font-semibold">
                                Ksh {item.price}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">Unable to load checkout_items.</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap justify-end gap-2">
                    {statusSteps.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(order.order_id, status)}
                        disabled={order.status === status}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors focus:outline-none focus:ring focus:ring-blue-200
                          ${
                            order.status === status
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-blue-500 text-white hover:bg-blue-600"
                          }`}
                      >
                        Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                    <button
                      onClick={() => handleDelete(order.order_id)}
                      className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-red-200 transition-colors"
                    >
                      <Trash2 size={16} className="inline-block mr-2" />
                      Delete Order
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminLayout>
  );
};

export default withAdminAuth(ManageOrders);
