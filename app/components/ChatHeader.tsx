import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  onClose: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose }) => {
  return (
    <div className="flex items-center justify-between bg-primary p-4 text-white">
      <div className="flex items-center space-x-2">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="font-semibold text-lg">S</span>
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-primary"></span>
        </div>
        <div>
          <h3 className="font-semibold">ShopChat Support</h3>
          <p className="text-xs opacity-80">Usually replies in minutes</p>
        </div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="text-white hover:bg-white/20 rounded-full h-8 w-8"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default ChatHeader;