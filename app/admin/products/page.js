"use client";
import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminLayout from "@/components/AdminLayout";
import withAdminAuth from "@/components/withAdminAuth";
import toast from "react-hot-toast";
import ProductForm from "./ProductForm";
import ProductList from "./ProductList";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, categories!products_category_id_fkey(*), subcategories!products_subcategory_id_fkey(*)');
    if (error) toast.error("Failed to load products.");
    else setProducts(data);
    setLoading(false);
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) toast.error("Failed to load categories.");
    else setCategories(data);
  };

  const fetchSubcategories = async () => {
    const { data, error } = await supabase.from("subcategories").select("*");
    if (error) toast.error("Failed to load subcategories.");
    else {
      setSubcategories(data);
      setFilteredSubcategories(data);
    }
  };

  // Filter subcategories when category changes (for ProductForm)
  const filterSubcategories = (categoryId) => {
    if (!categoryId) setFilteredSubcategories(subcategories);
    else setFilteredSubcategories(subcategories.filter(sub => sub.category_id === categoryId));
  };

  // Handlers for edit/delete
  const handleEdit = (product) => setEditingProduct(product);
  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("product_id", productId);
    if (error) toast.error("Error deleting product: " + error.message);
    else {
      toast.success("Product deleted successfully!");
      fetchProducts();
    }
  };

  // Reset editing
  const resetEditing = () => setEditingProduct(null);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6">
        {editingProduct ? "Edit Product" : "Add New Product"}
      </h1>
      <ProductForm
        key={editingProduct ? editingProduct.product_id : "new"}
        categories={categories}
        subcategories={subcategories}
        filteredSubcategories={filteredSubcategories}
        editingProduct={editingProduct}
        onProductSaved={() => {
          fetchProducts();
          resetEditing();
        }}
        filterSubcategories={filterSubcategories}
        resetEditing={resetEditing}
      />
      <ProductList
        products={products}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </AdminLayout>
  );
}

export default withAdminAuth(ProductsPage);
