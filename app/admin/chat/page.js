"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import debounce from "lodash.debounce";

export default function AdminChat() {
  const [chats, setChats] = useState([]);
  const containerRef = useRef(null);

  // Fetch all messages on mount and subscribe to realtime changes
  useEffect(() => {
    let isMounted = true;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error && isMounted) setChats(data || []);
    };

    fetchMessages();

    // Subscribe to realtime inserts and updates
    const channel = supabase
      .channel("realtime:messages-admin")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new;
          setChats((prev) => {
            const exists = prev.find((m) => m.id === msg.id);
            if (exists) {
              // Update existing message
              return prev.map((m) => (m.id === msg.id ? msg : m));
            } else {
              // Add new message
              return [...prev, msg];
            }
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Debounced update to avoid too many DB writes on typing
  const debouncedUpdateReply = useRef(
    debounce(async (id, reply) => {
      try {
        await supabase.from("messages").update({ admin_reply: reply }).eq("id", id);
      } catch (error) {
        console.error("Failed to update reply:", error);
      }
    }, 800)
  ).current;

  const handleReplyChange = (id, value) => {
    setChats((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, admin_reply: value } : msg))
    );
    debouncedUpdateReply(id, value);
  };

  return (
    <div
      ref={containerRef}
      className="max-w-7xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-gray-200 h-[80vh] overflow-y-auto"
      aria-label="Admin chat messages"
    >
      {chats.length === 0 && (
        <p className="text-center text-gray-500 mt-20">No messages yet.</p>
      )}

      <div className="space-y-6">
        {chats.map((msg) => (
          <div
            key={msg.id}
            className="border border-gray-300 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
              <p className="text-sm text-gray-600 font-semibold">
                User ID: <span className="text-indigo-600">{msg.user_id}</span>
              </p>
              <time
                className="text-xs text-gray-400"
                dateTime={msg.created_at}
                title={new Date(msg.created_at).toLocaleString()}
              >
                {new Date(msg.created_at).toLocaleString()}
              </time>
            </div>

            <p className="text-gray-800 whitespace-pre-wrap mb-4">{msg.user_message}</p>

            {msg.image_url && (
              <img
                src={msg.image_url}
                alt="User uploaded"
                className="w-40 h-40 object-cover rounded-lg mb-4 shadow-md"
                loading="lazy"
              />
            )}

            <label htmlFor={`reply-${msg.id}`} className="block font-semibold mb-1 text-indigo-700">
              Admin Reply
            </label>
            <textarea
              id={`reply-${msg.id}`}
              placeholder="Type your reply here..."
              value={msg.admin_reply || ""}
              onChange={(e) => handleReplyChange(msg.id, e.target.value)}
              className="w-full min-h-[80px] p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y transition"
              aria-multiline="true"
              spellCheck="true"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
