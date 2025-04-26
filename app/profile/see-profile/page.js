"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Pencil, Mail, User } from "lucide-react";
import { motion } from "framer-motion";

const Profiles = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error fetching user:", userError);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) console.error("Error fetching profile:", error);
    else setProfile(data || {});

    setLoading(false);
  };

  const handleEditProfile = () => {
    router.push("/profile/edit-profile");
  };

  return (
    <div className="mt-28 p-6 max-w-6xl mx-auto bg-gradient-to-br from-white to-slate-100 shadow-2xl rounded-3xl border border-gray-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative bg-white/70 backdrop-blur-lg shadow-2xl rounded-3xl p-10 max-w-md w-full border border-blue-200"
      >
        {!loading && profile ? (
          <>
            <div className="relative w-32 h-32 mx-auto mb-6">
              <img
                src={profile.avatar_url || "/default-avatar.jpg"}
                alt="Profile"
                className="w-full h-full object-cover rounded-full border-8 border-gradient-to-tr from-blue-400 via-indigo-500 to-purple-600 shadow-lg transition-transform duration-300 hover:scale-105"
              />
              <span className="absolute bottom-2 right-2 w-6 h-6 bg-green-400 border-2 border-white rounded-full animate-pulse shadow-lg"></span>
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-3 select-none">
              <User size={24} className="text-indigo-600" />
              {profile.first_name || "First Name"} {profile.last_name || "Last Name"}
            </h2>

            <p className="mt-3 text-center text-gray-700 text-base flex items-center justify-center gap-2 select-text">
              <Mail size={18} className="text-indigo-500" />
              {profile.email || "Email"}
            </p>

            <div className="mt-8 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEditProfile}
                className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-400 transition"
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
              <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-indigo-400 animate-spin blur-sm"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-blue-600 animate-spin"></div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Profiles;
