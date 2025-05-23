"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";
import { FaCcVisa, FaCcMastercard, FaPaypal } from "react-icons/fa";

const Footer: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(
      typeof window !== "undefined" &&
        /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    );
  }, []);

  if (isMobile) return null;

  return (
    <footer className="bg-gradient-to-tr from-purple-900 via-gray-900 to-gray-800 text-gray-200 px-4 py-12 md:px-12 shadow-inner select-none">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        {/* Logo & About */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-blue-400 mt-2">About SmartKenya</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            <span className="font-semibold text-white">SmartKenya</span> is your trusted destination for a clean, seamless, and premium shopping experience. Discover quality products, fast delivery, and genuine service - all in one place.
          </p>
          <p className="mt-2 text-sm text-gray-300">
            Fresh finds. Secure payments. Reliable support. Shop with confidence at SmartKenya.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-xl font-semibold text-blue-400 mb-4">Quick Links</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <Link href="/" className="hover:text-blue-300 transition-colors duration-300">🏠 Home</Link>
            </li>
            <li>
              <Link href="/shop" className="hover:text-blue-300 transition-colors duration-300">🛒 Shop</Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-blue-300 transition-colors duration-300">ℹ️ About Us</Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-blue-300 transition-colors duration-300">✉️ Contact</Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:text-blue-300 transition-colors duration-300">🔒 Privacy Policy</Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-blue-300 transition-colors duration-300">📄 Terms & Conditions</Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-blue-300 transition-colors duration-300">❓ FAQs</Link>
            </li>
          </ul>
        </div>

        {/* Payment Methods */}
        <div>
          <h2 className="text-xl font-semibold text-blue-400 mb-4">Payment Methods</h2>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <FaCcVisa size={32} className="text-blue-500 hover:text-blue-400 transition-colors duration-300" />
            <FaCcMastercard size={32} className="text-red-600 hover:text-red-500 transition-colors duration-300" />
            <FaPaypal size={32} className="text-blue-400 hover:text-blue-300 transition-colors duration-300" />
            {/* M-PESA */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 120 32"
              fill="none"
              className="w-20 h-auto"
              aria-label="M-PESA Payment Method"
              role="img"
            >
              <rect width="120" height="32" rx="8" fill="url(#mpesaGradient)" />
              <g transform="scale(0.6) translate(30, 10)">
                <path d="M50 0h10v22H50z" fill="#43B02A" />
                <circle cx="55" cy="11" r="3.5" fill="white" />
                <path d="M65 3h10v16H65z" fill="#43B02A" />
                <text
                  x="90"
                  y="16"
                  fontSize="20"
                  fontWeight="bold"
                  fill="#43B02A"
                  fontFamily="Arial, sans-serif"
                >
                  M-PESA
                </text>
              </g>
              <defs>
                <linearGradient id="mpesaGradient" x1="0" y1="0" x2="120" y2="0">
                  <stop offset="0%" stopColor="#C5F1B8" />
                  <stop offset="100%" stopColor="#43B02A" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-xs text-gray-400">All payments are 100% secure &amp; encrypted.</span>
        </div>

        {/* Contact & Social */}
        <div>
          <h2 className="text-xl font-semibold text-blue-400 mb-4">Contact & Social</h2>
          <div className="mb-3 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <span role="img" aria-label="email">📧</span>
              <Link href="mailto:support@smartkenya.co.ke" className="hover:text-blue-300 transition-colors duration-300">
                support@smartkenya.co.ke
              </Link>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span role="img" aria-label="phone">📞</span>
              <Link href="tel:+254798229783" className="hover:text-blue-300 transition-colors duration-300">
                +254 798 229 783
              </Link>
            </div>
          </div>
          <div className="flex space-x-4 mt-4">
            <Link
              href="https://facebook.com/smartkenya"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-500 transition-colors duration-300"
              aria-label="Facebook"
            >
              <Facebook size={24} />
            </Link>
            <Link
              href="https://twitter.com/smartkenya"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors duration-300"
              aria-label="Twitter"
            >
              <Twitter size={24} />
            </Link>
            <Link
              href="https://instagram.com/smartkenya"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-500 transition-colors duration-300"
              aria-label="Instagram"
            >
              <Instagram size={24} />
            </Link>
            <Link
              href="https://linkedin.com/company/smartkenya"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-300 transition-colors duration-300"
              aria-label="Linkedin"
            >
              <Linkedin size={24} />
            </Link>
            <Link
              href="https://youtube.com/@smartkenya"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-red-500 transition-colors duration-300"
              aria-label="Youtube"
            >
              <Youtube size={24} />
            </Link>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center mt-10 border-t border-gray-700 pt-5">
        <p className="text-sm text-gray-400 select-text">
          &copy; {new Date().getFullYear()} smartkenya. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
