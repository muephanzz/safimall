"use client";

import { useEffect, useState } from "react";
import { Phone, MessageCircle, Mail, ChevronUp, ChevronDown } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const contacts = [
  {
    id: 1,
    name: "WhatsApp",
    icon: <FaWhatsapp className="text-green-500" size={20} />,
    url: "https://wa.me/1234567890",
    description: "Chat with us",
  },
  {
    id: 2,
    name: "Telegram",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="text-blue-400"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M21.53 2.47a1.25 1.25 0 0 0-1.48-.3L2.59 9.89a1.25 1.25 0 0 0-.06 2.28l5.4 2.36 1.97 6.35a.75.75 0 0 0 1.3.3l2.9-3.52 4.7 3.49a1.25 1.25 0 0 0 1.96-1.3L21.53 2.47z" />
      </svg>
    ),
    url: "https://t.me/yourtelegram",
    description: "Message us",
  },
  {
    id: 3,
    name: "Call",
    icon: <Phone className="text-blue-600" size={20} />,
    url: "tel:+1234567890",
    description: "24/7 support",
  },
  {
    id: 4,
    name: "Email",
    icon: <Mail className="text-red-500" size={20} />,
    url: "mailto:support@example.com",
    description: "Quick response",
  },
];

export default function ChatPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  return !isMobile ? (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="relative">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex items-center gap-2">
            <MessageCircle size={24} />
            {isOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="absolute right-0 bottom-full mb-4 w-64 bg-white rounded-xl shadow-2xl overflow-hidden"
            >
              {contacts.map((contact) => (
                <a
                  key={contact.id}
                  href={contact.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  <div className="p-2 rounded-lg bg-gray-100">
                    {contact.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{contact.name}</p>
                    <p className="text-sm text-gray-500">{contact.description}</p>
                  </div>
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    ) : (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-orange-700">Contact Support</h1>
      <ul className="space-y-4">
        {contacts.map(({ id, name, icon, url, description }) => (
          <li key={id}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:shadow-lg hover:border-orange-500 transition"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100">
                {icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
