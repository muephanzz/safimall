"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  User as UserIcon,
  PackageSearch,
  PackageCheck,
  LayoutDashboard,
  LogOut,
  HelpCircle,
  Sun,
  Moon,
  Gift,
} from "lucide-react";

export default function AccountPage() {
  const { user, setUser } = useAuth();
  const [userName, setUserName] = useState("User");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data, error: userError } = await supabase.auth.getUser();
    const currentUser = data?.user;
    if (userError || !currentUser) return;
    setUser(currentUser);

    const { data: isAdminData } = await supabase.rpc("check_is_admin", {
      uid: currentUser.id,
    });
    setIsAdmin(isAdminData || false);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("user_id", currentUser.id)
      .maybeSingle();
    setUserName(profileData?.first_name || "User");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-xl">
          Please{" "}
          <Link href="/signin" className="text-orange-600 underline">
            Sign In
          </Link>{" "}
          to view your account.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 relative">
        {/* User Info */}
        <div className="flex items-center gap-4 mb-8">
          <UserIcon className="w-12 h-12 text-orange-500 bg-orange-100 rounded-full p-2" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Hello, <span className="text-orange-600">{userName}</span>
            </h2>
            <p className="text-gray-500 text-sm">Welcome back to your account</p>
          </div>
          {/* Menu toggle for logout/settings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMenu((v) => !v)}
            className="ml-auto"
            aria-label="Open settings"
          >
            <UserIcon />
          </Button>
          {showMenu && (
            <div className="absolute top-20 right-8 bg-white border rounded-xl shadow-lg z-10 p-2 w-48">
              <Button
                variant="ghost"
                className="w-full flex items-center gap-2 text-gray-700"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 text-red-500" />
                Logout
              </Button>
              <Button
                variant="ghost"
                className="w-full flex items-center gap-2 text-gray-700"
                onClick={() => setDarkMode((d) => !d)}
              >
                {darkMode ? (
                  <>
                    <Sun className="w-5 h-5" /> Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-5 h-5" /> Dark Mode
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Premium/Quick Actions */}
        <div className="flex gap-3 mb-8">
          <Button variant="outline" className="flex-1 flex gap-2" asChild>
            <Link href="/support">
              <HelpCircle className="w-5 h-5" />
              Support
            </Link>
          </Button>
          <Button variant="outline" className="flex-1 flex gap-2" asChild>
            <Link href="/refer">
              <Gift className="w-5 h-5" />
              Refer a Friend
            </Link>
          </Button>
        </div>

        {/* Navigation */}
        <div className="space-y-4">
          {isAdmin && (
            <Button
              variant="default"
              className="w-full flex items-center gap-3"
              asChild
            >
              <Link href="/admin/dashboard">
                <LayoutDashboard className="w-5 h-5" />
                Admin Panel
              </Link>
            </Button>
          )}
          <Button variant="outline" className="w-full flex items-center gap-3" asChild>
            <Link href="/profile/see-profile">
              <UserIcon className="w-5 h-5" />
              Profile
            </Link>
          </Button>
          <Button variant="outline" className="w-full flex items-center gap-3" asChild>
            <Link href="/orders/tracking">
              <PackageSearch className="w-5 h-5" />
              Order Tracking
            </Link>
          </Button>
          <Button variant="outline" className="w-full flex items-center gap-3" asChild>
            <Link href="/orders/completed">
              <PackageCheck className="w-5 h-5" />
              Completed Orders
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
