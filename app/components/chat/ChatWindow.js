import { motion } from "framer-motion";
import { ArrowLeft, ImageIcon, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react"; // <-- use this
import moment from "moment";

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
}) {
  // Insert emoji at cursor position
  const handleEmojiClick = (emojiData, event) => {
    setMessage((msg) => msg + emojiData.emoji);
    setShowEmoji(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`fixed z-50 bg-white border border-gray-200 shadow-2xl flex flex-col ${
        isMobile
          ? "inset-0 rounded-none"
          : "bottom-6 right-8 w-[370px] h-[520px] rounded-2xl"
      }`}
      style={{ maxHeight: isMobile ? "100vh" : "90vh" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 via-blue-500 to-teal-400 text-white px-5 py-3 rounded-t-2xl">
        <div className="flex items-center gap-2">
          {isMobile && (
            <button onClick={() => setIsOpen(false)} className="text-white mr-2" aria-label="Back">
              <ArrowLeft size={22} />
            </button>
          )}
          <span className="font-bold text-lg tracking-wide">Chat with Support</span>
        </div>
        {!isMobile && (
          <button
            onClick={() => setIsOpen(false)}
            className="text-white text-2xl focus:outline-none"
            aria-label="Close chat"
          >
            &times;
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white via-blue-50 to-indigo-50 px-4 py-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">No messages yet.</div>
        )}
        {messages.map((msg, i) => {
          const isUser = msg.isUser || (msg.user_id && !msg.admin_reply && !msg.isBot);
          const isBot = msg.isBot;
          return (
            <div
              key={msg.id || i}
              className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}
            >
              <div
                className={`rounded-2xl px-4 py-2 max-w-[75%] shadow-md break-words whitespace-pre-line ${
                  isUser
                    ? "bg-gradient-to-tr from-indigo-200 to-blue-100 text-gray-900"
                    : isBot
                    ? "bg-gradient-to-tr from-yellow-100 to-yellow-200 text-yellow-900"
                    : "bg-gradient-to-tr from-blue-600 to-indigo-500 text-white"
                }`}
              >
                <p>{msg.text || msg.user_message || msg.admin_reply}</p>
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
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        className="relative p-3 bg-gray-50 border-t flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <button
          type="button"
          onClick={() => setShowEmoji((v) => !v)}
          className="flex items-center px-2"
          aria-label="Toggle emoji picker"
          tabIndex={-1}
        >
          <Smile size={24} className="text-yellow-500" />
        </button>
        {showEmoji && (
          <div className="absolute bottom-16 left-2 z-50">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width={320}
              height={350}
              emojiStyle="native"
              searchDisabled={false}
              skinTonesDisabled={false}
              lazyLoadEmojis={true}
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 resize-none rounded-lg p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
        <label htmlFor="upload-image" className="cursor-pointer flex items-center" aria-label="Upload image">
          <ImageIcon size={24} className="text-blue-500" />
        </label>
        <button
          type="submit"
          disabled={!message.trim() && !image}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:from-indigo-600 hover:to-blue-500 transition disabled:opacity-50"
          aria-disabled={!message.trim() && !image}
        >
          Send
        </button>
      </form>
    </motion.div>
  );
}
