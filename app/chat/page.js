// app/chat/page.tsx
"use client";

import UserChat from "@/components/ChatView";

export default function ChatPage() {
  return (
    <div className="h-screen w-screen bg-white">
      <UserChat />
    </div>
  );
}
