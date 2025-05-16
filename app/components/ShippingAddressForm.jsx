import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function ShippingAddressForm({ userId, onSaved, onBack }) {
  const [counties, setCounties] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedConstituency, setSelectedConstituency] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [phone, setPhone] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Fetch counties on mount
  useEffect(() => {
    supabase.from("counties").select("*").order("name").then(({ data }) => setCounties(data || []));
  }, []);

  // Fetch constituencies when county changes
  useEffect(() => {
    if (!selectedCounty) {
      setConstituencies([]);
      setSelectedConstituency("");
      return;
    }
    supabase
      .from("constituencies")
      .select("*")
      .eq("county_id", selectedCounty)
      .order("name")
      .then(({ data }) => setConstituencies(data || []));
  }, [selectedCounty]);

  // Fetch locations when constituency changes
  useEffect(() => {
    if (!selectedConstituency) {
      setLocations([]);
      setSelectedLocation("");
      return;
    }
    supabase
      .from("locations")
      .select("*")
      .eq("constituency_id", selectedConstituency)
      .order("name")
      .then(({ data }) => setLocations(data || []));
  }, [selectedConstituency]);

  // Fetch user's existing shipping address
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("shipping_addresses")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        if (data) {
          setEditingId(data.address_id);
          setRecipient(data.recipient_name || "");
          setPhone(data.phone_number || "");
          setAddressLine(data.address_line1 || "");
          setSelectedCounty(data.county_id || "");
          setSelectedConstituency(data.constituency_id || "");
          setSelectedLocation(data.location_id || "");
        }
      });
  }, [userId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!recipient || !phone || !addressLine || !selectedCounty || !selectedConstituency || !selectedLocation) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    const addressData = {
      user_id: userId,
      recipient_name: recipient,
      phone_number: phone,
      address_line1: addressLine,
      county_id: selectedCounty,
      constituency_id: selectedConstituency,
      location_id: selectedLocation,
    };
    let result;
    if (editingId) {
      result = await supabase
        .from("shipping_addresses")
        .update(addressData)
        .eq("address_id", editingId)
        .select()
        .single();
    } else {
      result = await supabase
        .from("shipping_addresses")
        .insert(addressData)
        .select()
        .single();
    }
    setLoading(false);
    if (result.error) {
      toast.error("Failed to save address.");
    } else {
      toast.success("Address saved!");
      setEditingId(result.data.address_id);
      if (onSaved) onSaved(result.data);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-6 min-h-screen flex flex-col">
      {/* Header with Back Icon */}
      <header className="flex items-center mb-6">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-gray-900 ml-4">
          {editingId ? "Edit Shipping Address" : "Add Shipping Address"}
        </h2>
      </header>

      <form onSubmit={handleSave} className="flex flex-col space-y-5 flex-grow">
        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Name
          </label>
          <input
            id="recipient"
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="+254 7XXXXXXXX"
          />
        </div>

        <div>
          <label htmlFor="addressLine" className="block text-sm font-medium text-gray-700 mb-1">
            Address Line
          </label>
          <input
            id="addressLine"
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            required
            placeholder="1234 Main St"
          />
        </div>

        <div>
          <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-1">
            County
          </label>
          <select
            id="county"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
            required
          >
            <option value="">Select County</option>
            {counties.map((c) => (
              <option key={c.county_id} value={c.county_id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="constituency" className="block text-sm font-medium text-gray-700 mb-1">
            Constituency
          </label>
          <select
            id="constituency"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            value={selectedConstituency}
            onChange={(e) => setSelectedConstituency(e.target.value)}
            disabled={!selectedCounty}
            required
          >
            <option value="">Select Constituency</option>
            {constituencies.map((c) => (
              <option key={c.constituency_id} value={c.constituency_id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <select
            id="location"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            disabled={!selectedConstituency}
            required
          >
            <option value="">Select Location</option>
            {locations.map((l) => (
              <option key={l.location_id} value={l.location_id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`mt-auto w-full py-3 rounded-md font-semibold text-white shadow-md transition-colors ${
            loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Saving..." : "Save Address"}
        </button>
      </form>
    </div>
  );
}
