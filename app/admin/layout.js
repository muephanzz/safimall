"use client";
import withAdminAuth from "@/components/withAdminAuth";
import Link from "next/link";

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Fixed Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-64 bg-gray-900 text-white flex flex-col p-6 shadow-lg z-30">
        <h2 className="text-2xl font-extrabold mb-8 tracking-wide select-none">
          Admin Panel
        </h2>
        <nav className="flex flex-col space-y-4 text-lg font-medium">
          <Link
            href="/"
            className="block px-3 py-2 rounded-md hover:bg-blue-600 hover:text-white transition"
          >
            Home
          </Link>
          <Link
            href="/admin/products"
            className="block px-3 py-2 rounded-md hover:bg-blue-600 hover:text-white transition"
          >
            Manage Products
          </Link>
          <Link
            href="/admin/orders"
            className="block px-3 py-2 rounded-md hover:bg-green-600 hover:text-white transition"
          >
            Manage Orders
          </Link>
          <Link
            href="/admin/chat"
            className="block px-3 py-2 rounded-md hover:bg-purple-600 hover:text-white transition"
          >
            Manage Chat
          </Link>
        </nav>
        {/* Optional: Footer or user info */}
        <div className="mt-auto pt-6 border-t border-gray-700 text-sm text-gray-400 select-none">
          &copy; {new Date().getFullYear()} SafiMall Admin
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8 overflow-y-auto max-h-screen">
        {/* Container to limit max width for premium look */}
        <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl p-8 min-h-[80vh]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default withAdminAuth(AdminLayout);
