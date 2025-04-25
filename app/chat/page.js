// app/chat/page.tsx
"use client";

import UserChat from "@/components/chat/ChatView";

export default function ChatPage() {
  return (
    <div className="h-screen w-screen bg-white">
      <UserChat />
    </div>
  );
}
