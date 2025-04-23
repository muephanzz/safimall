"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ImageIcon, ArrowLeft, Smile } from "lucide-react";
import moment from "moment";
import { Picker } from "emoji-mart";
import { supabase } from "@/lib/supabaseClient";
import ChatWindow from "./ChatWindow";

const MessageBubble = ({ msg, isUser }) => (
  <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
    <div
      className={`rounded-2xl px-4 py-2 max-w-[75%] shadow-md ${
        isUser
          ? "bg-gradient-to-tr from-indigo-200 to-blue-100 text-gray-900"
          : msg.isBot
          ? "bg-gradient-to-tr from-yellow-100 to-yellow-200 text-yellow-900"
          : "bg-gradient-to-tr from-blue-600 to-indigo-500 text-white"
      }`}
    >
      <p className="break-words whitespace-pre-line">{msg.text || msg.user_message || msg.admin_reply}</p>
      {msg.image_url && (
        <img
          src={msg.image_url}
          alt="media"
          className="mt-2 w-full h-36 object-cover rounded-lg"
        />
      )}
      <div className="text-xs text-gray-400 mt-1 text-right">
        {moment(msg.created_at || Date.now()).format("h:mm A")}
      </div>
    </div>
  </div>
);

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

  // Detect mobile device
  useEffect(() => {
    setIsMobile(
      typeof window !== "undefined" &&
        /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    );
  }, []);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
              if ("Notification" in window && Notification.permission === "granted") {
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

  // Emoji picker handler
  const addEmoji = (emoji) => {
    setMessage((msg) => msg + (emoji.native || emoji.colons));
    setShowEmoji(false);
  };

  // Send message with OpenAI bot integration
  const sendMessage = async () => {
    if (!message.trim() && !image) return;

    // Save user message to Supabase
    if (user) {
      await supabase.from("messages").insert({
        user_id: user.id,
        user_message: message,
        image_url: image || null,
      });
    }

    // Add user message locally
    setMessages((prev) => [
      ...prev,
      { text: message, isUser: true, created_at: new Date().toISOString() },
    ]);
    setMessage("");
    setImage(null);

    // Prepare conversation for AI API
    const conversation = messages
      .filter((m) => m.text || m.user_message)
      .map((m) => ({
        role: m.isUser ? "user" : "assistant",
        content: m.text || m.user_message || "",
      }));

    conversation.push({ role: "user", content: message });

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation }),
      });
      const data = await response.json();

      if (data.text) {
        setMessages((prev) => [
          ...prev,
          { text: data.text, isBot: true, created_at: new Date().toISOString() },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I couldn't reach the AI service. Please try again later.",
          isBot: true,
          created_at: new Date().toISOString(),
        },
      ]);
    }
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

  // Floating chat button for PC
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

  // Floating chat button for mobile
  const MobileChatButton = () => (
    <motion.button
      className="fixed z-50 bottom-7 right-6 bg-gradient-to-r from-blue-600 via-indigo-500 to-teal-400 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-all focus:outline-none"
      onClick={() => setIsOpen(true)}
      aria-label="Open chat"
      style={{ width: 56, height: 56 }}
    >
      <MessageSquare size={26} />
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
                addEmoji={addEmoji}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {isMobile && (
        <>
          {!isOpen && <MobileChatButton />}
          <AnimatePresence>
            {isOpen && (
              <ChatWindow
                isMobile={true}
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
                addEmoji={addEmoji}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
}
