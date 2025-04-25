"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import Footer from "@/components/Footer";
import ChatView from "@/components/chat/ChatView";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 60;
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);

      const { data: featuredData } = await supabase
        .from("products")
        .select("*")
        .eq("featured", true)
        .limit(4);

      let featuredList = featuredData || [];

      if (featuredList.length === 0) {
        const { data: fallback } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(4);
        featuredList = fallback || [];
      }
      setFeatured(featuredList);

      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;

      let query = supabase
        .from("products")
        .select("*", { count: "exact" });

      if (featuredList.length > 0) {
        query = query.not(
          "product_id",
          "in",
          `(${featuredList.map((f) => `'${f.product_id}'`).join(",")})`
        );
      }

      const { data, count, error } = await query
        .range(start, end);

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data);
        setTotalPages(Math.ceil(count / itemsPerPage));
      }

      setLoading(false);
    }

    fetchProducts();
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-slate-100 text-gray-900 flex flex-col">
      {/* HERO BANNER */}
      <section className="relative w-full bg-gradient-to-r from-blue-100 to-indigo-100 overflow-hidden shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center justify-between gap-8 px-4 sm:px-8 py-12 md:py-20">
          <div className="flex-1">
            <motion.h1
              className="text-4xl md:text-5xl font-extrabold mb-4 text-indigo-900 tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              Discover Premium Products for Modern Living
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-gray-700 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Shop the latest trends, top brands, and exclusive deals. Fast delivery, secure checkout, and 24/7 support.
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
          <motion.div
            className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <Image
              src="/carousel.jpg"
              alt="Shop illustration"
              width={500}
              height={400}
              className="shadow-2xl border-4 border-white object-cover w-full max-w-[500px] h-auto"
              priority
            />
          </motion.div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      {featured && featured.length > 0 && (
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-10">
          <motion.h2
            className="text-2xl md:text-3xl font-bold mb-6 text-indigo-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Featured Products
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
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
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* MAIN PRODUCT GRID */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8" id="products">
        <motion.h2
          className="text-xl md:text-2xl font-bold mb-4 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          All Products
        </motion.h2>
        <section className="bg-white/80 backdrop-blur-md p-6 shadow-xl border border-gray-200">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(itemsPerPage)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-tr from-gray-200 to-gray-100 p-4 shadow-lg animate-pulse flex flex-col"
                >
                  <div className="h-48 bg-gray-300 mb-4" />
                  <div className="h-5 w-3/4 bg-gray-300 mb-3" />
                  <div className="h-4 w-full bg-gray-200 mb-2" />
                  <div className="h-6 w-1/2 bg-indigo-200" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6"
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
                  <ProductCard product={product} />
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

      <ChatView />
      <Footer />
    </div>
  );
}
