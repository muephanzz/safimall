import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function ShippingAddressForm({ userId, onSaved }) {
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
    <form onSubmit={handleSave} className="space-y-4 max-w-lg mx-auto bg-white p-6 rounded-xl shadow">
      <h3 className="text-xl font-bold mb-2">{editingId ? "Edit" : "Add"} Shipping Address</h3>
      <div>
        <label className="block text-sm font-semibold mb-1">Recipient Name</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Phone Number</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Address Line</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={addressLine}
          onChange={e => setAddressLine(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">County</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={selectedCounty}
          onChange={e => setSelectedCounty(e.target.value)}
          required
        >
          <option value="">Select County</option>
          {counties.map(c => (
            <option key={c.county_id} value={c.county_id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Constituency</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={selectedConstituency}
          onChange={e => setSelectedConstituency(e.target.value)}
          disabled={!selectedCounty}
          required
        >
          <option value="">Select Constituency</option>
          {constituencies.map(c => (
            <option key={c.constituency_id} value={c.constituency_id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Location</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={selectedLocation}
          onChange={e => setSelectedLocation(e.target.value)}
          disabled={!selectedConstituency}
          required
        >
          <option value="">Select Location</option>
          {locations.map(l => (
            <option key={l.location_id} value={l.location_id}>{l.name}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Address"}
      </button>
    </form>
  );
}
