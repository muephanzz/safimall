"use client";
import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Define the type for a product suggestion
interface Suggestion {
  name: string;
  product_id: string | number;
}

export default function SearchBar() {
  const [query, setQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("name, product_id")
        .ilike("name", `%${query}%`)
        .limit(5);

      if (!error && data) setSuggestions(data as Suggestion[]);
    };

    const timeoutId = setTimeout(fetchSuggestions, 300); // debounce
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products/search?query=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (name: string) => {
    router.push(`/products/search?query=${encodeURIComponent(name)}`);
    setQuery("");
    setSuggestions([]);
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative w-full">
        <input
          type="text"
          aria-label="Search products"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-full border border-gray-300 bg-white py-2 pl-12 pr-4 text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-orange-500 focus:ring-2 focus:ring-orange-400 focus:outline-none"
          spellCheck={false}
          autoComplete="off"
        />
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </form>

      {suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg ring-1 ring-black ring-opacity-5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {suggestions.map((item) => (
            <li
              key={item.product_id}
              onClick={() => handleSuggestionClick(item.name)}
              className="cursor-pointer px-5 py-3 text-gray-800 transition hover:bg-blue-50 hover:text-blue-700"
              role="option"
              tabIndex={0}
              onKeyDown={(e: KeyboardEvent<HTMLLIElement>) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSuggestionClick(item.name);
                }
              }}
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
