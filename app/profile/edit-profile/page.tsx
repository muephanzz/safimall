"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { motion } from "framer-motion";
import { FaUserEdit } from "react-icons/fa";
import { MdOutlineCancel } from "react-icons/md";
import { FiCamera } from "react-icons/fi";

const ProfileCompletionBar = ({ percent }: { percent: number }) => (
  <div className="my-4">
    <div className="flex justify-between items-center mb-1">
      <span className="text-xs text-gray-500">Profile Completion</span>
      <span className="text-xs text-gray-500">{percent}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  </div>
);

const phoneNumberPattern = /^\+?[1-9]\d{1,14}$/; // E.164 format basic validation

const EditProfile = () => {
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    avatar_url: "",
    phone: "",
  });
  const [originalProfile, setOriginalProfile] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activity, setActivity] = useState<string[]>([]);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Calculate profile completion based on relevant fields
  const profileCompletion = (() => {
    const fields = ["first_name", "last_name", "avatar_url", "phone"];
    const filled = fields.filter((f) => profile[f as keyof typeof profile]);
    return Math.round((filled.length / fields.length) * 100);
  })();

  const fetchProfile = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error("Failed to load profile");
      setFetching(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, avatar_url, phone")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      toast.error("Error fetching profile");
    } else {
      setProfile({
        first_name: data?.first_name || "",
        last_name: data?.last_name || "",
        avatar_url: data?.avatar_url || "",
        phone: data?.phone || "",
      });
      setOriginalProfile({
        first_name: data?.first_name || "",
        last_name: data?.last_name || "",
        avatar_url: data?.avatar_url || "",
        phone: data?.phone || "",
      });
      // Mock recent activity
      setActivity([
        "Updated profile picture",
        "Changed phone number",
        "Edited last name",
      ]);
    }

    setFetching(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 720,
        useWebWorker: true,
      });
      setAvatarFile(compressedFile);
      const preview = URL.createObjectURL(compressedFile);
      setProfile((prev) => ({ ...prev, avatar_url: preview }));
    } catch {
      toast.error("Failed to compress image");
    }
  };

  const uploadAvatar = async (userId: string) => {
    if (!avatarFile) return profile.avatar_url;
    const fileName = `${userId}/${Date.now()}-${avatarFile.name}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, avatarFile, { cacheControl: "3600", upsert: true });
    if (error) {
      toast.error("Avatar upload failed");
      return profile.avatar_url;
    }
    const { data: { publicUrl } } = supabase
      .storage
      .from("avatars")
      .getPublicUrl(fileName);
    return publicUrl;
  };

  const handleUpdateProfile = async () => {
    if (!profile.first_name.trim() || !profile.last_name.trim()) {
      toast.error("First and last name are required.");
      return;
    }
    if (profile.phone && !phoneNumberPattern.test(profile.phone)) {
      toast.error("Invalid phone number format.");
      return;
    }

    setLoading(true);
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    
    if (!user) {
      toast.error("User not logged in");
      setLoading(false);
      return;
    }
    
    const avatarUrl = await uploadAvatar(user.id);
    
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
        avatar_url: avatarUrl,
        phone: profile.phone.trim(),
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Update failed");
    } else {
      toast.success("Profile updated!");
      router.push("/profile/see-profile");
    }
    setLoading(false);
  };

  const handleReset = () => {
    setProfile(originalProfile);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="mt-28 p-6 max-w-4xl mx-auto bg-gradient-to-br from-white to-slate-100 shadow-2xl rounded-3xl border border-gray-200">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-xl mx-auto"
      >
        <h2 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2">
          <FaUserEdit className="text-orange-500" /> Edit Profile
        </h2>
        <ProfileCompletionBar percent={profileCompletion} />

        {fetching ? (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        ) : (
          <>
            {/* Avatar upload */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                <img
                  src={profile.avatar_url || "/default-avatar.png"}
                  alt="Avatar Preview"
                  className="w-28 h-28 rounded-full object-cover ring-2 ring-orange-400 transition-shadow"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-avatar.png";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-white border border-orange-400 rounded-full p-2 shadow group-hover:scale-110 transition"
                  aria-label="Change avatar"
                >
                  <FiCamera className="text-orange-500" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                />
              </div>
            </div>

            {/* First Name */}
            <label className="block mt-4 text-sm font-semibold">
              First Name <span className="text-red-500">*</span>
              <input
                autoFocus
                type="text"
                value={profile.first_name}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                className="w-full p-3 border border-orange-400 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="John"
              />
            </label>

            {/* Last Name */}
            <label className="block mt-4 text-sm font-semibold">
              Last Name <span className="text-red-500">*</span>
              <input
                type="text"
                value={profile.last_name}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                className="w-full p-3 border border-orange-400 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Doe"
              />
            </label>

            {/* Phone Number */}
            <label className="block mt-4 text-sm font-semibold">
              Phone Number
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full p-3 border border-orange-400 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="+1234567890"
                pattern="^\+?[1-9]\d{1,14}$"
                title="Phone number should be in international format, e.g. +1234567890"
              />
              <small className="text-gray-500">Include country code, e.g. +1</small>
            </label>

            {/* Recent Activity */}
            <div className="mt-6 mb-4">
              <h3 className="text-lg font-semibold mb-2 text-orange-600">Recent Profile Activity</h3>
              {activity.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent activity.</p>
              ) : (
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {activity.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Buttons */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row justify-between">
              <button
                onClick={handleUpdateProfile}
                className="w-full sm:w-auto px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition duration-300"
                disabled={loading}
              >
                {loading ? "Updating..." : "Save Changes"}
              </button>
              <button
                onClick={handleReset}
                className="w-full sm:w-auto px-6 py-2 border border-gray-400 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-1"
              >
                <MdOutlineCancel /> Revert Changes
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default EditProfile;
