"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface Subcategory {
  subcategory_id: number;
  name: string;
}

export interface Brand {
  id: number;
  name: string;
}

export interface ProductFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  minPrice: number | "";
  maxPrice: number | "";
  subcategories: Subcategory[];
  brands: Brand[];
  subcategory_id: string;
  brand_id: string;
  minRating: string;
  sort: string;
  onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubcategoryChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  onBrandChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onRatingChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  isOpen,
  onClose,
  onSubmit,
  minPrice,
  maxPrice,
  subcategories,
  brands,
  subcategory_id,
  brand_id,
  minRating,
  sort,
  onSortChange,
  onSubcategoryChange,
  onBrandChange,
  onRatingChange,
}) => {
  const filterRef = useRef<HTMLFormElement | null>(null);

  // Close filter panel when clicking outside (mobile drawer)
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const FilterContent = (
    <form
      onSubmit={onSubmit}
      ref={filterRef}
      className="flex flex-col gap-4 bg-white shadow-xl rounded-xl p-4 w-full max-w-xs"
      aria-label="Product Filters"
    >
      {/* Header with Close Button */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-lg font-bold text-indigo-700">Filters</span>
        <button
          type="button"
          className="md:hidden"
          onClick={onClose}
          aria-label="Close Filters"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Price Range Inputs */}
      <div>
        <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">
          Price Range
        </label>
        <div className="flex gap-2">
          <input
            id="minPrice"
            type="number"
            name="minPrice"
            min={0}
            placeholder="Min"
            value={minPrice}
            onChange={onSubcategoryChange}
            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-400"
            aria-label="Minimum price"
          />
          <input
            id="maxPrice"
            type="number"
            name="maxPrice"
            min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={onSubcategoryChange}
            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-400"
            aria-label="Maximum price"
          />
        </div>
      </div>

      {/* Subcategory Dropdown */}
      <div>
        <label htmlFor="subcategory_id" className="block text-sm font-medium text-gray-700 mb-1">
          Subcategory
        </label>
        <select
          id="subcategory_id"
          name="subcategory_id"
          value={subcategory_id}
          onChange={onSubcategoryChange}
          className="w-full border border-gray-300 rounded px-2 py-1"
        >
          <option value="">All Subcategories</option>
          {subcategories.map((sub) => (
            <option key={sub.subcategory_id} value={sub.subcategory_id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>

      {/* Brand Dropdown */}
      <div>
        <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700 mb-1">
          Brand
        </label>
        <select
          id="brand_id"
          name="brand_id"
          value={brand_id}
          onChange={onBrandChange}
          className="w-full border border-gray-300 rounded px-2 py-1"
        >
          <option value="">All Brands</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      {/* Minimum Rating Dropdown */}
      <div>
        <label htmlFor="minRating" className="block text-sm font-medium text-gray-700 mb-1">
          Minimum Rating
        </label>
        <select
          id="minRating"
          name="minRating"
          value={minRating}
          onChange={onRatingChange}
          className="w-full border border-gray-300 rounded px-2 py-1"
        >
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r}★ & up
            </option>
          ))}
        </select>
      </div>

      {/* Sort By Dropdown */}
      <div>
        <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
          Sort By
        </label>
        <select
          id="sort"
          name="sort"
          value={sort}
          onChange={onSortChange}
          className="w-full border border-gray-300 rounded px-2 py-1"
        >
          <option value="default">Default</option>
          <option value="asc">Price: Low to High</option>
          <option value="desc">Price: High to Low</option>
        </select>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="mt-2 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-600 text-white px-4 py-2 rounded-lg shadow font-semibold transition"
      >
        Apply Filters
      </button>
    </form>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed top-32 left-0 w-72 h-[calc(100vh-8rem)] z-30 overflow-y-auto">
        {FilterContent}
      </aside>

      {/* Mobile/Tablet Slide-in Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-40 bg-black/40 md:hidden flex"
            style={{ backdropFilter: "blur(2px)" }}
            aria-modal="true"
            role="dialog"
          >
            <div className="w-72 bg-white h-full shadow-2xl overflow-y-auto">{FilterContent}</div>
            <div className="flex-1" onClick={onClose} aria-hidden="true" />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductFilters;
