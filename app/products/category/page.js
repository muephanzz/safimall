"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import { motion } from "framer-motion";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const category_id = searchParams.get("category_id");
  const subcategory_id = searchParams.get("subcategory_id") || null;
  const sort = searchParams.get("sort") || "default";
  const minPrice = parseFloat(searchParams.get("min")) || 0;
  const maxPrice = parseFloat(searchParams.get("max")) || Infinity;
  const page = parseInt(searchParams.get("page")) || 1;

  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);

  const productsPerPage = 8;
  const currentPage = page;

  useEffect(() => {
    const fetchCategoryName = async () => {
      if (!category_id) return;
      const { data, error } = await supabase
        .from("categories")
        .select("category")
        .eq("id", category_id)
        .single();

      if (!error && data) {
        setCategoryName(data.category);
      }
    };

    const fetchProducts = async () => {
      if (!category_id) return;
      setLoading(true);

      const from = (currentPage - 1) * productsPerPage;
      const to = from + productsPerPage - 1;

      let query = supabase
        .from("products")
        .select("*", { count: "exact" })
        .eq("category_id", category_id)
        .gte("price", minPrice);

      if (subcategory_id) {
        query = query.eq("subcategory_id", subcategory_id);
      }

      if (isFinite(maxPrice)) {
        query = query.lte("price", maxPrice);
      }

      if (sort === "asc") {
        query = query.order("price", { ascending: true });
      } else if (sort === "desc") {
        query = query.order("price", { ascending: false });
      }

      query = query.range(from, to);

      const { data, count, error } = await query;

      if (!error) {
        setProducts(data || []);
        setTotalProducts(count || 0);
      } else {
        console.error("Error fetching products:", error);
      }

      setLoading(false);
    };

    fetchCategoryName();
    fetchProducts();
  }, [category_id, subcategory_id, sort, minPrice, maxPrice, currentPage]);

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    const params = new URLSearchParams(searchParams);
    params.set("sort", newSort);
    router.push(`?${params.toString()}`);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const min = e.target.min.value;
    const max = e.target.max.value;
    const params = new URLSearchParams(searchParams);
    params.set("min", min);
    params.set("max", max);
    router.push(`?${params.toString()}`);
  };

  if (!category_id)
    return (
      <div className="text-center text-lg text-gray-700 py-20">
        Please select a category to view products.
      </div>
    );

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-blue-500 animate-spin blur-sm"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-blue-400 animate-spin"></div>
        </div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 mt-24">
      <motion.div
        className="bg-gradient-to-r from-orange-100 to-yellow-50 shadow-xl rounded-2xl px-6 py-4 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
          Products in <span className="text-orange-600">{categoryName}</span> Category
        </h1>
      </motion.div>

      {/* Filter + Sort */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <form onSubmit={handleFilterSubmit} className="flex items-center gap-2">
          <input
            type="number"
            name="min"
            placeholder="Min price"
            className="px-2 py-1 border rounded-md text-sm"
          />
          <input
            type="number"
            name="max"
            placeholder="Max price"
            className="px-2 py-1 border rounded-md text-sm"
          />
          <button
            type="submit"
            className="bg-orange-500 text-white px-3 py-1 rounded-md text-sm"
          >
            Filter
          </button>
        </form>

        <select
          value={sort}
          onChange={handleSortChange}
          className="border px-3 py-1 rounded-md text-sm"
        >
          <option value="default">Sort by</option>
          <option value="asc">Price: Low to High</option>
          <option value="desc">Price: High to Low</option>
        </select>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="text-center text-gray-500 py-10 text-lg">
          No products found.
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id || `product-${index}`}
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {totalPages > 1 && (
        <div className="mt-10">
          <Pagination totalPages={totalPages} currentPage={currentPage} />
        </div>
      )}
    </div>
  );
}
