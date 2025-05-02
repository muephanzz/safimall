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

interface ProfileData {
  first_name?: string;
  avatar_url?: string | null;
  profile_completion?: number;
}

export default function AccountPage() {
  const { user, setUser } = useAuth();
  const [userName, setUserName] = useState("User");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data, error: userError } = await supabase.auth.getUser();
    const currentUser = data?.user;
    if (userError || !currentUser) return;
    setUser(currentUser);

    // Check admin status
    const { data: isAdminData } = await supabase.rpc("check_is_admin", {
      uid: currentUser.id,
    });
    setIsAdmin(isAdminData || false);

    // Fetch profile data
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile data:", profileError);
    }

    setUserName(profileData?.first_name || "User");
    setAvatarUrl(profileData?.avatar_url || null);
    setProfileCompletion(profileData?.profile_completion ?? 0);

    // Mock recent activity (replace with real fetch if available)
    setRecentActivity([
      "Order #1234 delivered",
      "Profile updated",
      "Referred a friend",
      "Completed order #5678",
    ]);
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
    <div className="min-h-screen md:w-3/4 w-full bg-gradient-to-br from-slate-50 to-blue-50 pb-10 lg:py-24 px-0 sm:px-0 lg:px-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
        {/* User Info */}
        <div className="flex items-center gap-4 mb-6">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="w-16 h-16 rounded-full object-cover border-2 border-orange-400 shadow"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/default-avatar.png"; // fallback image path
              }}
            />
          ) : (
            <UserIcon className="w-16 h-16 text-orange-500 bg-orange-100 rounded-full p-3" />
          )}
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Hello, <span className="text-orange-600">{userName}</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-300 text-sm mt-1">
              Welcome back to your account
            </p>

            {/* Profile Completion Meter */}
            <div className="mt-3 w-48 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-3 bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
              Profile {profileCompletion}% complete
            </p>
          </div>

          {/* Settings Menu Toggle */}
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
            <div className="absolute top-20 right-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg z-20 p-2 w-48">
              <Button
                variant="ghost"
                className="w-full flex items-center gap-2 text-gray-700 dark:text-gray-200"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 text-red-500" />
                Logout
              </Button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-8">
          <Link href="/support" className="flex-1">
            <Button variant="outline" className="w-full flex items-center gap-2 justify-center">
              <HelpCircle className="w-5 h-5" />
              Support
            </Button>
          </Link>
          <Link href="/refer" className="flex-1">
            <Button variant="outline" className="w-full flex items-center gap-2 justify-center">
              <Gift className="w-5 h-5" />
              Refer a Friend
            </Button>
          </Link>
        </div>

        {/* Navigation */}
        <div className="space-y-4">
          {isAdmin && (
            <Link href="/admin/dashboard">
              <Button variant="default" className="w-full flex items-center gap-3 justify-center">
                <LayoutDashboard className="w-5 h-5" />
                Admin Panel
              </Button>
            </Link>
          )}
          <Link href="/profile/see-profile">
            <Button variant="outline" className="w-full flex items-center gap-3 justify-center">
              <UserIcon className="w-5 h-5" />
              Profile
            </Button>
          </Link>
          <Link href="/orders/tracking">
            <Button variant="outline" className="w-full flex items-center gap-3 justify-center">
              <PackageSearch className="w-5 h-5" />
              Order Tracking
            </Button>
          </Link>
          <Link href="/orders/completed">
            <Button variant="outline" className="w-full flex items-center gap-3 justify-center">
              <PackageCheck className="w-5 h-5" />
              Completed Orders
            </Button>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
            Recent Activity
          </h3>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity.</p>
          ) : (
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
              {recentActivity.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
