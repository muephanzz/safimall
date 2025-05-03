import Link from "next/link";
import { ShoppingCart } from "lucide-react";

interface CartIconProps {
  cartCount: number;
}

export default function CartIcon({ cartCount }: CartIconProps) {
  return (
    <Link
      href="/cart"
      aria-label={`Cart with ${cartCount} item${cartCount !== 1 ? "s" : ""}`}
      className="relative p-2 text-white hover:bg-gray-800 transition"
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
