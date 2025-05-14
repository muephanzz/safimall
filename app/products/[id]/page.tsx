"use client";

import { useEffect, useState, useRef, TouchEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import toast from "react-hot-toast";
import ProductCard, { Product as ProductCardType } from "@/components/ProductCard";
import ReviewSection from "@/components/ReviewSection";
import { motion, AnimatePresence } from "framer-motion";
import Head from "next/head";

// Skeleton Loader Component
function ProductSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-20">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl p-8 animate-pulse">
        <div className="h-8 w-1/3 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-1/2 bg-gray-100 rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <div className="w-full aspect-square bg-gray-200 rounded-2xl mb-4" />
            <div className="flex gap-2 mt-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-12 h-12 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
          <div>
            <div className="h-6 w-2/3 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-1/2 bg-gray-100 rounded mb-2" />
            <div className="h-6 w-1/3 bg-gray-200 rounded mb-6" />
            <div className="h-12 w-full bg-gray-200 rounded-xl mb-2" />
            <div className="h-12 w-1/2 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Match the Product type with ProductCard
interface Product extends ProductCardType {
  specification: { name: string; value: string }[];
  image_urls: string[];
}

export default function ProductDetails() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [quantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [adding, setAdding] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [mainImage, setMainImage] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<string>("specifications");
  const imageGalleryRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Refs for scroll-based tab switching
  const specRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const recoRef = useRef<HTMLDivElement>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch product, reviews, recommendations
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const fetchData = async () => {
      try {
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
      } catch (err: any) {
        console.error("Error fetching data:", err.message);
        toast.error("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Intersection Observer for scroll-based tab switching
  useEffect(() => {
    const sections = [
      { ref: specRef, id: "specifications" },
      { ref: reviewRef, id: "reviews" },
      { ref: recoRef, id: "recommended" },
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const sectionId = entry.target.getAttribute("data-section");
            if (sectionId) setActiveTab(sectionId);
          }
        });
      },
      { threshold: 0.5 }
    );
    sections.forEach(({ ref, id }) => {
      if (ref.current) {
        ref.current.setAttribute("data-section", id);
        observer.observe(ref.current);
      }
    });
    return () => observer.disconnect();
  }, [loading]);

  // Add to cart handler
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
              description: product.description,
              image_url: mainImage,
              quantity,
            }
          }
        ]);
      }
      toast.success("Item added to cart!");
      window.location.reload();
    } catch (err: any) {
      console.error("Error adding to cart:", err.message);
      toast.error("Failed to add item to cart.");
    } finally {
      setAdding(false);
      setChecking(false);
    }
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX === null || !product?.image_urls?.length) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchDiff = touchStartX - touchEndX;
    if (Math.abs(touchDiff) > 50 && product.image_urls.length > 1) {
      const currentIndex = product.image_urls.indexOf(mainImage);
      const nextIndex = touchDiff > 0
        ? (currentIndex + 1) % product.image_urls.length
        : (currentIndex - 1 + product.image_urls.length) % product.image_urls.length;
      setMainImage(product.image_urls[nextIndex]);
    }
    setTouchStartX(null);
  };

  // Scroll to section on tab click
  const scrollToSection = (section: string) => {
    const target =
      section === "specifications"
        ? specRef.current
        : section === "reviews"
        ? reviewRef.current
        : recoRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // SEO Structured Data
  const structuredData = product && {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: product.image_urls,
    description: product.description,
    brand: { "@type": "Brand", name: "SmartKenya Online Shopping" },
    offers: {
      "@type": "Offer",
      priceCurrency: "KES",
      price: product.price,
      availability: "https://schema.org/InStock",
      url: `https://smartkenya.co.ke/products/${product.product_id}`,
    },
    aggregateRating: reviews.length > 0 && {
      "@type": "AggregateRating",
      ratingValue: (
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      ).toFixed(1),
      reviewCount: reviews.length,
    },
  };

  if (loading) return <ProductSkeleton />;
  if (!product) return <p className="text-center py-20 text-lg text-gray-500">Product not found!</p>;

  return (
    <>
      <Head>
        <title>{`${product.name} | SmartKenya Online Shopping`}</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={mainImage} />
        <link rel="canonical" href={`https://smartkenya.co.ke/products/${product.product_id}`} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 mb-20 lg:py-8 px-0 sm:px-0 lg:px-8">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-10">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              {/* Main image and thumbnails */}
              <div className="relative">
                <motion.div
                  className={`relative ${isMobile ? "rounded-none shadow-none" : "rounded-2xl shadow-lg"} overflow-hidden bg-gradient-to-br from-gray-50 to-white border border-gray-200`}
                  whileHover={{ scale: isMobile ? 1 : 1.03 }}
                  transition={{ duration: 0.3 }}
                  onTouchStart={isMobile ? handleTouchStart : undefined}
                  onTouchEnd={isMobile ? handleTouchEnd : undefined}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mainImage}
                      initial={{ opacity: 0, scale: 0.99 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.01 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <Image
                        src={mainImage}
                        width={isMobile ? 800 : 500}
                        height={isMobile ? 800 : 500}
                        alt={product.name}
                        priority
                        className={`object-contain w-full ${isMobile ? "h-[60vw] max-h-[70vw]" : "max-h-[400px]"} transition-all duration-300`}
                      />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>

                {/* Thumbnails: Hide on mobile */}
                {!isMobile && (
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
                            width={48}
                            height={48}
                            alt="Thumbnail"
                            onClick={() => setMainImage(img)}
                            className={`cursor-pointer border-4 rounded-lg transition-all duration-300 ${mainImage === img ? "border-blue-500 shadow-md" : "border-transparent hover:border-blue-300"}`}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-7">
                <motion.h1
                  className="text-3xl font-extrabold text-gray-900 tracking-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {product.name}
                </motion.h1>

                <motion.p
                  className="text-gray-700 leading-relaxed text-base"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {product.description || "No description available."}
                </motion.p>

                <motion.div
                  className="text-2xl font-bold text-red-700"
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
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-600 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition duration-300 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed font-semibold"
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
                        description: product.description,
                        price: product.price,
                        quantity: 1,
                      };
                      localStorage.setItem("checkoutItems", JSON.stringify([item]));
                      router.push("/orders/checkout");
                    }}
                    disabled={checking}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-400 to-purple-400 text-white rounded-xl shadow-md hover:shadow-lg transition duration-300 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed font-semibold"
                  >
                    Buy Now
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
                    onClick={() => scrollToSection(tab)}
                    className={`text-lg font-semibold pb-2 capitalize transition duration-300 ${activeTab === tab ? "text-orange-700 border-b-2 border-orange-700" : "text-gray-500 hover:text-orange-500"}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tab}
                  </motion.button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="mt-8">
                {/* Specifications */}
                <div ref={specRef} className="scroll-mt-28 mb-12">
                  {activeTab === "specifications" && (
                    <motion.table
                      className="w-full border-collapse border border-gray-200 text-sm rounded-lg shadow-md"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-50 to-indigo-100">
                          <th className="p-3 text-left font-semibold text-gray-800">Specification</th>
                          <th className="p-3 text-left font-semibold text-gray-800">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(product.specification) && product.specification.length > 0 ? (
                          product.specification.map((spec, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="p-3 font-medium text-gray-700">{spec.name}</td>
                              <td className="p-3 text-gray-600">{spec.value}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="p-3 text-gray-500 text-center">
                              No specifications available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </motion.table>
                  )}
                </div>

                {/* Recommended */}
                <div ref={recoRef} className="scroll-mt-28 mb-12">
                  {activeTab === "recommended" && (
                    <motion.div
                      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      {recommended.map((product) => (
                        <ProductCard key={product.product_id} product={product} loading={false} />
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Reviews */}
                <div ref={reviewRef} className="scroll-mt-28">
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
                      <ReviewSection reviews={reviews} sortOrder={sortOrder} />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
