"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProductFilters from "@/components/ProductFilters";
import { SlidersHorizontal } from "lucide-react";

interface Product {
  product_id: number;
  name: string;
  price: number;
  image_urls: string[];
  subcategory_id: number;
  brand_id: number;
  rating?: number;
}

interface Subcategory {
  subcategory_id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

export default function ProductsPage() {
  // Filter states
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [subcategory_id, setSubcategoryId] = useState<string>("");
  const [brand_id, setBrandId] = useState<string>("");
  const [minRating, setMinRating] = useState<string>("");
  const [sort, setSort] = useState<string>("default");

  // UI state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch subcategories and brands on mount
  useEffect(() => {
    async function fetchFilters() {
      const { data: subData, error: subError } = await supabase
        .from("subcategories")
        .select("subcategory_id, subcategory")
        .order("subcategory", { ascending: true });
      if (subError) console.error(subError);
      else setSubcategories(subData.map((s) => ({ subcategory_id: s.subcategory_id, name: s.subcategory })));

      const { data: brandData, error: brandError } = await supabase
        .from("brands") // assuming you have a brands table
        .select("id, name")
        .order("name", { ascending: true });
      if (brandError) console.error(brandError);
      else setBrands(brandData || []);
    }
    fetchFilters();
  }, []);

  // Fetch products whenever filters or sort change
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        let query = supabase.from("products").select("*");

        if (subcategory_id) query = query.eq("subcategory_id", Number(subcategory_id));
        if (brand_id) query = query.eq("brand_id", Number(brand_id));
        if (minPrice !== "") query = query.gte("price", Number(minPrice));
        if (maxPrice !== "") query = query.lte("price", Number(maxPrice));
        if (minRating !== "") query = query.gte("rating", Number(minRating));

        if (sort === "asc") query = query.order("price", { ascending: true });
        else if (sort === "desc") query = query.order("price", { ascending: false });
        else query = query.order("product_id", { ascending: false });

        const { data, error } = await query;

        if (error) {
          setError(error.message);
          setProducts([]);
        } else {
          setProducts(data || []);
        }
      } catch (err) {
        setError("Failed to load products.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [subcategory_id, brand_id, minPrice, maxPrice, minRating, sort]);

  // Handlers for filter changes
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFilterOpen(false);
    // Filters are applied immediately via controlled inputs and useEffect
  };

  return (
    <div className="max-w-7xl mx-auto mt-20 sm:mt-24 px-4 sm:px-6 lg:px-8 flex min-h-[80vh]">
      {/* Mobile filter button */}
      <div className="md:hidden fixed top-24 left-4 z-50">
        <button
          onClick={() => setIsFilterOpen(true)}
          className="p-2 bg-white rounded-full shadow-lg border border-gray-200"
          aria-label="Open Filters"
        >
          <SlidersHorizontal className="w-7 h-7 text-indigo-600" />
        </button>
      </div>

      {/* Filters Sidebar */}
      <ProductFilters
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onSubmit={handleFilterSubmit}
        minPrice={minPrice}
        maxPrice={maxPrice}
        subcategories={subcategories}
        brands={brands}
        subcategory_id={subcategory_id}
        brand_id={brand_id}
        minRating={minRating}
        sort={sort}
        onSortChange={(e) => setSort(e.target.value)}
        onSubcategoryChange={(e) => setSubcategoryId(e.target.value)}
        onBrandChange={(e) => setBrandId(e.target.value)}
        onRatingChange={(e) => setMinRating(e.target.value)}
      />

      {/* Products Grid */}
      <main className="flex-1 md:ml-80">
        <h1 className="text-3xl font-bold mb-6">Products</h1>

        {loading && <p>Loading products...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && products.length === 0 && <p>No products found.</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.product_id}
              className="border rounded-lg p-4 shadow hover:shadow-lg transition"
            >
              <h2 className="font-semibold text-lg mb-2">{product.name}</h2>
              {product.image_urls?.[0] && (
                <img
                  src={product.image_urls[0]}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded"
                  loading="lazy"
                />
              )}
              <p className="mt-2 font-bold text-indigo-700">${product.price}</p>
              {/* Add buttons or links here */}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
