"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Logo from "./Logo";
import SearchBar from "./SearchBar";
import CartIcon from "./CartIcon";
import UserMenu from "./UserMenu";
import DesktopMenu from "./DesktopNav";
import MobileMenu from "./TabletNav";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();

  // Fetch cart count if user is logged in
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

  useEffect(() => {
    // Detect mobile devices
    const checkMobile = () => {
      setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-900 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-betwee h-16">
          {/* Left: Mobile menu toggle & Logo */}
          {!isMobile && (
          <div>
            <MobileMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
            {/*<Logo />*/} 
          </div>
          )}  
          <SearchBar />

          {/* Right: Desktop menu, cart, user */}
          {!isMobile && (
            <div className="flex items-center">
              <DesktopMenu />
              <div className="flex items-center space-x-6">
                <CartIcon cartCount={cartCount} />
                <UserMenu />
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
