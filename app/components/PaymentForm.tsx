"use client";

import "react-toastify/dist/ReactToastify.css";
import React, { useState, useEffect } from "react";
import { sendStkPush } from "@/actions/stkPush";
import { stkPushQuery } from "@/actions/stkPushQuery";
import PaymentSuccess from "./Sucess";
import STKPushQueryLoading from "./StkQueryLoading";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, User } from "lucide-react";
import toast from "react-hot-toast";

interface Item {
  price: number;
  quantity: number;
  image_url: string;
  name: string;
}

interface Params {
  mpesa_number: string;
  name: string;
  amount: number;
  user_id: string;
  checkoutItems: Item[];
  shipping_address: string;
  email: string;
}

export default function PaymentForm() {
  const [checkoutItems, setCheckoutItems] = useState<Item[]>([]);
  const [amount, setAmount] = useState(0);
  const [shippingAddress, setShippingAddress] = useState("");
  const [email, setEmail] = useState("");
  const [dataFromForm, setDataFromForm] = useState({
    mpesa_phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [stkQueryLoading, setStkQueryLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();

  // Load cart items and total amount from localStorage
  useEffect(() => {
    const items: Item[] = JSON.parse(localStorage.getItem("checkoutItems") || "[]");
    setCheckoutItems(items);
    const total = items.reduce(
      (sum: number, item: Item) => sum + item.price * item.quantity,
      0
    );
    setAmount(total);
    setDataFromForm((prev) => ({ ...prev, amount: total }));
  }, []);

  // Fetch logged-in user email from Supabase profile
  useEffect(() => {
    const fetchEmail = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", userData.user.id)
        .single();

      if (profile?.email) setEmail(profile.email);
    };
    fetchEmail();
  }, []);

  const kenyanPhoneNumberRegex =
    /^(07\d{8}|01\d{8}|2547\d{8}|2541\d{8}|\+2547\d{8}|\+2541\d{8})$/;

  // Polling function to query payment status
  const stkPushQueryWithIntervals = (CheckoutRequestID: string) => {
    let reqcount = 0;
    const timer = setInterval(async () => {
      reqcount += 1;

      if (reqcount === 15) {
        clearInterval(timer);
        setStkQueryLoading(false);
        setLoading(false);
        setErrorMessage("You took too long to pay");
        return;
      }

      const { data, error } = await stkPushQuery(CheckoutRequestID);

      if (error) {
        if (error.response?.data?.errorCode !== "500.001.1001") {
          clearInterval(timer);
          setStkQueryLoading(false);
          setLoading(false);
          setErrorMessage(error.response.data.errorMessage);
        }
      }

      if (data) {
        if (data.ResultCode === "0") {
          clearInterval(timer);
          setStkQueryLoading(false);
          setLoading(false);
          setSuccess(true);
        } else {
          clearInterval(timer);
          setStkQueryLoading(false);
          setLoading(false);
          setErrorMessage(data.ResultDesc);
        }
      }
    }, 2000);
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    if (!kenyanPhoneNumberRegex.test(dataFromForm.mpesa_phone)) {
      setLoading(false);
      //alert("Invalid M-Pesa number");
      toast.error("Invalid mpesa number");
      return;
    }

    if (!shippingAddress) {
      setLoading(false);
      (toast as any).info("Please select a shipping address");
      return;
    }

    if (checkoutItems.length === 0) {
      setLoading(false);
      //alert("No items found for checkout");
      toast.error("No items found for checkout");
      return;
    }

    try {
      // Get logged-in user ID from Supabase
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setLoading(false);
        //alert("Please log in to purchase this item!");
        toast.error("Please log in to purchase items");
        return;
      }

      // Send STK Push request with all necessary info
      const { data: stkData, error: stkError } = await sendStkPush({
        mpesa_number: dataFromForm.mpesa_phone.trim(),
        amount,
        user_id: userData.user.id,
        checkoutItems,
        shipping_address: shippingAddress,
        email,
      } as Params);

      if (stkError) {
        setLoading(false);
        //alert(stkError);
        toast.error("Unknown error occured!");
        return;
      }

      //alert("STK push sent successfully");
      const checkoutRequestId = stkData.CheckoutRequestID;
      //console.log("CheckoutRequestID:", checkoutRequestId);

      setStkQueryLoading(true);
      stkPushQueryWithIntervals(checkoutRequestId);
    } catch (err) {
      setLoading(false);
      toast.error("Something went wrong!");
      //alert("Error sending STK push");
      //console.error(err);
    }
  };

  return (
    <>
      {stkQueryLoading ? (
        <STKPushQueryLoading number={dataFromForm.mpesa_phone} />
      ) : success ? (
        <PaymentSuccess />
      ) : (
        <div className="mt-28 p-6 max-w-6xl mx-auto bg-gradient-to-br from-white to-slate-100 shadow-2xl rounded-3xl border border-gray-200">
          <div className="bg-white shadow-2xl rounded-3xl p-6 sm:p-10 max-w-lg mx-auto border border-blue-100 transition-all duration-500">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-blue-800 mb-8 tracking-tight">
              Secure Checkout
            </h2>

            {email && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">
                  Logged in as <strong>{email}</strong>
                </span>
              </div>
            )}

            <div className="space-y-6 mb-6">
              {checkoutItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 border-b pb-4 last:border-b-0 hover:bg-blue-50 rounded-xl transition"
                >
                  <Image
                    src={item.image_url}
                    width={72}
                    height={72}
                    className="rounded-xl object-cover border border-gray-100 shadow-sm"
                    alt={item.name}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    <p className="text-base font-bold text-blue-700">
                      Ksh {item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 my-8 space-y-2">
              <p className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>Ksh {amount.toFixed(2)}</span>
              </p>
              <p className="flex justify-between text-sm">
                <span>Shipping</span>
                <span className="text-green-600 font-semibold">FREE</span>
              </p>
              <hr className="my-2" />
              <p className="flex justify-between font-bold text-lg text-gray-900">
                <span>Total</span>
                <span>Ksh {amount.toFixed(2)}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="shippingAddress"
                  className="text-sm font-medium mb-1 block"
                >
                  Shipping Address
                </label>
                <select
                  id="shippingAddress"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                  required
                >
                  <option value="">Select your campus</option>
                  <option value="Murang'a University">Murang'a University</option>
                  <option value="Karatina University">Karatina University</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="mpesa_phone"
                  className="text-sm font-medium mb-1 block"
                >
                  M-Pesa Number
                </label>
                <input
                  id="mpesa_phone"
                  type="text"
                  required
                  value={dataFromForm.mpesa_phone}
                  onChange={(e) =>
                    setDataFromForm({ ...dataFromForm, mpesa_phone: e.target.value })
                  }
                  placeholder="Enter M-Pesa phone number"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>

              {errorMessage && (
                <p className="text-red-600 font-semibold">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold text-white shadow-lg transition-colors duration-200 ${
                  loading
                    ? "bg-orange-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Proceed With Payment"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
