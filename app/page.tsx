"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProductCard, { Product } from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import Footer from "@/components/Footer";
//import ChatView from "@/components/chat/ChatView";
import { motion } from "framer-motion";
import HeroCarousel from "@/components/HeroCarousel";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 34;
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);

      // Fetch all featured products (no limit)
      const { data: featuredData, error: featuredError } = await supabase
        .from("products")
        .select("*")
        .eq("featured", true);

      let featuredList: Product[] = featuredData || [];

      if (featuredError) {
        console.error("Error fetching featured products:", featuredError);
        featuredList = [];
      }

      // If no featured products, fallback to latest 4 products
      if (featuredList.length === 0) {
        const { data: fallback } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(8);
        featuredList = fallback || [];
      }
      setFeatured(featuredList);

      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;

      let query = supabase
        .from("products")
        .select("*", { count: "exact" })
        .neq("featured", true);

      const { data, count, error } = await query.range(start, end);

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data as Product[]);
        setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      }

      setLoading(false);
    }

    fetchProducts();
  }, [currentPage]);

  return (
    <div className="min-h-screen mt-0 sm:mt-0 lg:mt-0 bg-gradient-to-br from-white via-blue-50 to-slate-100 text-gray-900 flex flex-col">
      {/* HERO BANNER */}
      <section className="relative w-full bg-gradient-to-r from-blue-100 to-indigo-100 overflow-hidden shadow-sm mt-10">
        <div className="max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center justify-between gap-2 px-4 sm:px-4 py-6 md:pt-20 mb:pb-8">
          {/* Left: Text */}
          <div className="flex-1 w-full px-2">
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-indigo-900 tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              Discover Premium Products for Modern Living
            </motion.h1>
            <motion.p
              className="text-base sm:text-lg md:text-xl text-gray-700 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Shop the latest trends, top brands, and exclusive deals. Fast delivery,
              secure checkout, and 24/7 support.
            </motion.p>
            <motion.a
              href="#products"
              className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-lg font-semibold rounded-full shadow-lg hover:scale-105 transition"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              Shop Now
            </motion.a>
          </div>
          {/* Right: Carousel */}
          <motion.div
            className="flex-1 w-full flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <HeroCarousel />
          </motion.div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      {featured.length > 0 && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-8">
          <motion.h2
            className="text-xl pt-4 md:text-2xl font-bold mb-4 text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Featured Products
          </motion.h2>
          <section>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-4 sm:gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {featured.map((product) => (
                <motion.div
                  key={product.product_id}
                  whileHover={{ scale: 1.04, zIndex: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative"
                >
                  <ProductCard product={product} loading={false} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        </div>
      )}

      {/* MAIN PRODUCT GRID */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8" id="products">
        <motion.h2
          className="text-xl pt-4 md:text-2xl font-bold mt-2 mb-4 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          All Products
        </motion.h2>
        <section>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 lg:grid-cols-5 gap-2 lg:gap-4 sm:gap-3">
              {[...Array(itemsPerPage)].map((_, i) => (
                <ProductCard key={i} product={{} as Product} loading={true} />
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-4 sm:gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {products.map((product) => (
                <motion.div
                  key={product.product_id}
                  whileHover={{ scale: 1.04, zIndex: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative"
                >
                  <ProductCard product={product} loading={false} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* Pagination */}
        <div className="flex justify-center my-10">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
