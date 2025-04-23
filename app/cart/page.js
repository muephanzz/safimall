"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import OrderSummary from "../components/OrderSummary";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) return console.error("Error fetching session:", error.message);

      if (session?.user) {
        setUserId(session.user.id);
        fetchCart(session.user.id);
      }
    };

    const fetchCart = async (userId) => {
      const { data: cartData, error: cartError } = await supabase
        .from("cart")
        .select("*")
        .eq("user_id", userId);

      if (cartError) return console.error("Error fetching cart:", cartError.message);

      const productIds = cartData.map((item) => item.product_id);
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("product_id, stock")
        .in("product_id", productIds);

      if (productsError) return console.error("Error fetching products:", productsError.message);

      const cartWithStock = cartData.map((item) => ({
        ...item,
        stock: productsData.find((p) => p.product_id === item.product_id)?.stock || 0,
      }));

      setCartItems(cartWithStock);
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleRemoveItem = async (cart_id) => {
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

  const toggleSelection = (cart_id) => {
    setSelectedItems((prev) => ({
      ...prev,
      [cart_id]: !prev[cart_id],
    }));
  };

  const updateQuantity = async (cart_id, newQuantity) => {
    if (newQuantity < 1) return;

    const { error } = await supabase
      .from("cart")
      .update({
        items: { ...cartItems.find((item) => item.cart_id === cart_id).items, quantity: newQuantity },
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

  const subtotal = cartItems
    .filter((item) => selectedItems[item.cart_id])
    .reduce((sum, item) => sum + item.items.price * item.items.quantity, 0);

  const shippingFee = Object.keys(selectedItems).length > 0 ? 0 : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin w-12 h-12 text-blue-600" />
      </div>
    );
  }

  // Helper: Estimated delivery date (3-7 days from now)
  const getEstimatedDelivery = () => {
    const minDays = 3;
    const maxDays = 7;
    const daysToAdd = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-28 p-6 max-w-6xl mx-auto bg-gradient-to-br from-white to-slate-100 shadow-2xl rounded-3xl border border-gray-200"
    >
      <h1 className="text-4xl font-extrabold mb-10 text-gray-900 tracking-wide select-none flex items-center gap-3">
        🛒 Your Premium Cart
        <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">Exclusive Deals</span>
      </h1>

      <div className="space-y-8">
        <AnimatePresence>
          {cartItems.length === 0 && (
            <p className="text-center text-gray-500 italic text-lg">Your cart is empty. Start shopping now!</p>
          )}

          {cartItems.map((item) => {
            const isSelected = !!selectedItems[item.cart_id];
            const outOfStock = item.stock < item.items.quantity;

            return (
              <motion.div
                key={item.cart_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`flex flex-col sm:flex-row items-center sm:justify-between bg-white rounded-2xl shadow-lg p-5 gap-5 border ${
                  isSelected ? "border-blue-500" : "border-transparent"
                } hover:shadow-xl transition-shadow duration-300`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelection(item.cart_id)}
                  className="w-6 h-6 accent-blue-600 cursor-pointer"
                  aria-label={`Select ${item.items.name}`}
                />

                <Image
                  width={120}
                  height={120}
                  unoptimized
                  src={item.items.image_url}
                  alt={item.items.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-xl border border-gray-300 shadow-sm"
                />

                <div className="flex-1 px-4 text-center sm:text-left">
                  <h3 className="text-xl font-semibold text-gray-900 leading-tight">{item.items.name}</h3>

                  <p className="text-blue-700 font-semibold text-lg mt-1">
                    Ksh {item.items.price.toLocaleString()} × {item.items.quantity}
                  </p>

                  <p className="text-gray-800 font-bold text-lg mt-1">
                    Total: Ksh {(item.items.price * item.items.quantity).toLocaleString()}
                  </p>

                  {outOfStock && (
                    <p className="mt-2 text-sm text-red-600 font-semibold">
                      ⚠️ Only {item.stock} left in stock, please reduce quantity.
                    </p>
                  )}

                  <p className="mt-3 text-sm text-gray-500 italic select-none">
                    Estimated delivery by <span className="font-semibold">{getEstimatedDelivery()}</span>
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.cart_id, item.items.quantity - 1)}
                    disabled={item.items.quantity <= 1}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    aria-label={`Increase quantity of ${item.items.name}`}
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => handleRemoveItem(item.cart_id)}
                  className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition"
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

      <OrderSummary subtotal={subtotal} shippingFee={shippingFee} />

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
        className={`mt-10 mb-24 px-8 py-4 text-white font-semibold rounded-3xl w-full shadow-xl transition-transform duration-300 ease-in-out transform hover:scale-[1.03] focus:outline-none focus:ring-4 focus:ring-green-400 ${
          subtotal === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
        }`}
        disabled={subtotal === 0}
        aria-disabled={subtotal === 0}
      >
        {subtotal === 0 ? "Select items to proceed" : "Proceed to Checkout"}
      </button>
    </motion.div>
  );
}
