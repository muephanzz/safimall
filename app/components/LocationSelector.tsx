import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface County {
  county_id: number;
  name: string;
}

interface Constituency {
  constituency_id: number;
  county_id: number;
  name: string;
}

interface Location {
  location_id: number;
  constituency_id: number;
  name: string;
}

export default function LocationSelector() {
  const [counties, setCounties] = useState<County[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [selectedCounty, setSelectedCounty] = useState<number | null>(null);
  const [selectedConstituency, setSelectedConstituency] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

  // Fetch counties on mount
  useEffect(() => {
    const fetchCounties = async () => {
      const { data, error } = await supabase.from("counties").select("*").order("name");
      if (error) {
        console.error("Failed to fetch counties:", error);
      } else {
        setCounties(data || []);
      }
    };
    fetchCounties();
  }, []);

  // Fetch constituencies when county changes
  useEffect(() => {
    if (!selectedCounty) {
      setConstituencies([]);
      setSelectedConstituency(null);
      return;
    }
    const fetchConstituencies = async () => {
      const { data, error } = await supabase
        .from("constituencies")
        .select("*")
        .eq("county_id", selectedCounty)
        .order("name");
      if (error) {
        console.error("Failed to fetch constituencies:", error);
      } else {
        setConstituencies(data || []);
      }
      setSelectedConstituency(null);
      setLocations([]);
      setSelectedLocation(null);
    };
    fetchConstituencies();
  }, [selectedCounty]);

  // Fetch locations when constituency changes
  useEffect(() => {
    if (!selectedConstituency) {
      setLocations([]);
      setSelectedLocation(null);
      return;
    }
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("constituency_id", selectedConstituency)
        .order("name");
      if (error) {
        console.error("Failed to fetch locations:", error);
      } else {
        setLocations(data || []);
      }
      setSelectedLocation(null);
    };
    fetchLocations();
  }, [selectedConstituency]);

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* County Select */}
      <div>
        <label htmlFor="county" className="block mb-1 font-semibold text-gray-700">
          Select County
        </label>
        <select
          id="county"
          value={selectedCounty ?? ""}
          onChange={(e) => setSelectedCounty(Number(e.target.value) || null)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select County --</option>
          {counties.map((county) => (
            <option key={county.county_id} value={county.county_id}>
              {county.name}
            </option>
          ))}
        </select>
      </div>

      {/* Constituency Select */}
      <div>
        <label htmlFor="constituency" className="block mb-1 font-semibold text-gray-700">
          Select Constituency
        </label>
        <select
          id="constituency"
          value={selectedConstituency ?? ""}
          onChange={(e) => setSelectedConstituency(Number(e.target.value) || null)}
          disabled={!selectedCounty}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">-- Select Constituency --</option>
          {constituencies.map((constituency) => (
            <option key={constituency.constituency_id} value={constituency.constituency_id}>
              {constituency.name}
            </option>
          ))}
        </select>
      </div>

      {/* Location Select */}
      <div>
        <label htmlFor="location" className="block mb-1 font-semibold text-gray-700">
          Select Location
        </label>
        <select
          id="location"
          value={selectedLocation ?? ""}
          onChange={(e) => setSelectedLocation(Number(e.target.value) || null)}
          disabled={!selectedConstituency}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">-- Select Location --</option>
          {locations.map((location) => (
            <option key={location.location_id} value={location.location_id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
