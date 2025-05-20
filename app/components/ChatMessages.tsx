import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import ProductSuggestion from "./ProductSuggestion";

interface Message {
  id: string;
  text: string;
  sender: "user" | "agent";
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: Message[];
  loading?: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, loading = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show product suggestion after a few user messages
  const showProductSuggestion = messages.filter(m => m.sender === "user").length === 2;

  if (loading) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="animate-pulse flex space-x-2">
          <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
          <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
          <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-400">
          <p>Start a conversation...</p>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.sender === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg p-3",
                message.sender === "user"
                  ? "bg-primary text-white rounded-tr-none"
                  : "bg-gray-100 text-gray-800 rounded-tl-none"
              )}
            >
              <p>{message.text}</p>
              <span className="text-xs opacity-70 block text-right mt-1">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        ))
      )}
      
      {showProductSuggestion && <ProductSuggestion />}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;