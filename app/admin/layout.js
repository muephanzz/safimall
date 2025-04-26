"use client";
import { useState } from "react";
import withAdminAuth from "@/components/withAdminAuth";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Hamburger Menu (Mobile) */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 text-black p-2 rounded-md shadow-md z-50"
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-gray-900 text-white flex flex-col p-6 shadow-lg z-40 transform transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:z-30`}
      >
        <h2 className="text-2xl font-extrabold mb-8 tracking-wide select-none">
          Admin Panel
        </h2>
        <nav className="flex flex-col space-y-4 text-lg font-medium">
          <Link
            href="/"
            className="block px-3 py-2 rounded-md hover:bg-green-600 hover:text-white transition"
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
            className="block px-3 py-2 rounded-md hover:bg-blue-600 hover:text-white transition"
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
      <main
        className={`flex-1 overflow-y-auto max-h-screen p-0 sm:p-0 md:p-0 lg:p-8 relative transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-0"
        } lg:translate-x-64`}
      >
        {/* Fixed welcome header */}
        <header className="fixed top-0 left-0 right-0 p-2 bg-white shadow-md z-20 px-6 py-4 flex">
          <h1 className="text-2xl font-semibold items-center justify-center text-green-600 select-none">
            Welcome to Admin Dashboard
          </h1>
        </header>

        {/* Content container with padding top to avoid overlap */}
        <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl p-6 pt-20 min-h-[80vh]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default withAdminAuth(AdminLayout);
