"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProcessingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutRequestId = searchParams.get("checkoutRequestId");
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!checkoutRequestId) {
      setError("Invalid payment reference.");
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/mpesa/status?checkoutRequestId=${checkoutRequestId}`);
        const data = await res.json();

        if (res.ok) {
          setStatus(data.status);
          if (data.status === "pending") {
            clearInterval(interval);
            router.push("/orders/success");
          } else if (data.status === "failed") {
            clearInterval(interval);
            setError("Payment failed. Please try an alternative payment method.");
          }
        } else {
          setError(data.error || "Failed to get payment status.");
        }
      } catch (err) {
        setError(err.message || "Network error.");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [checkoutRequestId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <button
          onClick={() => router.push("/orders/checkout")}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go Back to Checkout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-6" />
      <p className="text-lg text-gray-700">Processing your payment, please wait...</p>
    </div>
  );
}
