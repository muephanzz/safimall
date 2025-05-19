"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, LogIn } from "lucide-react";
import Image from "next/image";
import OrderSummary from "../components/OrderSummary";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";

interface CartItem {
  cart_id: string;
  user_id: string;
  product_id: string;
  items: {
    name: string;
    price: number;
    quantity: number;
    image_url: string;
    color?: string;
    description?: string;
  };
  stock: number;
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const subtotal = cartItems
    .filter((item) => selectedItems[item.cart_id])
    .reduce((sum, item) => sum + item.items.price * item.items.quantity, 0);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
        fetchCart(session.user.id);
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    const fetchCart = async (userId: string) => {
      const { data: cartData, error: cartError } = await supabase
        .from("cart")
        .select("*")
        .eq("user_id", userId);

      if (cartError) {
        setLoading(false);
        return;
      }

      const productIds = cartData.map((item) => item.product_id);
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("product_id, stock")
        .in("product_id", productIds);

      if (productsError) {
        setLoading(false);
        return;
      }

      const cartWithStock = cartData.map((item) => ({
        ...item,
        stock: productsData.find((p) => p.product_id === item.product_id)?.stock || 0,
      })) as CartItem[];

      setCartItems(cartWithStock);
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleRemoveItem = async (cart_id: string) => {
    const confirmation = window.confirm("Are you sure you want to remove this product?");
    if (!confirmation) return;
    const { error } = await supabase.from("cart").delete().eq("cart_id", cart_id);
    if (error) {
      toast.error("Failed to remove item.");
    } else {
      setCartItems((prev) => prev.filter((item) => item.cart_id !== cart_id));
      const updatedSelection = { ...selectedItems };
      delete updatedSelection[cart_id];
      setSelectedItems(updatedSelection);
      toast.success("Item removed from cart.");
    }
  };

  const toggleSelection = (cart_id: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [cart_id]: !prev[cart_id],
    }));
  };

  const updateQuantity = async (cart_id: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const { error } = await supabase
      .from("cart")
      .update({
        items: { ...cartItems.find((item) => item.cart_id === cart_id)?.items, quantity: newQuantity },
      })
      .eq("cart_id", cart_id);

    if (error) {
      toast.error("Failed to update quantity.");
    } else {
      setCartItems((prev) =>
        prev.map((item) =>
          item.cart_id === cart_id ? { ...item, items: { ...item.items, quantity: newQuantity } } : item
        )
      );
      toast.success("Quantity updated!");
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="bg-gray-100 flex justify-center items-center">
        <div className="min-h-screen md:w-3/4 w-full bg-gradient-to-br from-slate-50 to-orange-50 mb-20 lg:py-24 px-0 sm:px-0 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-2xl lg:p-8 mb-8"
          >
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
              <div className="bg-orange-100 p-6 rounded-full">
                <LogIn className="w-16 h-16 text-[#f68b1e]" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 text-center">
                Access Your Premium Cart
              </h2>
              <p className="text-lg text-gray-600 max-w-xl text-center">
                Sign in to view your curated selection and enjoy seamless checkout.
              </p>
              <button
                onClick={() => router.push("/signin")}
                className="px-8 py-3 bg-gradient-to-r from-[#f68b1e] to-orange-400 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Sign In Now
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin w-12 h-12 text-[#f68b1e]" />
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-2">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-wide select-none flex items-center gap-3">
              🛒 Your Cart
              <span className="text-sm font-semibold text-[#f68b1e] bg-orange-100 px-2 py-1 rounded-full">
                Jumia Deals
              </span>
            </h1>
            <p className="mt-3 sm:mt-0 text-gray-600 max-w-md">
              Review your selected items, adjust quantities, and proceed to a seamless checkout experience.
            </p>
          </header>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1">
              <div className="space-y-6">
                <AnimatePresence>
                  {cartItems.length === 0 && !loading && (
                    <div className="text-center py-12 space-y-4">
                      <p className="text-2xl text-gray-700 font-medium">
                        Your Cart is Empty
                      </p>
                      <p className="text-gray-500">
                        Discover exclusive products and build your perfect selection
                      </p>
                    </div>
                  )}

                  {cartItems.map((item) => {
                    const isSelected = !!selectedItems[item.cart_id];
                    const outOfStock = item.stock < item.items.quantity;
                    const truncatedDescription = item.items.description?.split(" ").slice(0, 6).join(" ") + "...";

                    return (
                      <motion.div
                        key={item.cart_id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.3 }}
                        className={`flex flex-col sm:flex-row items-center sm:justify-between bg-white rounded-xl shadow-md p-5 gap-5 border ${
                          isSelected ? "border-[#f68b1e]" : "border-gray-100"
                        } hover:shadow-lg transition-shadow duration-300`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(item.cart_id)}
                          className="w-6 h-6 accent-[#f68b1e] cursor-pointer"
                          aria-label={`Select ${item.items.name}`}
                        />

                        <Image
                          width={120}
                          height={120}
                          unoptimized
                          src={item.items.image_url}
                          alt={item.items.name}
                          className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-lg border border-gray-200 shadow"
                        />

                       <div className="flex-1 px-4 text-center sm:text-left">
                        {item.items.description && (
                          <p className="text-lg font-semibold text-gray-900 mb-2">
                            {item.items.description}
                          </p>
                        )}

                        {item.items.color && (
                          <span className="inline-block bg-orange-50 text-[#f68b1e] font-medium text-xs px-3 py-1 rounded-full mb-2">
                            Color: {item.items.color}
                          </span>
                        )}

                        <p className="text-[#f68b1e] font-bold text-lg mt-1">
                          Ksh {item.items.price.toLocaleString()} × {item.items.quantity}
                        </p>

                        <p className="text-gray-900 font-bold text-lg mt-1">
                          Total: <span className="text-[#f68b1e]">Ksh {(item.items.price * item.items.quantity).toLocaleString()}</span>
                        </p>

                        {outOfStock && (
                          <p className="mt-2 text-sm text-red-600 font-semibold">
                            ⚠️ Only {item.stock} left in stock, please reduce quantity.
                          </p>
                        )}

                        <p className="mt-3 text-xs text-gray-400 italic select-none">
                          Estimated delivery: <span className="font-semibold text-[#f68b1e]">Tomorrow</span>
                        </p>
                      </div>

                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.cart_id, item.items.quantity - 1)}
                            disabled={item.items.quantity <= 1}
                            className="px-3 py-2 bg-orange-100 text-[#f68b1e] rounded-full hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            aria-label={`Decrease quantity of ${item.items.name}`}
                          >
                            −
                          </button>
                          <span className="px-5 py-2 bg-gray-100 rounded-lg border text-gray-700 font-medium select-none">
                            {item.items.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.cart_id, item.items.quantity + 1)}
                            disabled={outOfStock}
                            className="px-3 py-2 bg-orange-100 text-[#f68b1e] rounded-full hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            aria-label={`Increase quantity of ${item.items.name}`}
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.cart_id)}
                          className="p-3 bg-[#f68b1e] hover:bg-orange-600 text-white rounded-full shadow-lg transition"
                          aria-label={`Remove ${item.items.name} from cart`}
                          title="Remove item"
                        >
                          <Trash2 size={20} />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
            {/* Order Summary */}
            <div className="w-full lg:w-[350px]">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                <h3 className="text-xl font-semibold mb-6 text-gray-900">
                  Order Summary
                </h3>
                <div className="flex justify-between mb-2 text-gray-700">
                  <span>Subtotal</span>
                  <span>Ksh {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2 text-gray-700">
                  <span>Shipping</span>
                  <span className="text-[#f68b1e] font-semibold">FREE</span>
                </div>
                <hr className="my-4" />
                <div className="flex justify-between font-bold text-lg text-gray-900">
                  <span>Total</span>
                  <span>Ksh {subtotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => {
                    const selectedProducts = cartItems
                      .filter((item) => selectedItems[item.cart_id])
                      .map(({ items }) => items);

                    if (selectedProducts.length === 0) {
                      toast.warning("Please select at least one item.");
                      return;
                    }

                    localStorage.setItem("checkoutItems", JSON.stringify(selectedProducts));
                    router.push("/orders/checkout");
                  }}
                  className={`mt-6 w-full py-3 rounded-xl font-semibold text-white shadow-lg transition ${
                    subtotal === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#f68b1e] hover:bg-orange-600"
                  }`}
                  disabled={subtotal === 0}
                  aria-disabled={subtotal === 0}
                >
                  {subtotal === 0 ? "Select items to proceed" : "Proceed to Checkout"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <BottomNav />
    </section>
  );
}
