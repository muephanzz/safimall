"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import { motion } from "framer-motion";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const category_id = searchParams.get("category_id");
  const subcategory_id = searchParams.get("subcategory_id") || "";
  const brand_id = searchParams.get("brand") || "";
  const minRating = searchParams.get("rating") || "";
  const sort = searchParams.get("sort") || "default";
  const minPrice = parseFloat(searchParams.get("min")) || 0;
  const maxPrice = parseFloat(searchParams.get("max")) || Infinity;
  const page = parseInt(searchParams.get("page")) || 1;

  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [brands, setBrands] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false); // State to manage filter visibility
  const filterRef = useRef(null); // Ref for the filter section

  const productsPerPage = 8;
  const currentPage = page;

  // Helper to update URL search params
  const updateSearchParams = (params) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === "" || value === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    router.push(`?${newParams.toString()}`);
  };

  useEffect(() => {
    // Fetch category name
    const fetchCategoryName = async () => {
      if (!category_id) return setCategoryName("");
      const { data, error } = await supabase
        .from("categories")
        .select("category")
        .eq("id", category_id)
        .single();
      if (!error && data) setCategoryName(data.category);
    };

    // Fetch subcategory name
    const fetchSubcategoryName = async () => {
      if (!subcategory_id) return setSubcategoryName("");
      const { data, error } = await supabase
        .from("subcategories")
        .select("name")
        .eq("id", subcategory_id)
        .single();
      if (!error && data) setSubcategoryName(data.name);
    };

    // Fetch subcategories for current category
    const fetchSubcategories = async () => {
      if (!category_id) return setSubcategories([]);
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .eq("category_id", category_id)
        .order("name", { ascending: true });
      if (!error) setSubcategories(data || []);
    };

    // Fetch brands (optionally, filter by category if your schema supports)
    const fetchBrands = async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("name", { ascending: true });
      if (!error) setBrands(data || []);
    };

    fetchCategoryName();
    fetchSubcategoryName();
    fetchSubcategories();
    fetchBrands();
  }, [category_id, subcategory_id]);

  useEffect(() => {
    if (!category_id) return;

    setLoading(true);
    const from = (currentPage - 1) * productsPerPage;
    const to = from + productsPerPage - 1;

    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("category_id", category_id)
      .gte("price", minPrice);

    if (subcategory_id) query = query.eq("subcategory_id", subcategory_id);
    if (brand_id) query = query.eq("brand_id", brand_id);
    if (minRating) query = query.gte("rating", minRating);
    if (isFinite(maxPrice)) query = query.lte("price", maxPrice);

    if (sort === "asc") query = query.order("price", { ascending: true });
    else if (sort === "desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    query = query.range(from, to);

    query.then(({ data, count, error }) => {
      if (!error) {
        setProducts(data || []);
        setTotalProducts(count || 0);
      } else {
        console.error("Error fetching products:", error);
      }
      setLoading(false);
    });
  }, [category_id, subcategory_id, brand_id, minRating, sort, minPrice, maxPrice, currentPage]);

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  const handleSortChange = (e) => {
    updateSearchParams({ sort: e.target.value, page: 1 });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const min = e.target.min.value;
    const max = e.target.max.value;
    updateSearchParams({ min, max, page: 1 });
  };

  const handleSubcategoryChange = (e) => {
    updateSearchParams({ subcategory_id: e.target.value || null, page: 1 });
  };

  const handleBrandChange = (e) => {
    updateSearchParams({ brand: e.target.value || null, page: 1 });
  };

  const handleRatingChange = (e) => {
    updateSearchParams({ rating: e.target.value || null, page: 1 });
  };

  // Function to toggle filter visibility
  const toggleFilterVisibility = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Close the filter when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterRef]);

  if (!category_id)
    return (
      <div className="text-center text-lg text-gray-700 py-20">
        Please select a category to view products.
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto mt-20 sm:mt-24 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="bg-gradient-to-r from-orange-100 to-yellow-50 shadow-xl py-3 text-center rounded-xl mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          {subcategoryName
            ? `Products in ${subcategoryName} Subcategory`
            : `Products in ${categoryName} Category`}
        </h1>
      </motion.div>

      {/* Hamburger Menu for Filters (Visible on smaller screens) */}
      <div className="sm:hidden flex justify-end mb-4">
        <button
          onClick={toggleFilterVisibility}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded shadow"
        >
          {isFilterOpen ? "Close Filters" : "Open Filters"}
        </button>
      </div>

      {/* Filters */}
      <div
        className={`flex flex-wrap justify-between items-center gap-4 mb-8 px-2 md:px-0 ${
          isFilterOpen ? "block" : "hidden"
        } sm:flex`}
        ref={filterRef}
      >
        <form
          onSubmit={handleFilterSubmit}
          className="flex flex-wrap items-center gap-3 bg-white shadow-md rounded-lg p-4"
        >
          <input
            type="number"
            name="min"
            min={0}
            placeholder="Min price"
            defaultValue={minPrice > 0 ? minPrice : ""}
            className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
          />
          <input
            type="number"
            min={0}
            name="max"
            placeholder="Max price"
            defaultValue={maxPrice !== Infinity ? maxPrice : ""}
            className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-yellow-400 hover:to-orange-500 text-white px-5 py-2 rounded-lg shadow-lg font-semibold transition transform hover:scale-105"
          >
            Filter
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={subcategory_id}
            onChange={handleSubcategoryChange}
            className="border border-gray-300 rounded-md px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            <option value="">All Subcategories</option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>

          <select
            value={brand_id}
            onChange={handleBrandChange}
            className="border border-gray-300 rounded-md px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>

          <select
            value={minRating}
            onChange={handleRatingChange}
            className="border border-gray-300 rounded-md px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
          >
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r}★ & up
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={handleSortChange}
            className="border border-gray-300 rounded-md px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            <option value="default">Sort by</option>
            <option value="asc">Price: Low to High</option>
            <option value="desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-orange-400 animate-spin blur-sm"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-yellow-400 animate-spin"></div>
          </div>
        </div>
      )}

      {/* No products */}
      {!loading && products.length === 0 && (
        <div className="text-center px-4 md:px-6 lg:px-8 text-gray-500 py-10 text-lg">
          No products found.
        </div>
      )}

      {/* Products Grid */}
      {!loading && products.length > 0 && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 px-2 md:px-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id || `product-${index}`}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative"
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex justify-center">
          <Pagination totalPages={totalPages} currentPage={currentPage} />
        </div>
      )}
    </div>
  );
}
