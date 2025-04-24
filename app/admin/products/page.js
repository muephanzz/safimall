"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminLayout from "@/components/AdminLayout";
import withAdminAuth from "@/components/withAdminAuth";
import toast from "react-hot-toast";
import {
  PlusCircle,
  XCircle,
  Edit,
  Trash2,
  ImagePlus,
  Loader2,
} from "lucide-react";

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [productAttributes, setProductAttributes] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    phone: "",
    description: "",
    specification: "",
    stock: "",
    price: "",
    image_urls: [],
    category_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSubcategories();
    fetchAttributes();
  }, []);

  // Fetch subcategories
  const fetchSubcategories = async () => {
    const { data, error } = await supabase.from("subcategories").select("*");
    if (error) {
      console.error("Error fetching subcategories:", error);
      toast.error("Failed to load subcategories.");
    } else {
      setSubcategories(data);
    }
  };

  // Fetch attributes
  const fetchAttributes = async () => {
    const { data, error } = await supabase.from("attributes").select("*");
    if (error) {
      console.error("Error fetching attributes:", error);
      toast.error("Failed to load attributes.");
    } else {
      setAttributes(data);
    }
  };

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(category)");
    if (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products.");
    } else {
      setProducts(data);
    }
    setLoading(false);
  }, []);

  // Fetch categories
  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories.");
    } else {
      setCategories(data);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    setNewProduct((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Remove image from preview
  const removeImage = (index) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle file change for image upload
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);

    const filePreviews = selectedFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePreviews).then(setPreviews);
  };

  // Sanitize file name
  const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Upload images to Supabase storage
  const uploadImages = async () => {
    const imageUrls = await Promise.all(
      files.map(async (file) => {
        const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(`images/${fileName}`, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw new Error(uploadError.message);

        const { data: urlData, error: urlError } = supabase.storage
          .from("products")
          .getPublicUrl(`images/${fileName}`);

        if (urlError) throw new Error(urlError.message);

        return urlData.publicUrl;
      })
    );

    return imageUrls;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, stock, price, category_id } = newProduct;

    if (!name || !stock || !price || !category_id) {
      toast.error("Please fill in all required fields!");
      return;
    }

    setUploading(true);
    try {
      let imageUrls = editingProduct?.image_urls || [];

      if (files.length > 0) {
        imageUrls = await uploadImages();
      }

      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        image_urls: imageUrls,
        subcategory_id: selectedSubcategory || null,
      };

      let productId;

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("product_id", editingProduct.product_id);

        if (error) throw new Error(error.message);

        productId = editingProduct.product_id;
        toast.success("Product updated successfully!");
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert([productData])
          .select("product_id")
          .single();

        if (error) throw new Error(error.message);

        productId = data.product_id;
        toast.success("Product added successfully!");
      }

      await supabase
        .from("product_attributes")
        .delete()
        .eq("product_id", productId);

      if (productAttributes.length > 0) {
        const attrInsert = productAttributes.map((attr) => ({
          product_id: productId,
          attribute_id: attr.attribute_id,
          value: attr.value,
        }));
        const { error: attrError } = await supabase
          .from("product_attributes")
          .insert(attrInsert);
        if (attrError) throw new Error(attrError.message);
      }

      fetchProducts();
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Operation failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle product deletion
  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("product_id", productId);

    if (error) {
      console.error("Error deleting product:", error.message);
      toast.error("Error deleting product: " + error.message);
    } else {
      toast.success("Product deleted successfully!");
      fetchProducts();
    }
  };

  // Handle editing a product
  const handleEdit = (product) => {
    setEditingProduct(product);
    setNewProduct({ ...product });
    setFiles([]);
    setPreviews(product.image_urls || []);
    setSelectedSubcategory(product.subcategory_id || "");
    setProductAttributes(
      attributes.map((attr) => ({
        attribute_id: attr.id,
        value: product[attr.name] || "",
      }))
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset the form
  const resetForm = () => {
    setNewProduct({
      name: "",
      phone: "",
      description: "",
      specification: "",
      stock: "",
      price: "",
      image_urls: [],
      category_id: "",
    });
    setFiles([]);
    setPreviews([]);
    setSelectedSubcategory("");
    setProductAttributes([]);
    setEditingProduct(null);
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6">
        {editingProduct ? "Edit Product" : "Add New Product"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Details */}
        <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Product Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={handleChange}
                required
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium">
                Category
              </label>
              <select
                id="category"
                name="category_id"
                onChange={handleChange}
                value={newProduct.category_id}
                required
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.category}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="subcategory" className="block text-sm font-medium">
                Subcategory
              </label>
              <select
                id="subcategory"
                name="subcategory_id"
                onChange={handleChange}
                value={selectedSubcategory}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="">Select Subcategory</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="stock" className="block text-sm font-medium">
                Stock
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                min={1}
                placeholder="Stock"
                value={newProduct.stock}
                onChange={handleChange}
                required
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium">
                Phone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                maxLength={10}
                placeholder="Seller's Phone Number"
                value={newProduct.phone}
                onChange={handleChange}
                required
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="price" className="block text-sm font-medium">
                Price
              </label>
              <input
                type="number"
                id="price"
                name="price"
                min={1}
                placeholder="Price"
                value={newProduct.price}
                onChange={handleChange}
                required
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        </section>

        {/* Product Attributes */}
        <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Product Attributes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {attributes.map((attr) => (
              <div key={attr.id} className="space-y-2">
                <label
                  htmlFor={`attribute-${attr.id}`}
                  className="block text-sm font-medium"
                >
                  {attr.name}
                </label>
                <input
                  type="text"
                  id={`attribute-${attr.id}`}
                  placeholder={`Enter ${attr.name}`}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  onChange={(e) => {
                    const value = e.target.value;
                    setProductAttributes((prev) => {
                      const existing = prev.find(
                        (a) => a.attribute_id === attr.id
                      );
                      if (existing) {
                        return prev.map((a) =>
                          a.attribute_id === attr.id ? { ...a, value } : a
                        );
                      } else {
                        return [...prev, { attribute_id: attr.id, value }];
                      }
                    });
                  }}
                  value={
                    productAttributes.find((a) => a.attribute_id === attr.id)
                      ?.value || ""
                  }
                />
              </div>
            ))}
          </div>
        </section>

        {/* Product Description */}
        <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Description
          </h2>
          <textarea
            id="description"
            name="description"
            placeholder="Description"
            value={newProduct.description}
            onChange={handleChange}
            required
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </section>

        {/* Product Specification */}
        <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Specification
          </h2>
          <textarea
            id="specification"
            name="specification"
            placeholder="Specification"
            value={newProduct.specification}
            onChange={handleChange}
            required
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </section>

        {/* Image Upload */}
        <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            Images
            <label
              htmlFor="imageUpload"
              className="cursor-pointer bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 transition"
            >
              <ImagePlus size={18} className="inline-block mr-1" />
              Add Images
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="imageUpload"
            />
          </h2>

          {previews.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-4">
              {previews.map((src, i) => (
                <div key={i} className="relative w-32 h-32">
                  <img
                    src={src}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg border border-gray-300 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-2 py-1 hover:bg-red-700 transition shadow-md"
                  >
                    <XCircle size={16} className="inline-block" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading}
          className="flex items-center justify-center bg-green-600 text-white p-3 rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold shadow-sm"
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              {editingProduct ? (
                <>
                  <Edit size={20} className="mr-2" />
                  Update Product
                </>
              ) : (
                <>
                  <PlusCircle size={20} className="mr-2" />
                  Add Product
                </>
              )}
            </>
          )}
        </button>
      </form>

      {/* Product List */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Products</h2>
        {loading ? (
          <div className="flex justify-center items-center min-h-[30vh]">
            <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
          </div>
        ) : products.length === 0 ? (
          <p className="text-gray-600">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.product_id}
                className="bg-white rounded-2xl shadow-md p-5 border border-gray-200"
              >
                <h3 className="text-xl font-semibold mb-2 text-gray-800">
                  {product.name}
                </h3>
                <div className="mb-3">
                  <strong className="block mb-1">Category:</strong>
                  <span className="text-gray-700">
                    {product.categories?.category || "N/A"}
                  </span>
                </div>
                <div className="mb-3">
                  <strong className="block mb-1">Phone:</strong>
                  <span className="text-gray-700">{product.phone || "N/A"}</span>
                </div>
                <div className="mb-3">
                  <strong className="block mb-1">Description:</strong>
                  <span className="text-gray-700">{product.description || "N/A"}</span>
                </div>
                <div className="mb-3">
                  <strong className="block mb-1">Specification:</strong>
                  <span className="text-gray-700">
                    {product.specification || "N/A"}
                  </span>
                </div>
                <div className="mb-3">
                  <strong className="block mb-1">Stock:</strong>
                  <span className="text-gray-700">{product.stock || "N/A"}</span>
                </div>
                <div className="mb-3">
                  <strong className="block mb-1">Price:</strong>
                  <span className="text-gray-700">KES {product.price || "N/A"}</span>
                </div>
                {product.image_urls?.length > 0 && (
                  <div className="mb-3">
                    <strong className="block mb-1">Images:</strong>
                    <div className="flex flex-wrap gap-2">
                      {product.image_urls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt="Product"
                          className="w-20 h-20 object-cover rounded-lg border border-gray-300 shadow-sm"
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-4 mt-4">
                  <button
                    onClick={() => handleEdit(product)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Edit size={16} className="inline-block mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.product_id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <Trash2 size={16} className="inline-block mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  );
};

export default withAdminAuth(ManageProducts);
