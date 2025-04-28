"use client";
import React, { useState } from "react";
import { sendStkPush } from "@/actions/stkPush";
import { stkPushQuery } from "@/actions/stkPushQuery";
import PaymentSuccess from "./Sucess";
import STKPushQueryLoading from "./StkQueryLoading";

function PaymentForm() {
  // Declare all states inside the component
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stkQueryLoading, setStkQueryLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [dataFromForm, setDataFromForm] = useState({
    mpesa_phone: "",
    name: "",
    amount: 0,
  });

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

  // Submit handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => { 
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    if (!kenyanPhoneNumberRegex.test(dataFromForm.mpesa_phone)) {
      setLoading(false);
      alert("Invalid mpesa number");
      return;
    }

    try {
      const { data: stkData, error: stkError } = await sendStkPush({
        mpesa_number: dataFromForm.mpesa_phone.trim(),
        name: dataFromForm.name.trim(),
        amount: dataFromForm.amount,
      });

      if (stkError) {
        setLoading(false);
        alert(stkError);
        return;
      }

      alert("STK push sent successfully");
      const checkoutRequestId = stkData.CheckoutRequestID;
      console.log("CheckoutRequestID:", checkoutRequestId);

      setStkQueryLoading(true);
      stkPushQueryWithIntervals(checkoutRequestId);
    } catch (err) {
      setLoading(false);
      alert("Error sending STK push");
      console.error(err);
    }
  };

  return (
    <>
      {stkQueryLoading ? (
        <STKPushQueryLoading number={dataFromForm.mpesa_phone} />
      ) : success ? (
        <PaymentSuccess />
      ) : (
        <div className="lg:pl-12">
          <div className="overflow-hidden rounded-md bg-white">
            <div className="p-6 sm:p-10">
              <p className="mt-4 text-base text-gray-600">
                Provide your name, mpesa number and amount to process donation.
              </p>
              <form onSubmit={handleSubmit} className="mt-4">
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="text-base font-medium text-gray-900">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      name="name"
                      value={dataFromForm.name}
                      onChange={(e) =>
                        setDataFromForm({
                          ...dataFromForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="John Doe"
                      className="block w-full rounded-md border border-gray-200 bg-white px-4 py-4 text-black placeholder-gray-500 caret-orange-500 transition-all duration-200 focus:border-orange-500 focus:outline-none focus:ring-orange-500"
                    />
                  </div>

                  {/* Mpesa Number */}
                  <div>
                    <label className="text-base font-medium text-gray-900">
                      Mpesa Number
                    </label>
                    <input
                      type="text"
                      name="mpesa_number"
                      value={dataFromForm.mpesa_phone}
                      onChange={(e) =>
                        setDataFromForm({
                          ...dataFromForm,
                          mpesa_phone: e.target.value,
                        })
                      }
                      placeholder="Enter mpesa phone number"
                      className="block w-full rounded-md border border-gray-200 bg-white px-4 py-4 text-black placeholder-gray-500 caret-orange-500 transition-all duration-200 focus:border-orange-500 focus:outline-none focus:ring-orange-500"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-base font-medium text-gray-900">
                      Amount
                    </label>
                    <input
                      type="number"
                      required
                      name="amount"
                      value={dataFromForm.amount}
                      onChange={(e) =>
                        setDataFromForm({
                          ...dataFromForm,
                          amount: Number(e.target.value),
                        })
                      }
                      placeholder="Enter amount"
                      className="block w-full rounded-md border border-gray-200 bg-white px-4 py-4 text-black placeholder-gray-500 caret-orange-500 transition-all duration-200 focus:border-orange-500 focus:outline-none focus:ring-orange-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-orange-500 px-4 py-4 text-base font-semibold text-white transition-all duration-200 hover:bg-orange-600 focus:bg-orange-600 focus:outline-none"
                    >
                      {loading ? "Processing.." : "Proceed With Payment"}
                    </button>
                  </div>
                </div>
              </form>
              {errorMessage && (
                <p className="mt-4 text-red-600 font-semibold">{errorMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PaymentForm;
