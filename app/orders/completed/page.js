"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { utils, writeFile } from "xlsx";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";

const CompletedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewAll, setViewAll] = useState(false); // for toggle
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const { user, setUser } = useAuth();
  const router = useRouter();

  const OrderItems = ({ order }) => {
    const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;

    return (
      <ul className="grid gap-4 mt-2">
        {items?.length > 0 ? (
          items.map((item, index) => (
            <li key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b pb-4">
              <Image
                src={item.image_url}
                width={80}
                height={80}
                className="rounded-lg"
                alt={item.name}
              />
              <div className="flex-1">
                <h3 className="text-lg font-medium">{item.name}</h3>
                <p className="text-gray-700">Quantity: {item.quantity}</p>
                <p className="text-blue-600 font-bold">Ksh {item.price}</p>
              </div>
              {isAdmin && viewAll || !isAdmin && viewAll || (
                <Button
                  onClick={() => router.push(`/upload-review/${item.product_id}`)}
                  className="text-sm"
                >
                  Write a Review
                </Button>
              )}
            </li>
          ))
        ) : (
          <li>Unable to load items.</li>
        )}
      </ul>
    );
  };

  useEffect(() => {
    fetchCompletedOrders();
  }, [dateRange, viewAll]);

  const fetchCompletedOrders = async () => {
    setLoading(true);
    const { data, error: userError } = await supabase.auth.getUser();
    const user = data?.user;

    if (userError || !user) {
      console.error("Error fetching user or user not logged in:", userError);
      setLoading(false);
      return;
    }

    setUser(user);

    const { data: isAdminData, error: adminError } = await supabase.rpc("check_is_admin", {
      uid: user.id,
    });

    if (adminError) console.error("Admin check error:", adminError);
    const admin = isAdminData || false;
    setIsAdmin(admin);

    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    let filteredOrders = ordersData;

    if (!admin || !viewAll) {
      filteredOrders = ordersData?.filter((order) => order.user_id === user.id);
    }

    if (ordersError) console.error("Orders fetch error:", ordersError);
    setOrders(filteredOrders || []);
    setLoading(false);
  };

  const downloadPDF = async (orders) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const logo = await fetch("/default-avatar.jpg")
      .then((res) => res.blob())
      .then((blob) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      }));

    doc.addImage(logo, "JPG", pageWidth / 2 - 15, 10, 30, 15);
    doc.setFontSize(18);
    doc.setTextColor("#1E3A8A");
    doc.text("Milimani Online Shopping", pageWidth / 2, 30, { align: "center" });
    doc.setFontSize(13);
    doc.setTextColor("#374151");
    doc.text("Completed Orders Report", pageWidth / 2, 38, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor("#6B7280");
    doc.text(`Downloaded on: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, 14, 45);

    const tableData = await Promise.all(
      orders.map(async (order) => {
        const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
        const firstItem = items?.[0] || {};
        return [
          { content: order.order_id, rowSpan: 1 },
          { content: format(new Date(order.created_at), "dd MMM yyyy"), rowSpan: 1 },
          { content: `${order.firt_name} ${order.last_name}`, rowSpan: 1 },
          { content: order.shipping_address, rowSpan: 1 },
          { content: order.total.toLocaleString(), rowSpan: 1 },
          { content: items?.length > 0 ? items.map(item => `${item.name} (Qty: ${item.quantity})`).join('\n') : 'No items', rowSpan: 1 }
        ];
      })
    );

    autoTable(doc, {
      startY: 50,
      head: [["Order ID", "Date", "Customer", "Address", "Total", "Items"]],
      body: tableData,
      styles: {
        cellPadding: 5,
        fontSize: 9,
        overflow: 'linebreak',
        tableWidth: 'auto'
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 18 },
        5: { cellWidth: 50 }
      }
    });

    doc.save("completed_orders.pdf");
  };

  const downloadExcel = async (orders) => {
    const wb = utils.book_new();
    const wsName = "Completed Orders";
    const ws = utils.aoa_to_sheet([
      ["Order ID", "Date", "Customer", "Address", "Total", "Items"],
      ...orders.map((order) => {
        const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
        return [
          order.order_id,
          format(new Date(order.created_at), "dd MMM yyyy"),
          `${order.firt_name} ${order.last_name}`,
          order.shipping_address,
          order.total.toLocaleString(),
          items?.length > 0 ? items.map(item => `${item.name} (Qty: ${item.quantity})`).join(', ') : 'No items'
        ];
      }),
    ]);
    utils.book_append_sheet(wb, ws, wsName);
    writeFile(wb, "completed_orders.xlsx");
  };

  return (
    <section className="bg-gray-100 flex justify-center items-center">
      <div className="min-h-screen md:w-3/4 w-full bg-gradient-to-br from-slate-50 to-blue-50 mb-20 lg:py-24 px-0 sm:px-0 lg:px-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Completed Orders Management
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Overview of all completed orders.
            </p>
          </div>

          <div className="p-6">
            {/* Date Range and View All Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
              {isAdmin &&(
              <>
                <div className="flex items-center space-x-3">
                  <label htmlFor="from" className="block text-sm font-medium text-gray-700">From:</label>
                  <input
                    type="date"
                    id="from"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  />

                  <label htmlFor="to" className="block text-sm font-medium text-gray-700">To:</label>
                  <input
                    type="date"
                    id="to"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  />
                </div>
    
                <div className="flex items-center">
                  <label htmlFor="viewAll" className="mr-2 text-sm font-medium text-gray-700">View All Orders:</label>
                  <input
                    type="checkbox"
                    id="viewAll"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={viewAll}
                    onChange={() => setViewAll(!viewAll)}
                  />
                </div>
              </>
              )}
              </div>

            {/* Orders List */}
            {loading ? (
              <div className="text-center">Loading orders...</div>
            ) : orders.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <li key={order.order_id} className="py-4">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-gray-900">
                        Order ID: {order.order_id}
                      </div>
                      <div className="text-sm text-gray-500">
                        Placed on: {format(new Date(order.created_at), "dd MMM yyyy")}
                      </div>
                    </div>
                    <div className="mt-2">
                      <OrderItems order={order} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center">No completed orders found.</div>
            )}

            {/* Export Buttons */}
            {isAdmin &&(
              <div className="mt-6 flex justify-end space-x-3">
              <Button onClick={() => downloadExcel(orders)}>
                Export to Excel
              </Button>
              <Button onClick={() => downloadPDF(orders)}>
                Export to PDF
              </Button>
            </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompletedOrders;
