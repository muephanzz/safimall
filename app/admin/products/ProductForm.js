import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import ImageUploader from "./ImageUploader";
import AttributeSelector from "./AttributeSelector";
import SpecificationFields from "./SpecificationFields";
import { Button } from "@/components/ui/button"; // adjust path as needed

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

export default function ProductForm({
  categories,
  subcategories,
  filteredSubcategories,
  editingProduct,
  onProductSaved,
  filterSubcategories,
  resetEditing,
}) {
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
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [specRows, setSpecRows] = useState([{ name: "", value: "" }]);

  useEffect(() => {
    if (editingProduct) {
      setNewProduct({
        ...editingProduct,
        category_id: editingProduct.category_id || "",
        subcategory_id: editingProduct.subcategory_id || "",
      });
      setPreviews(editingProduct.image_urls || []);
      setSpecRows(editingProduct.specification && editingProduct.specification.length > 0
        ? editingProduct.specification
        : [{ name: "", value: "" }]
      );
    } else {
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
      setPreviews([]);
      setSpecRows([{ name: "", value: "" }]);
    }
  }, [editingProduct]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === "category_id") filterSubcategories(value);
  };

  // Handle attribute change
  const handleAttributeChange = (attrName, value) => {
    setNewProduct((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attrName]: value,
      },
    }));
  };

  // Handle spec fields
  const handleSpecChange = (index, field, value) => {
    setSpecRows((prevRows) =>
      prevRows.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  };
  const addSpecRow = () => setSpecRows((prevRows) => [...prevRows, { name: "", value: "" }]);

  // Image upload
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
  const removeImage = (index) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setNewProduct((prev) => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index),
    }));
  };
  const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, "_");
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

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrls = editingProduct?.image_urls || [];
      if (files.length > 0) imageUrls = await uploadImages();
      const filteredSpecs = specRows.filter(row => row.name.trim() !== "" && row.value.trim() !== "");
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock, 10),
        image_urls: imageUrls,
        specification: filteredSpecs,
      };
      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("product_id", editingProduct.product_id);
        if (error) throw new Error(error.message);
        toast.success("Product updated successfully!");
      } else {
        const { error } = await supabase
          .from("products")
          .insert([productData]);
        if (error) throw new Error(error.message);
        toast.success("Product added successfully!");
      }
      onProductSaved();
    } catch (error) {
      toast.error("Operation failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Details */}
      <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Product Details</h2>
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
                  className="..."
                  >
                  <option value="">Select Subcategory</option>
                  {filteredSubcategories.map((sub) => (
                      <option key={sub.subcategory_id} value={sub.subcategory_id}>
                      {sub.subcategory}
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
      {/* Attributes */}
      <AttributeSelector
        attributes={defaultAttributes}
        selected={newProduct.attributes}
        onChange={handleAttributeChange}
      />
      {/* Images */}
      <ImageUploader
        previews={previews}
        onFileChange={handleFileChange}
        onRemove={removeImage}
        uploading={uploading}
      />
      {/* Specifications */}
      <SpecificationFields
        specRows={specRows}
        onSpecChange={handleSpecChange}
        onAddSpecRow={addSpecRow}
      />
      <div className="flex gap-3">
        <Button type="submit" variant="default" disabled={uploading}>
          {uploading ? "Saving..." : editingProduct ? "Update Product" : "Add Product"}
        </Button>
        {editingProduct && (
          <Button type="button" variant="outline" onClick={resetEditing}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
