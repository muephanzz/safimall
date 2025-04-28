"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const ResetPassword = () => {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword) {
      setMessage("Please enter a new password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("✅ Password reset successful! Redirecting to login...");
      setTimeout(() => router.push("/signin"), 3000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-3 select-none">
          🔑 Reset Password
        </h2>
        <p className="text-center text-gray-600 text-sm mb-6">
          Enter your new password below.
        </p>

        <label htmlFor="new-password" className="block text-gray-700 font-medium mb-2">
          New Password
        </label>
        <input
          id="new-password"
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          autoComplete="new-password"
          aria-describedby="passwordHelp"
        />

        <button
          onClick={handleResetPassword}
          disabled={loading}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold flex justify-center items-center gap-2 transition"
        >
          {loading && <Loader2 className="animate-spin h-5 w-5" />}
          Reset Password
        </button>

        {message && (
          <p
            className={`mt-5 text-center text-sm ${
              message.includes("✅") ? "text-green-600" : "text-red-600"
            } select-none`}
            role="alert"
          >
            {message}
          </p>
        )}

        <p className="text-center text-sm text-gray-600 mt-8">
          Remembered your password?{" "}
          <Link href="/signin" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;


//git config --global http.proxy http://192.168.99.133:7071
//git config --global https.proxy https://192.11.99.133:7071
