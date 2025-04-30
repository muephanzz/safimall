"use client";

import WhatsApp, { Phone, MessageCircle, Mail } from "lucide-react";

const contacts = [
  {
    id: 1,
    name: "WhatsApp Support",
    icon: <WhatsApp className="text-green-500" size={28} />,
    url: "https://wa.me/1234567890",
    description: "Chat with us on WhatsApp",
  },
  {
    id: 2,
    name: "Telegram Support",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="text-blue-400"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M21.53 2.47a1.25 1.25 0 0 0-1.48-.3L2.59 9.89a1.25 1.25 0 0 0-.06 2.28l5.4 2.36 1.97 6.35a.75.75 0 0 0 1.3.3l2.9-3.52 4.7 3.49a1.25 1.25 0 0 0 1.96-1.3L21.53 2.47z" />
      </svg>
    ),
    url: "https://t.me/yourtelegram",
    description: "Chat with us on Telegram",
  },
  {
    id: 3,
    name: "Phone Support",
    icon: <Phone className="text-blue-600" size={28} />,
    url: "tel:+1234567890",
    description: "Call us for support",
  },
  {
    id: 4,
    name: "Email Support",
    icon: <Mail className="text-red-500" size={28} />,
    url: "mailto:support@example.com",
    description: "Send us an email",
  },
];

export default function ChatPage() {
  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-700">Contact Support</h1>
      <ul className="space-y-4">
        {contacts.map(({ id, name, icon, url, description }) => (
          <li key={id}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:shadow-lg hover:border-indigo-500 transition"
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
