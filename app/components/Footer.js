"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";
import { FaCcVisa, FaCcMastercard, FaPaypal } from "react-icons/fa";

export default function Footer() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  if (isMobile) return null;

  return (
    <footer className="bg-gradient-to-tr from-indigo-900 via-blue-900 to-indigo-800 text-gray-200 p-12 shadow-inner select-none">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-12">
        {/* About Section */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-extrabold text-blue-400 mb-5 tracking-wide">
            About Ephantronics
          </h2>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            <span className="font-semibold text-white">Ephantronics</span> is your ultimate hub for premium electronics — from smartphones to laptops and audio gear. We deliver top-notch tech with unbeatable prices.
          </p>
          <p className="mt-4 text-gray-300 text-sm md:text-base">
            Fast delivery. Secure payments. Dedicated support. Upgrade your digital lifestyle today! ⚡🛒
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-xl font-semibold text-blue-400 mb-5 tracking-wide">
            Quick Links
          </h2>
          <ul className="space-y-3 text-gray-300 text-sm">
            {[
              { href: "/", label: "🏠 Home" },
              { href: "/coming-soon", label: "🔒 Privacy Policy" },
              { href: "/coming-soon", label: "📄 Terms & Conditions" },
              { href: "/coming-soon", label: "❓ FAQs" },
            ].map(({ href, label }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="hover:text-blue-300 transition-colors duration-300"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Section */}
        <div>
          <h2 className="text-xl font-semibold text-blue-400 mb-5 tracking-wide">
            Contact Us
          </h2>
          <p className="text-gray-300 text-sm mb-3 flex items-center gap-2">
            <span role="img" aria-label="email">📧</span>
            <Link
              href="mailto:muephanzz@gmail.com"
              className="hover:text-blue-300 transition-colors duration-300"
            >
              muephanzz@gmail.com
            </Link>
          </p>
          <p className="text-gray-300 text-sm flex items-center gap-2">
            <span role="img" aria-label="phone">📞</span>
            <Link
              href="tel:0798229783"
              className="hover:text-blue-300 transition-colors duration-300"
            >
              0798 229 783
            </Link>
          </p>
        </div>

        {/* Payment Methods */}
        <div>
          <h2 className="text-xl font-semibold text-blue-400 mb-5 tracking-wide">
            Payment Methods
          </h2>
          <div className="flex items-center space-x-6">
            <FaCcVisa size={36} className="text-blue-500 hover:text-blue-400 transition-colors duration-300" />
            <FaCcMastercard size={36} className="text-red-600 hover:text-red-500 transition-colors duration-300" />
            <FaPaypal size={36} className="text-blue-400 hover:text-blue-300 transition-colors duration-300" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 400 80"
              fill="none"
              className="w-24 h-auto"
              aria-label="M-PESA Payment Method"
              role="img"
            >
              <rect width="400" height="80" rx="12" fill="url(#mpesaGradient)" />
              <g transform="scale(1.1) translate(30, 20)">
                <path d="M50 0h10v40H50z" fill="#43B02A" />
                <circle cx="55" cy="20" r="5" fill="white" />
                <path d="M65 5h10v30H65z" fill="#43B02A" />
                <text
                  x="90"
                  y="28"
                  fontSize="44"
                  fontWeight="bold"
                  fill="#43B02A"
                  fontFamily="Arial, sans-serif"
                >
                  M-PESA
                </text>
              </g>
              <defs>
                <linearGradient id="mpesaGradient" x1="0" y1="0" x2="400" y2="0">
                  <stop offset="0%" stopColor="#C5F1B8" />
                  <stop offset="100%" stopColor="#43B02A" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Follow Us */}
        <div>
          <h2 className="text-xl font-semibold text-blue-400 mb-5 tracking-wide">
            Follow Us
          </h2>
          <div className="flex space-x-5 text-gray-300">
            <Link
              href="/coming-soon"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-500 transition-colors duration-300"
              aria-label="Facebook"
            >
              <Facebook size={28} />
            </Link>
            <Link
              href="/coming-soon"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors duration-300"
              aria-label="Twitter"
            >
              <Twitter size={28} />
            </Link>
            <Link
              href="/coming-soon"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-500 transition-colors duration-300"
              aria-label="Instagram"
            >
              <Instagram size={28} />
            </Link>
            <Link
              href="/coming-soon"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-300 transition-colors duration-300"
              aria-label="Linkedin"
            >
              <Linkedin size={28} />
            </Link>
            <Link
              href="/coming-soon"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-red-500 transition-colors duration-300"
              aria-label="Youtube"
            >
              <Youtube size={28} />
            </Link>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center mt-12 border-t border-gray-700 pt-6">
        <p className="text-sm text-gray-400 select-text">
          &copy; {new Date().getFullYear()} Ephantronics. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
