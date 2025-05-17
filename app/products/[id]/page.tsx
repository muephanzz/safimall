"use client";

import ShippingAddressForm from "@/components/ShippingAddressForm";
import React, { useEffect, useState, useRef, TouchEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import toast from "react-hot-toast";
import ProductCard, { Product as ProductCardType } from "@/components/ProductCard";
import ReviewSection from "@/components/ReviewSection";
import { motion, AnimatePresence } from "framer-motion";
import Head from "next/head";
import SearchBar from "@/components/SearchBar";

interface ShippingAddress {
  address_id: string;
  recipient_name: string;
  phone_number: string;
  address_line1: string;
  county_id: string | number;
  constituency_id: string | number;
  location_id: string | number;
  counties?: { name: string };
  constituencies?: { name: string };
  locations?: { name: string };
}

// Skeleton Loader
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
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // New: Modal state for options
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [showOptions, setShowOptions] = useState<null | "cart" | "buy">(null);
  const [Colors, setColors] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");

  // Refs for scroll-based tab switching
  const specRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const recoRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [addressSummary, setAddressSummary] = useState<any>(null);
  const [showAddressEdit, setShowAddressEdit] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("shipping_addresses")
      .select(
        `*, 
        counties(name), 
        constituencies(name), 
        locations(name)`
      )
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        if (data) setAddressSummary(data);
        else setAddressSummary(null);
      });
  }, [userId, showAddressEdit]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // Mobile detection
  useEffect(() => {
    // Detect mobile device based on user agent
    const checkMobile = () => {
      setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  // Fetch product, reviews, recommendations, and Colors
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
          // Parse Colors from attribute field (JSON)
          try {
            console.log("Raw attribute:", productData.attribute);
            const attr = typeof productData.attribute === "string"
              ? JSON.parse(productData.attribute)
              : productData.attribute;
            console.log("Parsed attribute:", attr);
            setColors(attr?.Color || []);
            console.log("Colors extracted:", attr?.Color || []);
          } catch (err) {
            console.error("Error parsing attribute:", err);
            setColors([]);
          }
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

  // Add to cart handler: now opens modal
  const handleAddToCart = () => setShowOptions("cart");
  const handleBuyNow = () => setShowOptions("buy");

  // Confirm modal selection
  const handleConfirmOptions = async () => {
    if (!selectedColor || !selectedAddress) {
      toast.error("Please select both Color and delivery address.");
      return;
    }
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
            Color: selectedColor,
            address: selectedAddress,
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
              Color: selectedColor,
              address: selectedAddress,
            }
          }
        ]);
      }
      toast.success("Item added to cart!");
      setShowOptions(null);
      if (showOptions === "cart") window.location.reload();
      if (showOptions === "buy") router.push("/orders/checkout");
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

      {isMobile && (
        <div className="sticky top-0 z-30 bg-white flex items-center px-2 py-2 shadow-md">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 mr-2"
          >
            {/* Simple left arrow SVG */}
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <SearchBar />
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-0 px-0">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 bg-white rounded-2xl shadow-2xl overflow-hidden mt-4">
          {/* Left: Image Gallery */}
          <div className="w-full lg:w-2/5 p-6 pt-10 flex flex-col items-center">
            <motion.div
              className="w-full aspect-square bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl shadow-lg relative"
              whileHover={{ scale: 1.03 }}
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
                    width={600}
                    height={600}
                    alt={product.name}
                    priority
                    className="object-contain w-full h-full transition-all duration-300"
                  />
                </motion.div>
              </AnimatePresence>
              {/* Show image count on mobile */}
              {isMobile && product.image_urls?.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                  {product.image_urls.indexOf(mainImage) + 1} / {product.image_urls.length}
                </div>
              )}
            </motion.div>
            {/* Thumbnails: hide on mobile */}
            {!isMobile && product.image_urls?.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-thin flex">
                {product.image_urls.map((img, idx) => (
                  <Image
                    key={idx}
                    src={img}
                    width={64}
                    height={64}
                    alt={`Thumbnail ${idx + 1}`}
                    onClick={() => setMainImage(img)}
                    className={`cursor-pointer border-2 rounded-lg ${mainImage === img ? "border-orange-500" : "border-gray-200"}`}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Mobile: Show main image only */}
          {/* Right: Product Info */}
          <div className="w-full lg:w-3/5 p-6 pt-10 flex flex-col gap-4 sticky top-0 self-start overflow-x-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">In Stock</span>
              {/* Add more badges as needed */}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-700 text-base mb-2">{product.description}</p>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl font-bold text-red-600">Ksh {product.price.toLocaleString()}</span>
              {/* You can add old price or discount badge here */}
              {addressSummary && !showAddressEdit && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-4">
                  <span>
                    <strong>{addressSummary.recipient_name}</strong>, {addressSummary.phone_number}, {addressSummary.address_line1}, 
                    {addressSummary.locations?.name}, {addressSummary.constituencies?.name}, {addressSummary.counties?.name}
                  </span>
                  <button
                    onClick={() => setShowAddressEdit(true)}
                    className="ml-4 px-3 py-1 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 text-xs"
                  >
                    Edit
                  </button>
                </div>
              )}
              {showAddressEdit && (
                <ShippingAddressForm
                  userId={userId}
                  onSaved={(address: ShippingAddress) => {
                    setAddressSummary(address);
                    setShowAddressEdit(false); // or whatever closes the form
                  }}
                  onBack={() => setShowAddressEdit(false)} // This will be called when user clicks the back icon
                />
              )}
            </div>
            {Colors.length > 0 && (
  <div className="mb-4">
    <label className="block font-semibold mb-1">Select Color:</label>
    <div className="flex gap-2">
      {Colors.map((color) => (
        <button
          key={color}
          className={`px-4 py-2 rounded border ${selectedColor === color ? "border-blue-500 bg-blue-100" : "border-gray-300"}`}
          onClick={() => setSelectedColor(color)}
          type="button"
        >
          {color}
        </button>
      ))}
    </div>
  </div>
)}

          {!isMobile && (
            <div className="flex gap-4 mb-4 flex">
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg shadow transition"
              >
                {adding ? "Adding..." : "Add to Cart"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={checking}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg shadow transition"
              >
                Buy Now
              </button>
            </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span>✓ Free Delivery in Nairobi</span>
              <span>•</span>
              <span>✓ 7 Days Return</span>
            </div>
            <div className="text-xs text-gray-400">Sold by: SmartKenya Official Store</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto mt-8 px-4">
          <div className="flex gap-6 border-b border-gray-200 pb-2 sticky overflow-hidden top-14 bg-white z-10">
            {["specifications", "reviews", "recommended"].map((tab) => (
              <button
                key={tab}
                onClick={() => scrollToSection(tab)}
                className={`text-lg font-semibold pb-2 capitalize transition duration-300 ${
                  activeTab === tab ? "text-orange-600 border-b-2 border-orange-600" : "text-gray-500 hover:text-orange-500"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Tab Content */}
          <div className="mt-8">
            {/* Specifications */}
            <div ref={specRef} className="scroll-mt-28 mb-12">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Product Specifications</h2>
              <table className="w-full border border-gray-200 rounded-lg overflow-hidden mb-4">
                <tbody>
                  {Array.isArray(product.specification) && product.specification.length > 0 ? (
                    product.specification.map((spec, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <td className="p-3 font-medium text-gray-700 w-1/3">{spec.name}</td>
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
              </table>
            </div>
            {/* Reviews */}
            <div ref={reviewRef} className="scroll-mt-28 mb-12">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Customer Reviews ({reviews.length})</h2>
              <select
                onChange={(e) => setSortOrder(e.target.value)}
                value={sortOrder}
                className="mb-4 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
              <ReviewSection reviews={reviews} sortOrder={sortOrder} />
            </div>
            {/* Recommendations */}
            <div ref={recoRef} className="scroll-mt-28">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Recommended Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {recommended.map((product) => (
                  <ProductCard key={product.product_id} product={product} loading={false} />
                ))}
              </div>
            </div>
          </div>

        {/* Mobile Fixed Bottom Bar */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex gap-2 p-4 z-50 md:hidden">
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg shadow transition"
            >
              {adding ? "Adding..." : "Add to Cart"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={checking}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg shadow transition"
            >
              Buy Now
            </button>
          </div>
        )}

        {/* Modal for Color & Address Selection */}
        <AnimatePresence>
          {showOptions && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-auto relative">
                <button
                  onClick={() => setShowOptions(null)}
                  className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100"
                  aria-label="Close"
                >
                  <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M6 6l12 12M6 18L18 6" />
                  </svg>
                </button>
                <h2 className="text-lg font-bold mb-4">
                  Confirm your selection
                </h2>
                <div className="mb-4">
                  <label className="block font-semibold mb-1">Select Color:</label>
                  <div className="flex gap-2">
                    {Colors.map((color) => (
                      <button
                        key={color}
                        className={`px-4 py-2 rounded border ${selectedColor === color ? "border-blue-500 bg-blue-100" : "border-gray-300"}`}
                        onClick={() => setSelectedColor(color)}
                        type="button"
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
                {/* If no address, show address form */}
                {!addressSummary ? (
                  <ShippingAddressForm
                    userId={userId}
                    onSaved={(address: ShippingAddress) => {
                      setAddressSummary(address);
                      setShowAddressEdit(false); // or whatever closes the form
                    }}
                    onBack={() => setShowAddressEdit(false)} // This will be called when user clicks the back icon
                  />
                ) : (
                  <>
                    {/* Show address summary in modal too */}
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-4">
                      <span>
                        <strong>{addressSummary.recipient_name}</strong>, {addressSummary.phone_number}, {addressSummary.address_line1}, 
                        {addressSummary.locations?.name}, {addressSummary.constituencies?.name}, {addressSummary.counties?.name}
                      </span>
                      <button
                        onClick={() => {
                          setShowOptions(null);
                          setShowAddressEdit(true);
                        }}
                        className="ml-4 px-3 py-1 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 text-xs"
                      >
                        Edit
                      </button>
                    </div>
                    {/* Only show color selector if address exists */}
                    {Colors.length > 0 && (
                      <div className="mb-4">
                        <h3 className="font-semibold mb-2">Select Color:</h3>
                        <div className="flex gap-2 flex-wrap">
                          {Colors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`px-4 py-2 rounded border 
                                ${selectedColor === color ? "border-orange-500 bg-orange-50 font-bold" : "border-gray-300 bg-white"}
                                hover:border-orange-400 transition`}
                              onClick={() => setSelectedColor(color)}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                        {!selectedColor && <p className="text-xs text-red-500 mt-1">Please select a color.</p>}
                      </div>
                    )}

                  </>
                )}
                <button
                  onClick={handleConfirmOptions}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg shadow transition"
                  disabled={adding}
                >
                  {adding ? "Processing..." : showOptions === "cart" ? "Add to Cart" : "Buy Now"}
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>        
        </div>
      </div>
    </>
  );
}
