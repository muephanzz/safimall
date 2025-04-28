"use client";

import { useEffect } from "react";
import { ArrowLeft, ImageIcon, Smile } from "lucide-react";
import { useRouter } from "next/navigation";
import moment from "moment";
import EmojiPicker from "emoji-picker-react";

export default function ChatWindow({
  isMobile,
  messages,
  messagesEndRef,
  message,
  setMessage,
  sendMessage,
  image,
  setImage,
  handleImageUpload,
  setIsOpen,
  showEmoji,
  setShowEmoji,
  handleEmojiClick,
}) {
  const router = useRouter();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onEmojiClick = (emojiData, event) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  return (
    <div
      className={`fixed bg-white flex flex-col shadow-xl ${
        isMobile
          ? "inset-0 h-screen w-full"
          : "bottom-6 right-8 h-[440px] w-[340px] rounded-3xl"
      }`}
      style={{ maxHeight: isMobile ? "100vh" : "90vh" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between bg-gradient-to-r from-indigo-700 via-blue-600 to-teal-500 text-white px-5 py-3 rounded-t-3xl shadow-md">
        {isMobile && (
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="mr-3 hover:text-gray-300 transition"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <h2 className="font-semibold text-lg tracking-wide flex-grow text-center select-none">
          Chat with Support
        </h2>
        {!isMobile && (
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
            className="text-3xl font-extrabold px-2 hover:text-gray-400 transition"
          >
            &times;
          </button>
        )}
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-white via-blue-50 to-indigo-50 p-4 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 mt-20 select-none">
            No messages yet.
          </p>
        ) : (
          messages.map((msg) => {
            const isUser = msg.isUser || false;
            return (
              <div
                key={msg.id}
                className={`flex mb-2 ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-3xl px-5 py-3 max-w-[75%] shadow-md break-words whitespace-pre-line ${
                    isUser
                      ? "bg-gradient-to-tr from-indigo-300 to-blue-200 text-gray-900"
                      : "bg-gradient-to-tr from-blue-700 to-indigo-600 text-white"
                  }`}
                >
                  <p>{msg.user_message}</p>
                  {msg.image_url && (
                    <img
                      src={msg.image_url}
                      alt="media"
                      className="mt-3 w-full h-36 object-cover rounded-xl"
                    />
                  )}
                  <div className="text-xs text-gray-400 mt-1 text-right select-none">
                    {moment(msg.created_at).format("h:mm A")}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input area */}
      <form
        onSubmit={sendMessage}
        className="relative p-3 bg-gray-50 border-t flex gap-3 rounded-b-3xl"
      >
        <button
          type="button"
          onClick={() => setShowEmoji((v) => !v)}
          className="flex items-center px-2 text-yellow-500 hover:text-yellow-600 transition"
          aria-label="Toggle emoji picker"
          tabIndex={-1}
        >
          <Smile size={26} />
        </button>

        {showEmoji && (
          <div
            style={{
              position: "absolute",
              bottom: "60px",
              left: "12px",
              zIndex: 1000,
              width: 280,
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              borderRadius: 16,
              overflowy: "scroll",
            }}
          >
          <EmojiPicker
              onEmojiClick={onEmojiClick}
              height={360} // Decrease height to 250px (default is 450)
              width={320}
            />
          </div>
        )}

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 resize-none rounded-xl p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          rows={1}
          maxLength={1000}
          aria-label="Message input"
        />

        <input
          type="file"
          accept="image/*"
          id="upload-image"
          onChange={handleImageUpload}
          className="hidden"
        />
        <label
          htmlFor="upload-image"
          className="cursor-pointer flex items-center text-blue-600 hover:text-blue-700 transition"
          aria-label="Upload image"
        >
          <ImageIcon size={26} />
        </label>

        <button
          type="submit"
          disabled={!message.trim() && !image}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-5 py-2 rounded-xl shadow-lg hover:from-indigo-700 hover:to-blue-600 transition disabled:opacity-50"
          aria-disabled={!message.trim() && !image}
        >
          Send
        </button>
      </form>
    </div>
  );
}
