"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

const slides = [
  {
    src: "/carousel3.jpg",
    alt: "Modern living room",
  },
  {
    src: "/carousel2.jpg",
    alt: "Premium kitchen appliances",
  },
  {
    src: "/carousel3.jpg",
    alt: "Contemporary bedroom",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const delay = 5000; // 5 seconds

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    resetTimeout();
    timeoutRef.current = setTimeout(() => {
      setCurrent((prevIndex) => (prevIndex + 1) % slides.length);
    }, delay);

    return () => {
      resetTimeout();
    };
  }, [current]);

  return (
    <div className="relative mt-5 w-full flex items-center justify-center select-none">
      {/* Slide container with responsive width, height, and padding */}
      <div
        className="
          relative
          w-full h-16 p-0
          sm:h-20 sm:p-1
          md:w-full md:h-40 md:p-2
          lg:w-[340px] lg:h-3/4 lg:p-4
          xl:w-[400px] xl:h-[600px] xl:p-6
          2xl:w-[480px] 2xl:h-[700px] 2xl:p-8
          transition-all duration-500
          rounded-md overflow-hidden shadow-2xl border-4 border-white
          bg-gray-200
        "
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[current].src}
            className="absolute inset-0"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.5 }}
          >
            <Image
              src={slides[current].src}
              alt={slides[current].alt}
              fill
              className="object-cover"
              sizes="
                (min-width: 1536px) 480px,
                (min-width: 1280px) 400px,
                (min-width: 1024px) 340px,
                (min-width: 768px) 600px,
                (min-width: 640px) 480px,
                100vw
              "
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
