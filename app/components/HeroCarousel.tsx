"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

type Slide = {
  src: string;
  alt: string;
};

export default function HeroCarousel() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const delay = 5000;

  useEffect(() => {
    async function fetchSlides() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);
      if (!error && data) {
        const fetchedSlides = data
          .map((p) =>
            p.image_urls && p.image_urls.length
              ? { src: p.image_urls[0], alt: p.name }
              : null
          )
          .filter((slide): slide is Slide => !!slide);
        setSlides(fetchedSlides);
      }
    }
    fetchSlides();
  }, []);

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    if (slides.length === 0) return;
    resetTimeout();
    timeoutRef.current = window.setTimeout(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, delay);
    return resetTimeout;
  }, [current, slides]);

  if (!slides.length) {
    return (
      <div className="flex items-center justify-center w-full h-60 bg-gray-100 rounded-xl animate-pulse" />
    );
  }

  return (
    <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl aspect-[4/5] rounded-xl overflow-hidden shadow-2xl border-4 border-white bg-gray-200 mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={slides[current].src}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src={slides[current].src}
            alt={slides[current].alt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 480px"
            priority
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-2">
            <span className="text-white font-semibold text-lg drop-shadow">
              {slides[current].alt}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-3 h-3 rounded-full border-2 border-white transition-all duration-200 ${
              idx === current ? "bg-indigo-500 scale-125" : "bg-white/70"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
