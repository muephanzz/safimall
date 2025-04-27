"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminLayout from "@/components/AdminLayout";
import withAdminAuth from "@/components/withAdminAuth";
import toast from "react-hot-toast";
import { XCircle, Edit, Trash2, ImagePlus, Loader2 } from "lucide-react";

const ManageProducts = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [filteredSubcategories, setFilteredSubcategories] = useState([]);
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
        subcategory_id: "",
        attributes: {},
    });
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [uploading, setUploading] = useState(false);
    const defaultAttributes = [
      { id: 1, name: "Color" },
      { id: 2, name: "Size" },
      { id: 3, name: "Material" },
      { id: 4, name: "Brand" },
      { id: 5, name: "Weight" },
      { id: 6, name: "Dimensions" },
      { id: 7, name: "Warranty" },
      { id: 8, name: "State" },
    ];

    const [specRows, setSpecRows] = useState([{ name: "", value: "" }]);

    // Handler to update specRows on input change
    const handleSpecChange = (index, field, value) => {
      setSpecRows((prevRows) =>
        prevRows.map((row, i) =>
          i === index ? { ...row, [field]: value } : row
        )
      );
    };
  
    // Add new empty row
    const addSpecRow = () => {
      setSpecRows((prevRows) => [...prevRows, { name: "", value: "" }]);
    };
    
    // Fetch data on mount
    useEffect(() => {
        fetchProducts();
        fetchCategories();
        fetchSubcategories();
    }, []);

    useEffect(() => {
        filterSubcategories(newProduct.category_id);
    }, [newProduct.category_id]);

    // Fetch subcategories
    const fetchSubcategories = async (categoryId = null) => {
        let query = supabase.from("subcategories").select("*");
        if (categoryId) {
            query = query.eq("category_id", categoryId);
        }
        const { data, error } = await query;

        if (error) {
            console.error("Error fetching subcategories:", error);
            toast.error("Failed to load subcategories.");
        } else {
            setSubcategories(data);
            setFilteredSubcategories(data);
        }
    };

    const filterSubcategories = (categoryId) => {
        if (!categoryId) {
            setFilteredSubcategories(subcategories);
        } else {
            const filtered = subcategories.filter((sub) => sub.category_id === categoryId);
            setFilteredSubcategories(filtered);
        }
    };

    // Fetch products
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*, categories!products_category_id_fkey(*)');
          
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

    // Generic handle input change
    const handleChange = (e) => {
      const { name, value } = e.target;
      setNewProduct(prev => ({
          ...prev,
          [name]: value,
      }));
  };

    // Handle Attribute Change
    const handleAttributeChange = (attrName, value) => {
      setNewProduct(prev => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          [attrName]: value,
        },
      }));
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
  
      const { name, stock, price, category_id, subcategory_id } = newProduct;
  
      if (!name || !stock || !price || !category_id || !subcategories) {
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
            stock: parseInt(newProduct.stock, 10),
            image_urls: imageUrls,
          };
          
          let productId;
          
          if (editingProduct) {
              const { error } = await supabase
                  .from("products")
                  .update(productData) // <--- Sending the entire productData (including attributes)
                  .eq("product_id", editingProduct.product_id);
          
              if (error) throw new Error(error.message);
          
              productId = editingProduct.product_id;
              toast.success("Product updated successfully!");
          } else {
              const { data, error } = await supabase
                  .from("products")
                  .insert([productData]) // <--- Sending the entire productData (including attributes)
                  .select("product_id")
                  .single();
          
              if (error) throw new Error(error.message);
          
              productId = data.product_id;
              toast.success("Product added successfully!");
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
      setNewProduct({
        ...product,
        category_id: product.categories?.id || "",    // add these
        subcategory_id: product.subcategories?.subcategory_id || "", //add these
      });
      setFiles([]);
      setPreviews(product.image_urls || []);
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
            subcategory_id: "",
            attributes: {},
        });
        setFiles([]);
        setPreviews([]);
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
                              name="category_id"
                              onChange={handleChange}
                              value={newProduct.category_id}
                            >
                              <option value="">Select Category</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.category}</option>
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
                                value={newProduct.subcategory_id}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            >
                                <option value="">Select Subcategory</option>
                                {filteredSubcategories.map((sub) => (
                                    <option key={sub.subcategory_id} value={sub.subcategory_id}>
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
                    {defaultAttributes.map((attr) => (
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
                          onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                          value={newProduct.attributes[attr.name] || ""}
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
                    <table className="w-full">
                        <thead>
                        <tr>
                            <th className="text-left">Name</th>
                            <th className="text-left">Value</th>
                        </tr>
                        </thead>
                        <tbody>
                        {specRows.map((row, idx) => (
                            <tr key={idx}>
                            <td>
                                <input
                                type="text"
                                value={row.name}
                                onChange={e => handleSpecChange(idx, "name", e.target.value)}
                                className="border rounded px-2 py-1 w-full"
                                placeholder="e.g. RAM"
                                />
                            </td>
                            <td>
                                <input
                                type="text"
                                value={row.value}
                                onChange={e => handleSpecChange(idx, "value", e.target.value)}
                                className="border rounded px-2 py-1 w-full"
                                placeholder="e.g. 8GB"
                                />
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <button type="button" onClick={addSpecRow} className="mt-2 text-blue-600">+ Add Row</button>
                </section>

                {/* Image Upload */}
                <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                        Image Upload
                    </h2>
                    <div className="flex items-center justify-center w-full">
                        <label
                            htmlFor="dropzone-file"
                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-blue-600 dark:hover:border-blue-500 dark:hover:bg-bray-800"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <ImagePlus className="w-8 h-8 mb-4 text-blue-500 dark:text-blue-400" />
                                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold">Click to upload</span> or drag
                                    and drop
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    SVG, PNG, JPG or GIF (MAX. 800x400px)
                                </p>
                            </div>
                            <input
                                id="dropzone-file"
                                type="file"
                                className="hidden"
                                multiple
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>

                    {/* Image Preview */}
                    {previews.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {previews.map((preview, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={preview}
                                        alt={`Uploaded preview ${index + 1}`}
                                        className="rounded-md"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition duration-200"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Action Buttons */}
                <div className="flex justify-between">
                    <button
                        type="submit"
                        disabled={uploading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                    >
                        {uploading ? (
                            <>
                                Saving <Loader2 className="ml-2 inline-block animate-spin" size={16} />
                            </>
                        ) : (
                            "Save Product"
                        )}
                    </button>
                    {editingProduct && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>
            </form>

            {/* Product List */}
            <section className="mt-12">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                    Product List
                </h2>
                {loading ? (
                    <div className="flex justify-center">
                        <Loader2 className="animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Subcategory
                                    </th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.product_id}>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">
                                                {product.name}
                                            </p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">
                                                {product.categories?.category}
                                            </p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">
                                                {product.subcategories?.name}
                                            </p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">
                                                {product.stock}
                                            </p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">
                                                {product.price}
                                            </p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    <Edit className="inline-block" size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.product_id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="inline-block" size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </AdminLayout>
    );
};

export default withAdminAuth(ManageProducts);
