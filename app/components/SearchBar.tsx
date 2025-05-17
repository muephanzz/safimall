"use client";

import {
  useState,
  useEffect,
  useRef,
  FormEvent,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Suggestion {
  name: string;
  product_id: string | number;
}

interface SearchBarProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search products...",
}: SearchBarProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device based on user agent
    const checkMobile = () => {
      setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value.trim()) {
        setSuggestions([]);
        return;
      }
      const { data, error } = await supabase
        .from("products")
        .select("name, product_id")
        .ilike("name", `%${value}%`)
        .limit(5);

      if (!error && data) setSuggestions(data as Suggestion[]);
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (value.trim()) {
      router.push(`/products/search?query=${encodeURIComponent(value.trim())}`);
      onChange({ target: { value: "" } } as ChangeEvent<HTMLInputElement>);
      setSuggestions([]);
      setShowMobileOverlay(false); // Close overlay on submit
    }
  };

  const handleSuggestionClick = (name: string) => {
    router.push(`/products/search?query=${encodeURIComponent(name)}`);
    onChange({ target: { value: "" } } as ChangeEvent<HTMLInputElement>);
    setSuggestions([]);
    setShowMobileOverlay(false); // Close overlay on click
  };

  // Close suggestions on click outside (desktop only)
  useEffect(() => {
    if (showMobileOverlay) return;
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
  }, [showMobileOverlay]);

  // Main search bar (desktop)
  const searchInput = (
    <form onSubmit={handleSubmit} className="relative w-full">
      <input
        type="text"
        aria-label="Search products"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-full border border-gray-300 bg-white py-2 pl-12 pr-4 text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-orange-500 focus:ring-2 focus:ring-orange-400 focus:outline-none"
        spellCheck={false}
        autoComplete="off"
        onFocus={isMobile ? () => setShowMobileOverlay(true) : undefined}
        readOnly={isMobile} // Prevent typing in the desktop bar on mobile
      />
      <Search
        size={20}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </form>
  );

  // Overlay search bar (mobile)
  const mobileOverlay = (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center p-3 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setShowMobileOverlay(false)}
          className="mr-2"
          aria-label="Back"
        >
          <ArrowLeft size={24} />
        </button>
        <form onSubmit={handleSubmit} className="flex-1">
          <input
            autoFocus
            type="text"
            aria-label="Search products"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="w-full rounded-full border border-gray-300 bg-white py-2 pl-4 pr-10 text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-orange-500 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            spellCheck={false}
            autoComplete="off"
          />
        </form>
        {value && (
          <button
            type="button"
            onClick={() => onChange({ target: { value: "" } } as ChangeEvent<HTMLInputElement>)}
            className="ml-2"
            aria-label="Clear"
          >
            <X size={24} />
          </button>
        )}
      </div>
      {suggestions.length > 0 && (
        <ul className="flex-1 overflow-y-auto">
          {suggestions.map((item) => (
            <li
              key={item.product_id}
              onClick={() => handleSuggestionClick(item.name)}
              className="cursor-pointer px-5 py-4 text-gray-800 border-b border-gray-100 transition hover:bg-blue-50 hover:text-blue-700"
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

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Show overlay on mobile, otherwise show normal search bar */}
      {showMobileOverlay ? mobileOverlay : searchInput}

      {/* Desktop suggestions dropdown */}
      {!showMobileOverlay && suggestions.length > 0 && (
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
