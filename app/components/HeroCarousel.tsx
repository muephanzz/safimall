"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    src: "/carousel1.jpg",
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

  const nextSlide = () => setCurrent((c) => (c + 1) % slides.length);
  const prevSlide = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);

  return (
    <div className="relative w-full flex items-center justify-center">
      {/* Slide */}
      <div
        className="
          relative
          w-[320px] h-[200px]
          sm:w-[480px] sm:h-[300px]
          md:w-[600px] md:h-[320px]
          lg:w-[340px] lg:h-[520px]
          xl:w-[400px] xl:h-[600px]
          2xl:w-[480px] 2xl:h-[700px]
          transition-all duration-500
          rounded-3xl overflow-hidden shadow-2xl border-4 border-white
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
                (min-width: 1280px) 400px,
                (min-width: 1024px) 340px,
                (min-width: 768px) 600px,
                (min-width: 640px) 480px,
                320px
              "
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Controls */}
      <button
        aria-label="Previous slide"
        onClick={prevSlide}
        className="absolute left-2 md:left-0 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition shadow-lg"
      >
        <ChevronLeft className="w-7 h-7 text-indigo-700" />
      </button>
      <button
        aria-label="Next slide"
        onClick={nextSlide}
        className="absolute right-2 md:right-0 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition shadow-lg"
      >
        <ChevronRight className="w-7 h-7 text-indigo-700" />
      </button>
      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${current === idx ? "bg-indigo-600 scale-125" : "bg-white/60"}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
