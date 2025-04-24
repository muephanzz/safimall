"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccessDenied() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 4000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center">
      <h1 className="text-5xl font-extrabold text-red-600 mb-6 animate-pulse select-none">
        Access Denied
      </h1>
      <p className="text-lg text-gray-700 max-w-md mb-8">
        You do not have permission to view this page. You will be redirected to the homepage shortly.
      </p>
      <button
        onClick={() => router.push("/")}
        className="px-6 py-3 bg-red-600 text-white rounded-full font-semibold shadow-lg hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        Go to Homepage Now
      </button>
    </div>
  );
}
