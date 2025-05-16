"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Category {
  id: number;
  category: string;
}

interface Subcategory {
  subcategory_id: number;
  category_id: number;
  subcategory: string;
}

export default function VerticalMenu() {
  const pathname = usePathname();
  const subcategoryId = pathname?.split("/")[3] || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Record<number, Subcategory[]>>({});
  const [menuOpen, setMenuOpen] = useState(false); // toggle menu visibility
  const [openCategory, setOpenCategory] = useState<number | null>(null); // track open category for accordion

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

  return (
    <>
      {/* Menu Icon Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden fixed top-4 left-4 z-60 p-2 rounded-md bg-blue-600 text-white shadow-lg"
        aria-label="Toggle menu"
      >
        {/* Hamburger icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          {menuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Vertical Menu */}
      <nav
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-blue-600 via-indigo-600 to-purple-600 shadow-2xl z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } md:flex md:flex-col md:w-auto md:h-auto md:bg-transparent md:shadow-none md:translate-x-0`}
      >
        <ul className="flex flex-col space-y-2 p-6 md:p-0 md:space-y-4 text-white font-semibold text-lg">
          {categories.map((category) => {
            const hasSubcategories = subcategories[category.id]?.length > 0;
            const isOpen = openCategory === category.id;

            return (
              <li key={category.id}>
                <button
                  onClick={() => setOpenCategory(isOpen ? null : category.id)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <span>{category.category}</span>
                  {hasSubcategories && (
                    <svg
                      className={`w-5 h-5 text-yellow-300 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {/* Subcategories Accordion */}
                {hasSubcategories && isOpen && (
                  <ul className="mt-1 ml-4 border-l border-indigo-400 pl-3 space-y-1">
                    {subcategories[category.id].map((sub) => {
                      const isActive = subcategoryId === sub.subcategory_id.toString();

                      return (
                        <li key={sub.subcategory_id}>
                          <Link
                            href={`/products/subcategory/${sub.subcategory_id}`}
                            className={`block py-1 text-indigo-200 hover:text-white hover:font-bold ${
                              isActive ? "font-bold text-white" : ""
                            }`}
                            onClick={() => setMenuOpen(false)} // close menu on link click (optional)
                          >
                            {sub.subcategory}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
