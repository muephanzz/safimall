"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const ResetPassword = () => {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword) {
      setMessage("Please enter a new password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("✅ Password reset successful! Redirecting to login...");
      setTimeout(() => router.push("/signin"), 3000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-3 select-none">
          🔑 Reset Password
        </h2>
        <p className="text-center text-gray-600 text-sm mb-6">
          Enter your new password below.
        </p>

        <label htmlFor="new-password" className="block text-gray-700 font-medium mb-2">
          New Password
        </label>
        <input
          id="new-password"
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          autoComplete="new-password"
          aria-describedby="passwordHelp"
        />

        <button
          onClick={handleResetPassword}
          disabled={loading}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold flex justify-center items-center gap-2 transition"
        >
          {loading && <Loader2 className="animate-spin h-5 w-5" />}
          Reset Password
        </button>

        {message && (
          <p
            className={`mt-5 text-center text-sm ${
              message.includes("✅") ? "text-green-600" : "text-red-600"
            } select-none`}
            role="alert"
          >
            {message}
          </p>
        )}

        <p className="text-center text-sm text-gray-600 mt-8">
          Remembered your password?{" "}
          <Link href="/signin" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import ChatWindow from "./ChatWindow";
import { supabase } from "@/lib/supabaseClient";

export default function UserChat() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState(false);
  const [image, setImage] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // Detect mobile device
  useEffect(() => {
    setIsMobile(
      typeof window !== "undefined" &&
        /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    );
  }, []);

  // Redirect mobile users to /chat page
  useEffect(() => {
    if (isMobile && !isOpen) {
      if (router.pathname !== "/chat") {
        router.push("/chat");
      }
    } else if (!isMobile && router.pathname === "/chat") {
      router.push("/");
    }
  }, [isMobile, isOpen, router]);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUser(user);
    };
    getUser();
  }, []);

  // Load messages & subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    loadMessages();

    const channel = supabase
      .channel("realtime:messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new;
          if (msg.user_id === user.id) {
            setMessages((prev) => [...prev, msg]);
            if (!isOpen && msg.admin_reply) {
              if (
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                new Notification("New reply", {
                  body: msg.admin_reply,
                  icon: "/chat-icon.png",
                });
              }
              setNewMessage(true);
              new Audio("/notification.mp3").play().catch(() => {});
            }
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, isOpen]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Send message
  const sendMessage = async () => {
    if (!message.trim() && !image) return;

    if (user) {
      await supabase.from("messages").insert({
        user_id: user.id,
        user_message: message,
        image_url: image || null,
      });
    }

    setMessages((prev) => [
      ...prev,
      { text: message, isUser: true, created_at: new Date().toISOString() },
    ]);
    setMessage("");
    setImage(null);
  };

  // Image upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Floating chat button for desktop
  const FloatingChatButton = () => (
    <motion.button
      drag
      dragConstraints={{ left: -8, right: 8, top: -8, bottom: 8 }}
      className="fixed z-50 bottom-8 right-8 bg-gradient-to-r from-blue-600 via-indigo-500 to-teal-400 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-all focus:outline-none"
      onClick={() => {
        setIsOpen(true);
        setNewMessage(false);
      }}
      aria-label="Open chat"
      style={{ width: 60, height: 60 }}
    >
      <MessageSquare size={28} />
      {newMessage && (
        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
          !
        </span>
      )}
    </motion.button>
  );

  return (
    <>
      {!isMobile && (
        <>
          {!isOpen && <FloatingChatButton />}
          <AnimatePresence>
            {isOpen && (
              <ChatWindow
                isMobile={false}
                messages={messages}
                messagesEndRef={messagesEndRef}
                message={message}
                setMessage={setMessage}
                sendMessage={sendMessage}
                image={image}
                setImage={setImage}
                handleImageUpload={handleImageUpload}
                setIsOpen={setIsOpen}
                showEmoji={showEmoji}
                setShowEmoji={setShowEmoji}
                handleEmojiClick={handleEmojiClick}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
}

