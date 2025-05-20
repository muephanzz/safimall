"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface ChatSession {
  session_id: string;
  last_message: string;
  last_updated: Date;
  unread_count: number;
  is_active: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "agent";
  timestamp: Date;
  is_read: boolean;
}

const AdminChatDashboard: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch all chat sessions
  useEffect(() => {
    const fetchChatSessions = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("chat_messages")
          .select("session_id, text, timestamp, is_read")
          .order("timestamp", { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          // Process data to group by session_id
          const sessionsMap = new Map<string, any>();
          
          data.forEach(msg => {
            if (!sessionsMap.has(msg.session_id)) {
              sessionsMap.set(msg.session_id, {
                session_id: msg.session_id,
                last_message: msg.text,
                last_updated: new Date(msg.timestamp),
                unread_count: msg.is_read ? 0 : 1,
                is_active: true
              });
            } else {
              const session = sessionsMap.get(msg.session_id);
              if (!msg.is_read) {
                session.unread_count += 1;
              }
            }
          });
          
          setChatSessions(Array.from(sessionsMap.values()));
        }
      } catch (error) {
        console.error("Error fetching chat sessions:", error);
        toast.error("Failed to load chat sessions");
      } finally {
        setLoading(false);
      }
    };
    
    fetchChatSessions();
    
    // Subscribe to new messages to update session list
    const channel = supabase
      .channel('admin-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMsg = payload.new;
          setChatSessions(prev => {
            const sessionExists = prev.some(s => s.session_id === newMsg.session_id);
            
            if (sessionExists) {
              return prev.map(session => 
                session.session_id === newMsg.session_id
                  ? {
                      ...session,
                      last_message: newMsg.text,
                      last_updated: new Date(newMsg.timestamp),
                      unread_count: session.unread_count + (newMsg.is_read ? 0 : 1)
                    }
                  : session
              );
            } else {
              return [...prev, {
                session_id: newMsg.session_id,
                last_message: newMsg.text,
                last_updated: new Date(newMsg.timestamp),
                unread_count: newMsg.is_read ? 0 : 1,
                is_active: true
              }];
            }
          });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Fetch messages for selected chat session
  useEffect(() => {
    if (!selectedSession) return;
    
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("session_id", selectedSession)
          .order("timestamp", { ascending: true });
          
        if (error) throw error;
        
        if (data) {
          setMessages(
            data.map(msg => ({
              id: msg.id,
              text: msg.text,
              sender: msg.sender as "user" | "agent",
              timestamp: new Date(msg.timestamp),
              is_read: msg.is_read || false
            }))
          );
          
          // Mark messages as read
          const unreadMessages = data.filter(msg => !msg.is_read && msg.sender === "user");
          if (unreadMessages.length > 0) {
            const unreadIds = unreadMessages.map(msg => msg.id);
            await supabase
              .from("chat_messages")
              .update({ is_read: true })
              .in("id", unreadIds);
              
            // Update unread count in the chat sessions list
            setChatSessions(prev => 
              prev.map(session => 
                session.session_id === selectedSession
                  ? { ...session, unread_count: 0 }
                  : session
              )
            );
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    
    fetchMessages();
    
    // Subscribe to new messages for this session
    const channel = supabase
      .channel(`admin-chat-${selectedSession}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${selectedSession}`
        },
        async (payload) => {
          const newMsg = payload.new;
          
          // Update messages state
          setMessages(prev => [
            ...prev,
            {
              id: newMsg.id,
              text: newMsg.text,
              sender: newMsg.sender as "user" | "agent",
              timestamp: new Date(newMsg.timestamp),
              is_read: newMsg.is_read || false
            }
          ]);
          
          // Mark message as read if it's from user
          if (newMsg.sender === "user" && !newMsg.is_read) {
            await supabase
              .from("chat_messages")
              .update({ is_read: true })
              .eq("id", newMsg.id);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSession]);

  const handleSessionClick = (sessionId: string) => {
    setSelectedSession(sessionId);
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim() || !selectedSession) return;
    
    try {
      await supabase.from("chat_messages").insert({
        session_id: selectedSession,
        text: replyText,
        sender: "agent",
        is_read: true
      });
      
      setReplyText("");
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Chat Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chat Sessions List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Active Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex p-3 border rounded-md">
                    <div className="w-full">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : chatSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active conversations
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {chatSessions.map((session) => (
                  <div 
                    key={session.session_id}
                    onClick={() => handleSessionClick(session.session_id)}
                    className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedSession === session.session_id ? 'bg-gray-100 border-primary' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="truncate">
                        <span className="font-medium">Session: {session.session_id.substring(0, 8)}...</span>
                        <p className="text-sm text-gray-600 truncate">{session.last_message}</p>
                      </div>
                      {session.unread_count > 0 && (
                        <Badge variant="destructive" className="ml-2">{session.unread_count}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {session.last_updated.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Chat Messages */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedSession ? `Chat: ${selectedSession.substring(0, 8)}...` : 'Select a conversation'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedSession ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                Select a conversation from the list
              </div>
            ) : (
              <div className="flex flex-col h-[500px]">
                {/* Messages container */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.sender === 'agent'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span className="text-xs opacity-70 block text-right mt-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Reply form */}
                <form onSubmit={sendReply} className="flex gap-2">
                  <Input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!replyText.trim()}>
                    Send
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminChatDashboard;