"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Pencil, Mail, User, Phone, MapPin, ShoppingBag, Gift } from "lucide-react";
import { motion } from "framer-motion";

// Define types for your data
type Profile = {
  avatar_url: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  loyalty_points?: number;
};

type Address = {
  id: string;
  street: string;
  city: string;
  country: string;
  is_default: boolean;
};

type Order = {
  id: string;
  status: string;
  total: number;
  created_at: string;
};

const Profiles = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
    fetchRecentOrders();
    fetchAddresses();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error: userError } = await supabase.auth.getUser();
    const user = data?.user;

    if (userError || !user) {
      setLoading(false);
      return;
    }

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      setLoading(false);
      return;
    }

    setProfile(profileData || null);
    setLoading(false);
  };

  const fetchRecentOrders = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return;

    const { data: ordersData, error } = await supabase
      .from("orders")
      .select("id, status, total, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) {
      console.error("Error fetching orders:", error);
      return;
    }

    setRecentOrders(ordersData || []);
  };

  const fetchAddresses = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return;

    const { data: addressesData, error } = await supabase
      .from("addresses")
      .select("id, street, city, country, is_default")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching addresses:", error);
      return;
    }

    setAddresses(addressesData || []);
  };

  const handleEditProfile = () => {
    router.push("/profile/edit-profile");
  };

  // Profile completion calculation
  const completionFields = ["first_name", "last_name", "avatar_url", "phone"];
  const filledFields = profile
    ? completionFields.filter((field) => Boolean((profile as any)[field]))
    : [];
  const profileCompletion = Math.round((filledFields.length / completionFields.length) * 100);

  return (
    <section className="bg-gray-100 flex justify-center items-center">
      <div className="min-h-screen md:w-3/4 w-full bg-gradient-to-br from-slate-50 to-blue-50 py-14 lg:py-24 px-0 sm:px-0 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white rounded-2xl shadow-2xl p-8 mb-8"
        >
          {!loading && profile ? (
            <>
              {/* Avatar and completion */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                <img
                  src={profile.avatar_url || "/default-avatar.jpg"}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full border-8 border-gradient-to-tr from-orange-400 via-orange-500 to-yellow-500 shadow-lg transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-avatar.jpg";
                  }}
                />
                <span className="absolute bottom-2 right-2 w-6 h-6 bg-green-400 border-2 border-white rounded-full animate-pulse shadow-lg"></span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">Profile Completion</span>
                  <span className="text-xs text-gray-500">{profileCompletion}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>

              {/* Name */}
              <h2 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-3 select-none">
                <User size={24} className="text-orange-600" />
                {profile.first_name} {profile.last_name}
              </h2>

              {/* Email */}
              <p className="mt-3 text-center text-gray-700 text-base flex items-center justify-center gap-2 select-text">
                <Mail size={18} className="text-orange-500" />
                {profile.email}
              </p>

              {/* Phone */}
              <p className="mt-2 text-center text-gray-700 text-base flex items-center justify-center gap-2 select-text">
                <Phone size={18} className="text-orange-500" />
                {profile.phone || "Phone number not set"}
              </p>

              {/* Addresses */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-orange-600">
                  <MapPin size={18} /> Addresses
                </h3>
                {addresses.length === 0 ? (
                  <p className="text-gray-500 text-sm">No addresses added.</p>
                ) : (
                  <ul className="space-y-2">
                    {addresses.map((addr) => (
                      <li
                        key={addr.id}
                        className={`p-3 rounded-lg border ${
                          addr.is_default ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <span className="font-medium">
                          {addr.street}, {addr.city}, {addr.country}
                        </span>
                        {addr.is_default && (
                          <span className="ml-2 text-xs text-orange-700 font-semibold">(Default)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Recent Orders */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-orange-600">
                  <ShoppingBag size={18} /> Recent Orders
                </h3>
                {recentOrders.length === 0 ? (
                  <p className="text-gray-500 text-sm">No recent orders.</p>
                ) : (
                  <ul className="space-y-2">
                    {recentOrders.map((order) => (
                      <li
                        key={order.id}
                        className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex justify-between items-center"
                      >
                        <span>
                          <span className="font-medium">Order #{order.id}</span>{" "}
                          <span className="text-xs text-gray-600">({order.status})</span>
                        </span>
                        <span className="font-semibold text-orange-600">${order.total}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Loyalty/Rewards */}
              <div className="mt-6 flex items-center gap-2 justify-center">
                <Gift size={22} className="text-yellow-500" />
                <span className="font-semibold text-yellow-600">Loyalty Points:</span>
                <span className="text-lg font-bold">{profile.loyalty_points ?? 0}</span>
              </div>

              {/* Edit Profile Button */}
              <div className="mt-8 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEditProfile}
                  className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-2xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-400 transition"
                  aria-label="Edit Profile"
                >
                  <Pencil size={20} />
                  Edit Profile
                </motion.button>
              </div>
            </>
          ) : (
            <div className="flex justify-center items-center min-h-[50vh]">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-orange-400 animate-spin blur-sm"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-yellow-500 animate-spin"></div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default Profiles;
