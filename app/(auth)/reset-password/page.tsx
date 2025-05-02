"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";

function Logo({ width = 180, height = 60 }: { width?: number; height?: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 360 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="SafiMall Logo"
    >
      <path
        d="M60 90C90 60 120 40 150 60C180 80 180 110 150 110C120 110 90 120 60 90Z"
        fill="#2F855A"
        stroke="#276749"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="190"
        y="80"
        fontFamily="'Poppins', sans-serif"
        fontWeight="700"
        fontSize="56"
        fill="#2C5282"
        letterSpacing="3"
      >
        Safi
        <tspan fill="#38A169">Mall</tspan>
      </text>
      <circle cx="320" cy="30" r="6" fill="#38A169" />
      <path
        d="M320 22L320 38M308 30L332 30"
        stroke="#68D391"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      // Supabase will detect the access_token in the URL and allow password update
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated! You can now sign in.");
      setPassword("");
      setConfirm("");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gray-100 flex justify-center items-center">
      <div className="min-h-screen md:w-3/4 w-full bg-gradient-to-br from-slate-50 to-blue-50 py-14 lg:py-24 px-0 sm:px-0 lg:px-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex flex-col items-center mb-8">
            <Logo width={160} height={54} />
            <h2 className="mt-4 text-2xl font-bold text-blue-800 tracking-tight">
              Set a New Password
            </h2>
            <p className="text-gray-500 mt-1 text-sm text-center">
              Enter your new password below. For your security, it must be at least 8 characters.
            </p>
          </div>
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-900 transition"
                placeholder="Enter new password"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-semibold text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-900 transition"
                placeholder="Confirm new password"
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              variant="orange"
              size="default"
              className="w-full"
              disabled={loading}
              aria-label="Reset Password"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
          <div className="flex justify-center items-center mt-6 text-sm">
            <a href="/signin" className="text-blue-700 hover:underline transition">
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
