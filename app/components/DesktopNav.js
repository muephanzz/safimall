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
    <nav className="absolute top-20 bg-white shadow-xl hidden md:flex w-full px-6 py-3 text-[17px] font-medium justify-center space-x-6 border-b border-gray-200">
      {categories?.map((category) => {
        const isActive = categoryId === category.id.toString();
        const hasSubcategories = subcategories[category.id]?.length > 0;

        return (
          <div
            key={category.id}
            className="relative group"
          >
            <Link
              href={`/products/category?category_id=${category.id}`}
              className={`transition duration-300 px-2 py-1 rounded-md ${
                isActive
                  ? "text-blue-600 font-semibold border-b-2 border-blue-600"
                  : "text-gray-700 hover:text-blue-500"
              }`}
            >
              {category.category}
            </Link>

            {hasSubcategories && (
              <div className="absolute top-full left-0 bg-white shadow-lg border mt-2 rounded-md opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-300 min-w-[200px]">
                <ul className="py-2">
                  {subcategories[category.id].map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/products/subcategory?subcategory_id=${sub.id}`}
                        className="block px-4 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition duration-200"
                      >
                        {sub.subcategory}
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
