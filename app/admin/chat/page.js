"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import debounce from "lodash.debounce";
import { Smile, Send, ImageIcon } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";

const customEmojis = [
  { unified: "1F60A", emoji: "😊", names: ["smile"] },
  { unified: "1F44D", emoji: "👍", names: ["thumbs_up"] },
  { unified: "1F62E", emoji: "😮", names: ["astonished"] },
  { unified: "1F622", emoji: "😢", names: ["cry"] },
  { unified: "1F389", emoji: "🎉", names: ["tada"] },
  { unified: "1F525", emoji: "🔥", names: ["fire"] },
];

export default function AdminChat() {
  const [chats, setChats] = useState([]);
  const [replyInputs, setReplyInputs] = useState({});
  const [uploadingImages, setUploadingImages] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});
  const fileInputRefs = useRef({});
  const containerRef = useRef(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(null);

  // Fetch messages on mount
  useEffect(() => {
    let isMounted = true;
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error && isMounted) {
        setChats(data || []);
        const initialReplies = {};
        (data || []).forEach((msg) => {
          initialReplies[msg.id] = msg.admin_reply || "";
        });
        setReplyInputs(initialReplies);
        const initialPreviews = {};
        (data || []).forEach((msg) => {
          initialPreviews[msg.id] = msg.image_url || null;
        });
        setImagePreviews(initialPreviews);
      }
    };
    fetchMessages();
    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced update
  const debouncedUpdateReply = useCallback(
    debounce(async (id, reply) => {
      try {
        await supabase.from("messages").update({ admin_reply: reply }).eq("id", id);
      } catch (error) {
        console.error("Failed to update reply:", error);
        toast.error("Failed to save reply. Please try again.");
      }
    }, 800),
    []
  );

  const handleReplyChange = (id, value) => {
    setReplyInputs((prev) => ({ ...prev, [id]: value }));
    debouncedUpdateReply(id, value);
  };

  // Emoji picker handlers
  const onEmojiClick = (id, emojiData) => {
    const emoji = emojiData.emoji;
    setReplyInputs((prev) => {
      const newReply = (prev[id] || "") + emoji;
      debouncedUpdateReply(id, newReply);
      return { ...prev, [id]: newReply };
    });
    setEmojiPickerOpen(null);
  };

  // Image upload
  const handleImageSelect = async (id, event) => {
    const file = event.target.files[0];
    if (!file) {
      toast.error("No file selected!");
      return;
    }
    // Create local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews((prev) => ({ ...prev, [id]: reader.result }));
    };
    reader.readAsDataURL(file);

    setUploadingImages((prev) => ({ ...prev, [id]: true }));

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("chat-images").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("chat-images").getPublicUrl(fileName);
      await supabase.from("messages").update({ image_url: publicUrl }).eq("id", id);
      setChats((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, image_url: publicUrl } : msg))
      );
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error(`Image upload failed: ${error.message}`);
    } finally {
      setUploadingImages((prev) => ({ ...prev, [id]: false }));
    }
  };

  const triggerFileInput = (id) => {
    if (fileInputRefs.current[id]) {
      fileInputRefs.current[id].click();
    }
  };

  // Send button
  const handleSendReply = async (id) => {
    const reply = replyInputs[id] || "";
    try {
      await supabase.from("messages").update({ admin_reply: reply }).eq("id", id);
      setReplyInputs((prev) => ({ ...prev, [id]: "" }));
      toast.success("Reply sent!");
    } catch (error) {
      console.error("Failed to send reply:", error);
      toast.error("Failed to send reply.");
    }
  };

  // Group chats by user_id
  const groupedChats = chats.reduce((acc, msg) => {
    if (!acc[msg.user_id]) acc[msg.user_id] = [];
    acc[msg.user_id].push(msg);
    return acc;
  }, {});

  return (
    <div
      ref={containerRef}
      className="max-w-7xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-gray-200 h-[80vh] overflow-y-auto relative"
      aria-label="Admin chat messages"
    >
      <Toaster position="top-right" reverseOrder={false} />
      {Object.keys(groupedChats).length === 0 && (
        <p className="text-center text-gray-500 mt-20 text-lg select-none">💬 No messages yet.</p>
      )}

      {Object.entries(groupedChats).map(([userId, messages]) => (
        <div key={userId} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl font-bold text-indigo-700">👤 User ID: {userId}</span>
            <span className="ml-2 px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded">Group Chat</span>
          </div>
          <div className="space-y-8">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="border border-gray-300 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 relative"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                  <time
                    className="text-xs text-gray-400 select-text"
                    dateTime={msg.created_at}
                    title={new Date(msg.created_at).toLocaleString()}
                  >
                    🕒 {new Date(msg.created_at).toLocaleString()}
                  </time>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap mb-6 select-text">💬 {msg.user_message}</p>
                {msg.image_url || imagePreviews[msg.id] ? (
                  <img
                    src={imagePreviews[msg.id] || msg.image_url}
                    alt="Uploaded"
                    className="w-48 h-48 object-cover rounded-lg mb-6 shadow-md"
                    loading="lazy"
                  />
                ) : null}
                <label
                  htmlFor={`reply-${msg.id}`}
                  className="block font-semibold mb-2 text-indigo-700 select-none flex items-center gap-2"
                >
                  📝 Admin Reply
                  <button
                    type="button"
                    onClick={() =>
                      setEmojiPickerOpen((openId) => (openId === msg.id ? null : msg.id))
                    }
                    className="flex items-center px-2 text-yellow-500 hover:text-yellow-600 transition"
                    aria-label="Toggle emoji picker"
                    tabIndex={-1}
                  >
                    <Smile size={26} />
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerFileInput(msg.id)}
                    aria-label="Upload image"
                    className={`text-indigo-500 hover:text-indigo-700 transition ${
                      uploadingImages[msg.id] ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={uploadingImages[msg.id]}
                  >
                    <ImageIcon size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendReply(msg.id)}
                    aria-label="Send reply"
                    className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={replyInputs[msg.id]?.trim() === ""}
                  >
                    Send <Send size={18} />
                  </button>
                </label>
                <textarea
                  id={`reply-${msg.id}`}
                  placeholder="Type your reply here..."
                  value={replyInputs[msg.id] || ""}
                  onChange={(e) => handleReplyChange(msg.id, e.target.value)}
                  className="w-full min-h-[90px] p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y transition"
                  aria-multiline="true"
                  spellCheck="true"
                />
                {emojiPickerOpen === msg.id && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "60px",
                      left: "12px",
                      zIndex: 1000,
                      width: 320,
                      boxShadow:
                        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      borderRadius: 16,
                      background: "#fff",
                    }}
                  >
                    <EmojiPicker
                      onEmojiClick={(emojiData) => onEmojiClick(msg.id, emojiData)}
                      customEmojis={customEmojis}
                      disableAutoFocus
                      searchDisabled
                      skinTonesDisabled
                      height={260}
                      width={320}
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={(el) => (fileInputRefs.current[msg.id] = el)}
                  onChange={(e) => handleImageSelect(msg.id, e)}
                  disabled={uploadingImages[msg.id]}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
