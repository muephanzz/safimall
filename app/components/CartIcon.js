import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function CartIcon({ cartCount }) {
  return (
    <Link
      href="/cart"
      aria-label={`Cart with ${cartCount} item${cartCount !== 1 ? "s" : ""}`}
      className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white bg-opacity-20 text-white hover:bg-white hover:text-black transition-colors duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <ShoppingCart size={24} />
      {cartCount > 0 && (
        <span
          aria-live="polite"
          className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold min-w-[18px] min-h-[18px] px-1 select-none shadow-lg"
        >
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </Link>
  );
}
