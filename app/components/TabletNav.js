"use client";
import { useState, useEffect } from "react";
import { Menu, X, Home, Tag } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Logo from "./Logo";

export default function MobileMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) console.error("Error fetching categories:", error);
      else setCategories(data);
    };
    fetchCategories();
  }, []);

  // Close menu and scroll to the top
  const handleCategoryClick = () => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="md:hidden block">
      {/* Menu Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        className="relative z-50 p-1 mr-2 text-white hover:bg-gray-800 transition"
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        } z-40`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      {/* Sidebar Menu */}
      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl p-6 flex flex-col transform transition-transform duration-300 z-50 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Mobile navigation menu"
      >
        <div className="flex items-center justify-between mb-8">
          <Logo height={40} />
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            <X size={24} className="text-gray-700" />
          </button>
        </div>

        <nav className="flex flex-col space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
          <Link
            href="/"
            onClick={handleCategoryClick}
            className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 font-semibold transition"
          >
            <Home size={22} />
            Home
          </Link>

          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products/category?category_id=${category.id}`}
              onClick={handleCategoryClick}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 font-semibold transition"
            >
              <Tag size={20} />
              {category.category}
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
}
