"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DesktopMenu() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category_id");
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});

  useEffect(() => {
    const fetchCategories = async () => {
      const { data: categoriesData, error } = await supabase.from("categories").select("*");
      if (error) console.error("Error fetching categories:", error);
      else setCategories(categoriesData);
    };

    const fetchSubcategories = async () => {
      const { data: subData, error } = await supabase.from("subcategories").select("*");
      if (error) console.error("Error fetching subcategories:", error);
      else {
        const grouped = subData.reduce((acc, sub) => {
          acc[sub.category_id] = acc[sub.category_id] || [];
          acc[sub.category_id].push(sub);
          return acc;
        }, {});
        setSubcategories(grouped);
      }
    };

    fetchCategories();
    fetchSubcategories();
  }, []);

  return (
    <nav className="absolute mt-24 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-2xl hidden md:flex w-full px-10 py-3 text-[18px] font-semibold space-x-8 rounded-b-3xl border-b-2 border-blue-700">
      {categories?.map((category) => {
        const isActive = categoryId === category.id.toString();
        const hasSubcategories = subcategories[category.id]?.length > 0;

        return (
          <div key={category.id} className="relative group">
            <Link
              href={`/products/category?category_id=${category.id}`}
              className={`transition-all duration-300 px-4 py-2 rounded-xl flex items-center gap-2
                ${isActive
                  ? "bg-white/90 text-indigo-700 shadow font-bold border-b-4 border-indigo-700"
                  : "text-white hover:bg-indigo-500/80 hover:text-yellow-200 hover:shadow-lg"
                }
              `}
            >
              {category.category}
              {hasSubcategories && (
                <svg className="ml-1 w-4 h-4 text-yellow-300 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7"/>
                </svg>
              )}
            </Link>

            {hasSubcategories && (
              <div className="absolute left-0 top-full min-w-[220px] mt-3 bg-white/95 rounded-2xl shadow-2xl border border-indigo-100 opacity-0 group-hover:opacity-100 group-hover:visible invisible pointer-events-none group-hover:pointer-events-auto transition-all duration-300 backdrop-blur-xl">
                <ul className="py-3">
                  {subcategories[category.id].map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/products/category?category_id=${category.id}/subcategory_id=${sub.id}`}
                        className="block px-6 py-2 text-gray-700 font-medium rounded-lg hover:bg-gradient-to-r hover:from-indigo-100 hover:to-blue-100 hover:text-indigo-700 transition-all duration-200"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
