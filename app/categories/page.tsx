"use client";
import Link from "next/link";
import { Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Category = {
  id: string;
  category: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (!error) setCategories(data || []);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900 tracking-tight select-none">
        Shop by Category
      </h1>

      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <p className="text-center text-gray-500 text-lg mt-20 select-none">
          No categories available at the moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category_id=${category.id}`}
              className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-md transition hover:shadow-lg hover:bg-orange-600 hover:text-white cursor-pointer select-none"
              aria-label={`Browse products in ${category.category}`}
            >
              <Tag
                size={24}
                className="text-orange-500 group-hover:text-white transition"
                aria-hidden="true"
              />
              <span className="text-lg font-semibold">{category.category}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
