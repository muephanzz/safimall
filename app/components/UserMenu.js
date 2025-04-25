"use client";

import { Button } from "@/components/ui/button";
import { Menu, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import {
  User2,
  LogOut,
  ShoppingBasket,
  ChevronDown,
  Package,
  User,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function UserMenu({ onSignIn }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("User");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useAuth();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);

    const { data, error: userError } = await supabase.auth.getUser();
    const currentUser = data?.user;

    if (userError || !currentUser) {
      console.error("Error fetching user or user not logged in:", userError);
      setLoading(false);
      return;
    }

    setUser(currentUser); // update global auth state

    const { data: isAdminData, error: adminError } = await supabase.rpc("check_is_admin", {
      uid: currentUser.id,
    });

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (adminError) console.error("Error checking admin status:", adminError);
    setIsAdmin(isAdminData || false);

    if (profileError) console.error("Error fetching profile data:", profileError);
    setUserName(profileData?.first_name || "User");

    setLoading(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      toast.success("Logged out successfully!");
      setUser(null);
      router.push("/"); // smoother navigation without full reload
    } else {
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <div className="relative text-left">
      {user ? (
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button
            className="inline-flex items-center justify-center hover:bg-gray-800 p-2 transition"
            aria-label="User menu"
          >
            <User2 className="w-6 h-6 text-white" />
            <ChevronDown className="w-4 h-4 ml-1 text-gray-300" aria-hidden="true" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-100"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right divide-y divide-gray-200 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div className="px-4 py-3 bg-indigo-600 rounded-t-md">
                <p className="text-sm text-white">
                  Hello, <span className="font-semibold text-yellow-400">{userName}</span>
                </p>
              </div>

              <div className="py-1">
                {isAdmin && (
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/admin/dashboard"
                        className={`flex items-center px-4 py-2 text-sm font-medium ${
                          active ? "bg-indigo-100 text-indigo-700" : "text-gray-700"
                        }`}
                      >
                        <ShoppingBasket className="mr-3 w-5 h-5 text-indigo-600" />
                        Admin Panel
                      </Link>
                    )}
                  </Menu.Item>
                )}

                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/profile/see-profile"
                      className={`flex items-center px-4 py-2 text-sm font-medium ${
                        active ? "bg-indigo-100 text-indigo-700" : "text-gray-700"
                      }`}
                    >
                      <User className="mr-3 w-5 h-5 text-indigo-600" />
                      Profile
                    </Link>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/orders/tracking"
                      className={`flex items-center px-4 py-2 text-sm font-medium ${
                        active ? "bg-indigo-100 text-indigo-700" : "text-gray-700"
                      }`}
                    >
                      <Package className="mr-3 w-5 h-5 text-indigo-600" />
                      Order Tracking
                    </Link>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/orders/completed"
                      className={`flex items-center px-4 py-2 text-sm font-medium ${
                        active ? "bg-indigo-100 text-indigo-700" : "text-gray-700"
                      }`}
                    >
                      <CheckCircle className="mr-3 w-5 h-5 text-indigo-600" />
                      Completed Orders
                    </Link>
                  )}
                </Menu.Item>
              </div>

              <div className="py-1 border-t border-gray-200">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`flex w-full items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:bg-red-100 rounded-b-md ${
                        active ? "bg-red-50" : ""
                      }`}
                    >
                      <LogOut className="mr-3 w-5 h-5" />
                      Logout
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      ) : (
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button
            className="inline-flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 p-2 transition"
            aria-label="User menu"
          >
            <User2 className="w-6 h-6 text-white" />
            <ChevronDown className="w-4 h-4 ml-1 text-gray-300" aria-hidden="true" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-100"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white z-50">
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/signin"
                    className="block px-4 py-2 text-sm font-medium text-gray-700"
                  >
                    <User className="inline-block h-5 shandow-md text-indigo-600" />
                    Sign in
                  </Link>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      )}
    </div>
  );
}
