"use client";

import { Home, Menu, ShoppingCart, User, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function BottomNav() {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    const fetchCartCount = async () => {
      if (user) {
        const { count, error } = await supabase
          .from("cart")
          .select("*", { count: "exact" })
          .eq("user_id", user.id);
        if (!error) setCartCount(count || 0);
      }
    };
    fetchCartCount();
  }, [user]);

  if (!isMobile) return null;

  const buttonStyle = (active: boolean) =>
    `flex flex-col items-center justify-center text-xs font-semibold transition-transform duration-300 ease-in-out ${
      active
        ? "text-orange-600 scale-110"
        : "text-gray-600 hover:text-orange-500 hover:scale-105"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 backdrop-blur-md bg-white/90 border-t border-gray-200 shadow-lg">
      <div className="flex justify-around items-center py-3 px-1 max-w-lg mx-auto">
        <Link href="/" aria-label="Home">
          <button
            className={buttonStyle(pathname === "/")}
            aria-current={pathname === "/" ? "page" : undefined}
            type="button"
          >
            <Home size={26} />
            <span className="mt-1 select-none">Home</span>
          </button>
        </Link>

        <Link href="/categories" aria-label="Categories">
          <button
            className={buttonStyle(pathname === "/categories")}
            aria-current={pathname === "/categories" ? "page" : undefined}
            type="button"
          >
            <Menu size={26} />
            <span className="mt-1 select-none">Categories</span>
          </button>
        </Link>

        <Link href="/chat" aria-label="Messages">
          <button
            className={buttonStyle(pathname === "/chat")}
            aria-current={pathname === "/chat" ? "page" : undefined}
            type="button"
          >
            <MessageSquare size={26} />
            <span className="mt-1 select-none">Messages</span>
          </button>
        </Link>

        <Link href="/cart" aria-label="Cart">
          <button
            className={buttonStyle(pathname === "/cart")}
            aria-current={pathname === "/cart" ? "page" : undefined}
            type="button"
          >
            <div className="relative">
              <ShoppingCart size={26} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-3 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 min-w-[18px] min-h-[18px]">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </div>
            <span className="mt-1 select-none">Cart</span>
          </button>
        </Link>

        <Link href={user ? "/account" : "/signin"} aria-label="Account">
          <button
            className={buttonStyle(
              pathname === "/account" || pathname === "/signin"
            )}
            aria-current={
              pathname === "/account" || pathname === "/signin"
                ? "page"
                : undefined
            }
            type="button"
          >
            <User size={26} />
            <span className="mt-1 select-none">Account</span>
          </button>
        </Link>
      </div>
    </nav>
  );
}
