"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`, // Your password reset page
      });

      if (error) throw error;

      toast.success(
        "If an account with that email exists, a password reset link has been sent."
      );
      setEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex items-center justify-center min-h-screen w-full bg-gray-100">
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full max-w-md bg-white shadow-2xl px-8 py-14 rounded">
          <h2 className="text-3xl font-extrabold text-blue-800 text-center mb-8 select-none">
            Reset Your Password
          </h2>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <Label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              variant="orange"
              size="default"
              className="w-full"
              disabled={loading}
              aria-label="Send password reset email"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Remembered your password?{" "}
            <a href="/signin" className="text-blue-700 hover:underline font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
