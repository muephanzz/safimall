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
  Gift,
  Settings,
  BadgeDollarSign,
  Truck,
  Box,
  ClipboardCheck
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto py-8">
        {/* User Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-orange-300 shadow-sm"
                />
              ) : (
                <div className="p-3 bg-orange-100 rounded-full">
                  <UserIcon className="w-8 h-8 text-orange-600" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {userName}
                  <span className="text-orange-600 ml-2 text-lg">👋</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/support">
                <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-50">
                  <HelpCircle className="w-5 h-5" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
                className="relative text-gray-600 hover:bg-gray-50"
              >
                <Settings className="w-5 h-5" />
                {showMenu && (
                  <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-xl w-48 py-2">
                    <Button
                      variant="ghost"
                      className="w-full flex items-center gap-3 justify-start px-4 py-3 text-gray-700 hover:bg-gray-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      Sign Out
                    </Button>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isAdmin && (
            <Link href="/admin/dashboard" className="group">
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <LayoutDashboard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Admin Dashboard</h3>
                    <p className="text-sm text-gray-500">System management</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          <Link href="/orders/tracking" className="group">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Truck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Order Tracking</h3>
                  <p className="text-sm text-gray-500">Monitor shipments</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/orders/completed" className="group">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ClipboardCheck className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Order History</h3>
                  <p className="text-sm text-gray-500">Past purchases</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/refer" className="group">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-pink-100 rounded-lg">
                  <Gift className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Refer Friends</h3>
                  <p className="text-sm text-gray-500">Earn rewards</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="p-2 bg-gray-100 rounded-full">
                  <Box className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-gray-700">{item}</span>
                <span className="ml-auto text-sm text-gray-500">2h ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
