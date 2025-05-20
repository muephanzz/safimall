import React, { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabaseClient";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import toast from "react-hot-toast";

type Message = {
  id: string;
  text: string;
  sender: "user" | "agent";
  timestamp: Date;
};

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize session ID and load messages
  useEffect(() => {
    // Get or create a session ID
    let chatSessionId = localStorage.getItem("chat_session_id");
    if (!chatSessionId) {
      chatSessionId = uuidv4();
      localStorage.setItem("chat_session_id", chatSessionId as string);
    }
    setSessionId(chatSessionId ?? "");
    
    // Fetch previous messages for this session
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("session_id", chatSessionId)
          .order("timestamp", { ascending: true });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setMessages(
            data.map(msg => ({
              id: msg.id,
              text: msg.text,
              sender: msg.sender as "user" | "agent", // Type assertion here
              timestamp: new Date(msg.timestamp)
            }))
          );
        } else if (isOpen && chatSessionId) {
          // Add welcome message only if no messages and chat is open
          sendWelcomeMessage(chatSessionId);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load chat sessions");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (chatSessionId) {
      fetchMessages();
    }
  }, [isOpen, toast]);
  
  // Subscribe to realtime updates
  useEffect(() => {
    if (!sessionId) return;
    
    const channel = supabase
      .channel('public:chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newMessage = payload.new;
          if (newMessage && newMessage.id) {
            setMessages(currentMessages => [
              ...currentMessages,
              {
                id: newMessage.id,
                text: newMessage.text,
                sender: newMessage.sender as "user" | "agent", // Type assertion here
                timestamp: new Date(newMessage.timestamp)
              }
            ]);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);
  
  // Send welcome message function
  const sendWelcomeMessage = async (sessionId: string) => {
    try {
      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        text: "Hello! How can I help you with your shopping today?",
        sender: "agent"
      });
    } catch (error) {
      console.error("Error sending welcome message:", error);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    
    // Send welcome message if opening chat for the first time
    if (!isOpen && messages.length === 0 && sessionId) {
      sendWelcomeMessage(sessionId);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !sessionId) return;
    
    try {
      // Insert user message
      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        text: text,
        sender: "user",
        user_id: await supabase.auth.getUser().then(res => res.data.user?.id)
      });
      
      // Simulate agent response after a delay
      setTimeout(async () => {
        try {
          await supabase.from("chat_messages").insert({
            session_id: sessionId,
            text: "Thank you for your message. Our team will get back to you soon.",
            sender: "agent"
          });
        } catch (error) {
          console.error("Error sending agent message:", error);
         toast.error("Failed to send response message");
        }
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send your message");
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <div className="w-full sm:w-96 h-[550px] max-h-[80vh] bg-white rounded-lg shadow-lg flex flex-col overflow-hidden animate-slide-up">
          <ChatHeader onClose={toggleChat} />
          <ChatMessages messages={messages} />
          <ChatInput onSendMessage={sendMessage} />
        </div>
      ) : (
        <Button
          onClick={toggleChat}
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-white p-0 shadow-lg animate-float"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
};

export default ChatWidget;