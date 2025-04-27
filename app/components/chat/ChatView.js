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

  const handleEmojiClick = (emojiObject) => {
    setMessage((prevMessage) => prevMessage + emojiObject.native);
    setShowEmoji(false);
  };

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
