"use client";
import Link from "next/link";
import { Tag, ChevronDown, ChevronUp, ShoppingBag, Star, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Category and Subcategory types
type Category = {
  id: string;
  category: string;
};

type Subcategory = {
  subcategory_id: string;
  category_id: string;
  subcategory: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Record<string, Subcategory[]>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoriesAndSubcategories = async () => {
      setLoading(true);
      const [{ data: catData, error: catError }, { data: subData, error: subError }] = await Promise.all([
        supabase.from("categories").select("*"),
        supabase.from("subcategories").select("*"),
      ]);
      if (!catError && catData) setCategories(catData);
      if (!subError && subData) {
        // Group subcategories by category_id
        const grouped: Record<string, Subcategory[]> = {};
        subData.forEach((sub: Subcategory) => {
          if (!grouped[sub.category_id]) grouped[sub.category_id] = [];
          grouped[sub.category_id].push(sub);
        });
        setSubcategories(grouped);
      }
      setLoading(false);
    };
    fetchCategoriesAndSubcategories();
  }, []);

  // Choose an icon for each subcategory (customize as needed)
  const getSubcategoryIcon = (name: string) => {
    // Example: Assign icons based on keywords
    if (/star/i.test(name)) return <Star size={20} className="text-indigo-500" />;
    if (/love|favorite|heart/i.test(name)) return <Heart size={20} className="text-pink-500" />;
    if (/bag|shopping|store/i.test(name)) return <ShoppingBag size={20} className="text-emerald-500" />;
    // Default icon
    return <Tag size={20} className="text-gray-400" />;
  };

  const handleCategoryClick = (id: string) => {
    setExpandedCategory(prev => (prev === id ? null : id));
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900 tracking-tight select-none">
        Shop by Category
      </h1>

      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <p className="text-center text-gray-500 text-lg mt-20 select-none">
          No categories available at the moment.
        </p>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => {
            const isExpanded = expandedCategory === category.id;
            const subs = subcategories[category.id] || [];
            return (
              <div
                key={category.id}
                className="bg-white rounded-2xl shadow-md transition hover:shadow-lg"
              >
                {/* Main Category Button (not a link) */}
                <button
                  type="button"
                  onClick={() => handleCategoryClick(category.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`subcat-list-${category.id}`}
                  className={`flex justify-between items-center w-full px-6 py-5 rounded-2xl text-left font-semibold text-lg tracking-tight transition-colors
                    ${isExpanded ? "bg-indigo-50 text-indigo-700" : "text-gray-900 hover:bg-indigo-50"}
                    focus:outline-none focus:ring-2 focus:ring-indigo-400`}
                >
                  <span className="flex items-center gap-3">
                    <Tag size={24} className="text-orange-500" />
                    {category.category}
                  </span>
                  <span>
                    {isExpanded ? (
                      <ChevronUp size={24} className="text-indigo-400" />
                    ) : (
                      <ChevronDown size={24} className="text-gray-400" />
                    )}
                  </span>
                </button>
                {/* Subcategories List */}
                <div
                  id={`subcat-list-${category.id}`}
                  className={`overflow-hidden transition-all duration-300 ${
                    isExpanded ? "max-h-96 py-2" : "max-h-0 py-0"
                  }`}
                >
                  {isExpanded && subs.length > 0 && (
                    <ul className="px-10 py-2 flex flex-col gap-2">
                      {subs.map((sub) => (
                        <li key={sub.subcategory_id}>
                          <Link
                            href={`/products/subcategory/${sub.subcategory_id}`}
                            className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          >
                            {getSubcategoryIcon(sub.subcategory)}
                            <span>{sub.subcategory}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {isExpanded && subs.length === 0 && (
                    <div className="px-10 py-4 text-gray-400 text-sm">No subcategories.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
