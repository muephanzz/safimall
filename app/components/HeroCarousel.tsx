
"use client";

import React, { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

type Slide = {
  src: string;
  alt: string;
};

const staticSlides: Slide[] = [
  { src: "/carousel/slide1.jpg", alt: "Modern Living Room" },
  { src: "/carousel/slide2.jpg", alt: "Stylish Kitchen Design" },
  { src: "/carousel/slide3.jpg", alt: "Cozy Bedroom Setup" },
  { src: "/carousel/slide4.jpg", alt: "Outdoor Patio Ideas" },
];

export default function HeroCarousel() {
  const [slides] = useState<Slide[]>(staticSlides);
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const delay = 5000;

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    resetTimeout();
    timeoutRef.current = window.setTimeout(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, delay);

    return resetTimeout;
  }, [current, slides.length]);

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-60 bg-gray-100 rounded-xl animate-pulse" />
    );
  }

  return (
    <div className="relative w-full //max-w-xs //sm:max-w-sm //md:max-w-md //lg:max-w-lg //xl:max-w-xl aspect-[9/5] md:aspect-[9/5] lg:aspect-[10/5] overflow-hidden shadow-2xl border-4 border-white bg-gray-200 mx-auto">
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
    </div>
  );
}

