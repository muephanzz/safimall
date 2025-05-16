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

export default function JumiaDesktopMenu() {
  const pathname = usePathname();
  const subcategoryId = pathname?.split("/")[3] || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Record<number, Subcategory[]>>({});

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) {
        console.error("Error fetching categories:", error);
      } else if (data) {
        setCategories(data);
      }
    }

    async function fetchSubcategories() {
      const { data, error } = await supabase.from("subcategories").select("*");
      if (error) {
        console.error("Error fetching subcategories:", error);
      } else if (data) {
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
    <nav className="absolute mt-24 left-0 right-0 bg-gradient-to-r from-jumia-orange via-jumia-red to-jumia-purple shadow-2xl hidden md:flex w-full px-6 text-[18px] font-semibold space-x-8 rounded-b-3xl border-b-2 border-jumia-red z-50">
      {categories.map((category) => {
        const hasSubcategories = subcategories[category.id]?.length > 0;

        return (
          <div key={category.id} className="relative group">
            <div className="transition-all duration-300 px-4 py-1 rounded-xl flex items-center gap-2 cursor-default select-none text-white">
              {category.category}
              {hasSubcategories && (
                <svg
                  className="ml-1 w-4 h-4 text-yellow-300 group-hover:rotate-180 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>

            {hasSubcategories && (
              <div className="absolute left-0 top-full min-w-[220px] bg-white/95 shadow-2xl border border-jumia-red opacity-0 group-hover:opacity-100 group-hover:visible invisible pointer-events-none group-hover:pointer-events-auto transition-all duration-300 backdrop-blur-xl z-50">
                <ul className="py-3">
                  {subcategories[category.id].map((sub) => {
                    const isActive = subcategoryId === sub.subcategory_id.toString();

                    return (
                      <li key={sub.subcategory_id}>
                        <Link
                          href={`/products/subcategory/${sub.subcategory_id}`}
                          className={`flex items-center gap-2 px-4 py-1 text-gray-700 font-medium hover:bg-gradient-to-r hover:from-jumia-red-light hover:to-jumia-orange-light hover:text-jumia-red transition-all duration-200 ${
                            isActive ? "bg-jumia-red-light text-jumia-red font-bold" : ""
                          }`}
                        >
                          {sub.subcategory}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
