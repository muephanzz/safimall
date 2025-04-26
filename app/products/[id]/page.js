"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import toast from "react-hot-toast";
import ProductCard from "@/components/ProductCard";
import ReviewSection from "@/components/ReviewSection";
import { motion } from "framer-motion";

export default function ProductDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [checking, setChecking] = useState(false);
  const [mainImage, setMainImage] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [recommended, setRecommended] = useState([]);
  const [activeTab, setActiveTab] = useState("specifications");
  const imageGalleryRef = useRef(null);
  const [touchStartX, setTouchStartX] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [{ data: productData }, { data: reviewsData }, { data: recommendedData }] = await Promise.all([
          supabase.from("products").select("*").eq("product_id", id).single(),
          supabase.from("reviews").select("review_id, rating, comment, media_urls, created_at, username, user_id, profiles(avatar_url)").eq("product_id", id),
          supabase.from("products").select("*").neq("product_id", id).limit(4),
        ]);

        if (productData) {
          setProduct(productData);
          setMainImage(productData.image_urls?.[0] || "");
        }
        setReviews(reviewsData || []);
        setRecommended(recommendedData || []);
      } catch (err) {
        console.error("Error fetching data:", err.message);
        toast.error("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || quantity < 1) return toast.error("Please select a valid quantity.");

    setAdding(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return toast.error("Please log in to add items to the cart.");

      const { data: existingCartItem } = await supabase
        .from("cart")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("product_id", product.product_id)
        .single();

      if (existingCartItem) {
        const newQty = existingCartItem.items.quantity + quantity;
        await supabase.from("cart").update({
          items: {
            ...existingCartItem.items,
            quantity: newQty,
          }
        }).eq("cart_id", existingCartItem.cart_id);
      } else {
        await supabase.from("cart").insert([
          {
            product_id: product.product_id,
            user_id: session.user.id,
            items: {
              product_id: product.product_id,
              name: product.name,
              price: product.price,
              image_url: mainImage,
              quantity,
            }
          }
        ]);
      }

      toast.success("Item added to cart!");
      window.location.reload();
    } catch (err) {
      console.error("Error adding to cart:", err.message);
      toast.error("Failed to add item to cart.");
    } finally {
      setAdding(false);
      setChecking(false);
    }
  };

  if (loading) return <p className="text-center">Loading product...</p>;
  if (!product) return <p className="text-center">Product not found!</p>;

  const scrollGallery = (direction) => {
    if (imageGalleryRef.current) {
      const scrollAmount = direction === "left" ? -150 : 150;
      imageGalleryRef.current.scrollLeft += scrollAmount;
    }
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchDiff = touchStartX - touchEndX;

    if (touchDiff > 50) {
      // Swipe left
      const currentIndex = product.image_urls.indexOf(mainImage);
      const nextIndex = (currentIndex + 1) % product.image_urls.length;
      setMainImage(product.image_urls[nextIndex]);
    } else if (touchDiff < -50) {
      // Swipe right
      const currentIndex = product.image_urls.indexOf(mainImage);
      const prevIndex = (currentIndex - 1 + product.image_urls.length) % product.image_urls.length;
      setMainImage(product.image_urls[prevIndex]);
    }

    setTouchStartX(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="mb-6">
            <Link
              href="/"
              className="text-sm text-blue-500 hover:text-indigo-700 transition duration-300 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
              </svg>
              Back to Products
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Main image and thumbnails */}
            <div className="relative">
              <motion.div
                className="relative rounded-2xl shadow-lg overflow-hidden bg-gradient-to-br from-gray-50 to-white border border-gray-200"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <Image
                  src={mainImage}
                  width={500} // Reduced width
                  height={500} // Reduced height
                  alt={product.name}
                  className="object-contain w-full h-auto max-h-[400px]" // Adjusted max-h
                />
              </motion.div>

              {/* Absolute positioned Image Gallery */}
              <div className="absolute left-0 bottom-0 w-full">
                <div
                  ref={imageGalleryRef}
                  className="flex gap-2 overflow-x-auto scroll-smooth scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100 py-2"
                >
                  {product.image_urls?.map((img, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Image
                        src={img}
                        width={80} // Reduced width
                        height={80} // Reduced height
                        alt="Thumbnail"
                        onClick={() => setMainImage(img)}
                        className={`cursor-pointer rounded-xl border-4 transition-all duration-300 ${mainImage === img ? "border-blue-500 shadow-md" : "border-transparent hover:border-blue-300"}`}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <motion.h1
                className="text-3xl font-extrabold text-gray-900 tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {product.name}
              </motion.h1>

              <motion.p
                className="text-gray-700 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {product.description || "No description available."}
              </motion.p>

              <motion.div
                className="text-2xl font-bold text-blue-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Ksh {product.price.toLocaleString()}
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition duration-300 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {adding ? "Adding..." : "Add to Cart"}
                </button>

                <button
                  onClick={() => {
                    if (!product) return toast.error("Product details are missing!");
                    const item = {
                      product_id: product.product_id,
                      image_url: mainImage,
                      name: product.name,
                      price: product.price,
                      quantity: 1,
                    };
                    localStorage.setItem("checkoutItems", JSON.stringify([item]));
                    router.push("/orders/checkout");
                  }}
                  disabled={checking}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-400 to-indigo-400 text-white rounded-xl shadow-md hover:shadow-lg transition duration-300 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {checking ? "Processing..." : "{Buy Now"}
                </button>
              </motion.div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-12">
            <div className="flex gap-6 border-b border-gray-300 pb-2">
              {["specifications", "recommended", "reviews"].map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-lg font-semibold pb-2 capitalize transition duration-300 ${activeTab === tab ? "text-blue-700 border-b-2 border-blue-700" : "text-gray-500 hover:text-blue-500"
                    }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tab}
                </motion.button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="mt-8">
              {activeTab === "specifications" && (
                <motion.table
                  className="w-full border-collapse border border-gray-200 text-sm rounded-lg shadow-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <tbody>
                    {product.specification?.split("\n").filter((line) => line.includes(":")).map((line, index) => {
                      const [key, value] = line.split(":").map((item) => item.trim());
                      return (
                        <motion.tr
                          key={index}
                          className="border border-gray-100 hover:bg-gray-50 transition duration-200"
                          whileHover={{ backgroundColor: "#f9f9f9" }}
                        >
                          <td className="p-3 font-medium text-gray-700 bg-gray-50">{key}</td>
                          <td className="p-3 text-gray-600">{value}</td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </motion.table>
              )}

              {activeTab === "recommended" && (
                <motion.div
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {recommended.map((product) => (
                    <ProductCard key={product.product_id} product={product} />
                  ))}
                </motion.div>
              )}

              {activeTab === "reviews" && (
                <motion.div
                  className="mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">Customer Reviews ({reviews.length})</h2>
                  <select
                    onChange={(e) => setSortOrder(e.target.value)}
                    value={sortOrder}
                    className="mb-4 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Rated</option>
                    <option value="lowest">Lowest Rated</option>
                  </select>
                  <ReviewSection reviews={reviews} />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
