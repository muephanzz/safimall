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

  // New state to toggle edit/display mode
  const [isEditing, setIsEditing] = useState(false);

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
      .select(
        `shipping_addresses.*, 
         counties.name as county_name, 
         constituencies.name as constituency_name, 
         locations.name as location_name`
      )
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
          setCounties((prev) => prev.length ? prev : [{ county_id: data.county_id, name: data.county_name }]);
          setConstituencies((prev) => prev.length ? prev : [{ constituency_id: data.constituency_id, name: data.constituency_name }]);
          setLocations((prev) => prev.length ? prev : [{ location_id: data.location_id, name: data.location_name }]);
          setIsEditing(false); // start in display mode
        } else {
          setIsEditing(true); // no address, start editing
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
      setIsEditing(false);
      if (onSaved) onSaved(result.data);
    }
  };

  if (!userId) {
    return <p className="text-center text-gray-500">Please log in to manage shipping addresses.</p>;
  }

  // Display mode: show address summary + Edit button
  if (!isEditing && editingId) {
    return (
      <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow space-y-4">
        <h3 className="text-xl font-bold">Shipping Address</h3>
        <p><strong>Recipient:</strong> {recipient}</p>
        <p><strong>Phone:</strong> {phone}</p>
        <p>
          <strong>Address:</strong> {addressLine}, {locations.find(l => l.location_id === selectedLocation)?.name || ""}, {constituencies.find(c => c.constituency_id === selectedConstituency)?.name || ""}, {counties.find(c => c.county_id === selectedCounty)?.name || ""}
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Edit
        </button>
      </div>
    );
  }

  // Edit mode: show form
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
