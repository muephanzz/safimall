"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import SearchBar from "@/components/SearchBar";
import { motion } from "framer-motion";

interface Product {
  product_id: string | number;
  name: string;
  image_url: string;
  price: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get query param or default to empty string
  const initialQuery = searchParams.get("query") || "";

  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [totalPages, setTotalPages] = useState(1);

  // Fetch products whenever query or page changes
  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setTotalPages(1);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;

      const { data, error, count } = await supabase
        .from("products")
        .select("product_id, name, image_url, price", { count: "exact" })
        .ilike("name", `%${query}%`)
        .range(start, end);

      if (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
        setTotalPages(1);
      } else if (data) {
        setProducts(data);
        setTotalPages(Math.ceil((count ?? 0) / itemsPerPage));
      }
      setLoading(false);
    };

    fetchProducts();
  }, [query, currentPage]);

  // Update URL query param when query changes
  useEffect(() => {
    if (query.trim() !== initialQuery) {
      setCurrentPage(1);
      router.replace(`/products/search?query=${encodeURIComponent(query)}`);
    }
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Search Bar */}
      <div className="sticky top-0 bg-white z-30 mb-6">
        <SearchBar
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          placeholder="Search products..."
        />
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-center text-gray-500 mt-10">Loading products...</p>
      )}

      {/* No Results */}
      {!loading && products.length === 0 && query.trim() !== "" && (
        <p className="text-center text-gray-500 mt-10">No products found.</p>
      )}

      {/* Products Grid */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {products.map((product) => (
          <motion.div
            key={product.product_id}
            className="bg-white rounded-lg shadow hover:shadow-lg cursor-pointer overflow-hidden flex flex-col"
            onClick={() => router.push(`/products/${product.product_id}`)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/products/${product.product_id}`);
              }
            }}
          >
            <div className="relative w-full aspect-square">
              <img
                src={product.image_url}
                alt={product.name}
                className="object-cover w-full h-full"
                loading="lazy"
              />
            </div>
            <div className="p-3 flex flex-col flex-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate" title={product.name}>
                {product.name}
              </h3>
              <p className="mt-auto text-orange-600 font-bold">
                Ksh {product.price.toLocaleString()}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            className="px-4 py-2 rounded bg-orange-500 text-white disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="px-4 py-2 rounded border border-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-4 py-2 rounded bg-orange-500 text-white disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
