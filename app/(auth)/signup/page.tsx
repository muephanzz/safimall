"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface FormState {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

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

export default function SignUpPage() {
  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
          },
        },
      });
      if (error) throw error;
      toast.success("Check your email to confirm your account!");
      router.replace("/signin");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) toast.error(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200">
      <div className="w-full max-w-md bg-white shadow-2xl px-8 py-14 rounded">
        <div className="flex flex-col items-center mb-8">
          <Logo width={160} height={54} />
          <h2 className="mt-4 text-2xl font-bold text-blue-800 tracking-tight">
            Create Account
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Join SafiMall to start shopping
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
              autoComplete="given-name"
              placeholder="John"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-900 transition"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
              autoComplete="family-name"
              placeholder="Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-900 transition"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-900 transition"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              placeholder="Password"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-900 transition"
            />
          </div>
          <Button
            type="submit"
            variant="orange"
            size="default"
            className="w-full flex items-center justify-center gap-2"
            disabled={loading}
            aria-label="Sign Up"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <div className="flex justify-center items-center mt-6 text-sm">
          <span className="text-gray-600">Already have an account?</span>
          <Link href="/signin" className="ml-2 text-blue-700 hover:underline transition">
            Sign in
          </Link>
        </div>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-200" />
          <span className="mx-3 text-gray-400 text-xs">or sign up with google</span>
          <div className="flex-grow border-t border-gray-200" />
        </div>

        <Button
          onClick={handleGoogle}
          disabled={loading}
          variant="outline"
          size="default"
          className="w-full mb-6 flex items-center justify-center gap-2"
          aria-label="Continue with Google"
        >
          <FcGoogle size={22} />
          <span>Continue with Google</span>
        </Button>
      </div>
    </div>
  );
}
