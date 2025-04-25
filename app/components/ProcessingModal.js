"use client";
import { useEffect, useState } from "react";
import { Loader2, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient"; 

const PAYBILL_NUMBER = "123456";
const ACCOUNT_NAME = "SafiMall";

export default function ProcessingModal({ checkoutRequestId, onClose }) {
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState(null);
  const [showAlternative, setShowAlternative] = useState(false);
  const [timer, setTimer] = useState(20);
  const [refreshing, setRefreshing] = useState(false); 
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function fetchLatestOrderId() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("orders")
        .select("order_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        setError(error.message);
        setOrderId(null);
      } else {
        setOrderId(data?.id ?? null);
      }
      setLoading(false);
    }

    fetchLatestOrderId();
  }, [userId]);

  if (loading) return <span>Loading...</span>;
  if (error) return <span className="text-red-600">{error}</span>;


  // Poll payment status every 5s, timeout after 20s
  useEffect(() => {
    if (!checkoutRequestId) {
      setError("Invalid payment reference.");
      return;
    }
    let interval, timeout;
    let isMounted = true;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/mpesa/status?checkoutRequestId=${checkoutRequestId}`);
        const data = await res.json();
        if (!isMounted) return;
        setStatus(data.status);
        if (data.status === "paid") {
          clearInterval(interval);
          clearTimeout(timeout);
        } else if (data.status === "failed") {
          clearInterval(interval);
          clearTimeout(timeout);
          setError("Payment failed. Please try an alternative payment method.");
        }
      } catch {
        setError("Failed to check payment status.");
      }
    };

    interval = setInterval(pollStatus, 5000);
    timeout = setTimeout(() => {
      clearInterval(interval);
      setShowAlternative(true);
    }, 20000);

    // Timer countdown
    let countdown = setInterval(() => setTimer((t) => t > 0 ? t - 1 : 0), 1000);

    pollStatus();

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearTimeout(timeout);
      clearInterval(countdown);
    };
  }, [checkoutRequestId]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    setShowAlternative(false);
    setTimer(20);
    // Re-run polling logic
    // (You may want to refactor polling into a function and call it here)
    setRefreshing(false);
  };

  // Generate a unique account number for the product/payment (best practice)
  // For best traceability, use order number, user ID, or product SKU.
  // Example: `${orderId}` or `PROD-${productId}-${userId}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 relative animate-fadeIn">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close"
        >
          <XCircle size={28} />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <svg width="120" height="40" viewBox="0 0 360 120" fill="none" aria-label="SafiMall Logo">
            <path d="M60 90C90 60 120 40 150 60C180 80 180 110 150 110C120 110 90 120 60 90Z" fill="#2F855A" stroke="#276749" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <text x="190" y="80" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="56" fill="#2C5282" letterSpacing="3">Safi<tspan fill="#38A169">Mall</tspan></text>
            <circle cx="320" cy="30" r="6" fill="#38A169" />
            <path d="M320 22L320 38M308 30L332 30" stroke="#68D391" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Payment Status */}
        {!showAlternative && !error && (
          <>
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-lg font-medium text-gray-800 mb-2">Processing your payment...</p>
              <p className="text-gray-500 mb-4">Please complete the payment on your phone.</p>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <span>Waiting for confirmation</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">{timer}s</span>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
            >
              <RefreshCw className={refreshing ? "animate-spin" : ""} size={18} />
              Refresh Status
            </button>
          </>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center">
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-lg text-red-600 mb-2">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
            >
              <RefreshCw size={18} />
              Retry
            </button>
          </div>
        )}

        {/* Alternative Payment Method */}
        {showAlternative && !error && (
          <div className="flex flex-col items-center mt-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Try Manual Payment</h3>
            <p className="text-gray-600 mb-4 text-center">
              If you did not receive the M-Pesa prompt, pay directly using the details below and your order will be verified automatically.
            </p>
            <div className="w-full bg-gray-50 rounded-lg p-4 mb-4 border border-green-200">
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">Paybill Number:</span>
                <span className="font-mono text-green-700 text-lg">{PAYBILL_NUMBER}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">Account Number:</span>
                <span className="font-mono text-blue-700 text-lg">
                  {orderId ? String(orderId).slice(-5) : "ORDER12345"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Account Name:</span>
                <span className="font-mono text-gray-800">{ACCOUNT_NAME}</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm text-center">
              After payment, your order will be confirmed automatically within a few minutes.
            </p>
            <button
              onClick={handleRefresh}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
            >
              <RefreshCw size={18} />
              Check Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
