"use client";

import { useState, useEffect } from "react";
import { Menu, X, Home, Tag, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Logo from "./Logo";

interface Category {
  id: number;
  category: string;
}

interface Subcategory {
  subcategory_id: number;
  category_id: number;
  subcategory: string;
}

export default function MobileMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Record<number, Subcategory[]>>({});
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) console.error("Error fetching categories:", error);
      else if (data) setCategories(data);
    }

    async function fetchSubcategories() {
      const { data, error } = await supabase.from("subcategories").select("*");
      if (error) console.error("Error fetching subcategories:", error);
      else if (data) {
        const grouped = data.reduce((acc: Record<number, Subcategory[]>, sub) => {
          if (!acc[sub.category_id]) acc[sub.category_id] = [];
          acc[sub.category_id].push(sub);
          return acc;
        }, {});
        setSubcategories(grouped);
      }
    }

    fetchCategories();
    fetchSubcategories();
  }, []);

  // Close menu and scroll to top
  const closeMenuAndScrollTop = () => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Toggle expand/collapse on category click
  const toggleCategory = (categoryId: number) => {
    setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
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
            onClick={closeMenuAndScrollTop}
            className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 font-semibold transition"
          >
            <Home size={22} />
            Home
          </Link>

          {categories.map((category) => {
            const isExpanded = expandedCategoryId === category.id;
            const hasSubs = !!subcategories[category.id]?.length;

            return (
              <div key={category.id} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`subcategory-list-${category.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 font-semibold transition w-full"
                >
                  <div className="flex items-center gap-3">
                    <Tag size={20} />
                    <span>{category.category}</span>
                  </div>
                  {hasSubs && (isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
                </button>

                {isExpanded && hasSubs && (
                  <ul
                    id={`subcategory-list-${category.id}`}
                    className="pl-10 mt-1 flex flex-col space-y-1 max-h-48 overflow-y-auto"
                  >
                    {subcategories[category.id].map((sub) => (
                      <li key={sub.subcategory_id}>
                        <Link
                          href={`/products/subcategory/${sub.subcategory_id}`}
                          onClick={closeMenuAndScrollTop}
                          className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 transition"
                        >
                          {sub.subcategory}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
