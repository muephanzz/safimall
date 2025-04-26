"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import debounce from "lodash.debounce";
import { Smile, Send, ImageIcon } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import EmojiPicker from "emoji-picker-react"; // Import EmojiPicker

export default function AdminChat() {
    const [chats, setChats] = useState([]);
    const [replyInputs, setReplyInputs] = useState({});
    const [uploadingImages, setUploadingImages] = useState({});
    const [imagePreviews, setImagePreviews] = useState({});
    const fileInputRefs = useRef({});
    const containerRef = useRef(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [users, setUsers] = useState([]); // State to store the users

    // Fetch users on component mount
    useEffect(() => {
        const fetchUsers = async () => {
            const { data, error } = await supabase
                .from("profiles") // Assuming you have a profiles table with user information
                .select("*");

            if (!error) {
                setUsers(data || []);
            } else {
                console.error("Error fetching users:", error);
                toast.error("Failed to load users.");
            }
        };
        fetchUsers();
    }, []);

    // Fetch messages on mount and when selectedUserId changes
    useEffect(() => {
        let isMounted = true;
        const fetchMessages = async () => {
            if (!selectedUserId) {
                setChats([]);
                return;
            }

            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("user_id", selectedUserId) // Filtering messages for the selected user
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
    }, [selectedUserId]);

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
            // Clear input after send
            setReplyInputs((prev) => ({ ...prev, [id]: "" }));

            toast.success("Reply sent!");
        } catch (error) {
            console.error("Failed to send reply:", error);
            toast.error("Failed to send reply.");
        }
    };

    return (
        <div
            ref={containerRef}
            className="max-w-7xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-gray-200 h-[80vh] overflow-y-auto relative"
            aria-label="Admin chat messages"
        >
            <Toaster position="top-right" reverseOrder={false} />

            {/* User Selection */}
            <div className="mb-6">
                <label htmlFor="userSelect" className="block text-sm font-medium text-gray-700">
                    Select a User to Chat With:
                </label>
                <select
                    id="userSelect"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    value={selectedUserId || ''}
                >
                    <option value="">Select a User</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.username || user.email || user.id}
                        </option>
                    ))}
                </select>
            </div>

            {/* Display messages only when a user is selected */}
            {selectedUserId ? (
                chats.length === 0 ? (
                    <p className="text-center text-gray-500 mt-20 text-lg select-none">💬 No messages with this user yet.</p>
                ) : (
                    <div className="space-y-8">
                        {chats.map((msg) => (
                            <div
                                key={msg.id}
                                className="border border-gray-300 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 relative"
                            >
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                                    <p className="text-sm text-gray-600 font-semibold select-text">
                                        👤 User ID: <span className="text-indigo-600">{msg.user_id}</span>
                                    </p>
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
                                            setEmojiPickerOpen((prev) => (prev === msg.id ? null : msg.id))
                                        }
                                        aria-label="Toggle emoji picker"
                                        className="text-indigo-500 hover:text-indigo-700 transition"
                                    >
                                        <Smile size={22} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => triggerFileInput(msg.id)}
                                        aria-label="Upload image"
                                        className={`text-indigo-500 hover:text-indigo-700 transition ${uploadingImages[msg.id] ? "opacity-50 cursor-not-allowed" : ""
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
                                    <div className="absolute bottom-[120px] left-6 z-50 shadow-lg rounded-lg overflow-hidden">
                                        <EmojiPicker
                                            onEmojiClick={(_, emojiObject) => onEmojiClick(msg.id, emojiObject)}
                                            emojiStyle="native"
                                            lazyLoadEmojis
                                            height={320}
                                            width={320}
                                            searchDisabled={false}
                                            skinTonesDisabled={false}
                                            previewConfig={{ showPreview: false }}
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
                )
            ) : (
                <p className="text-center text-gray-500 mt-20 text-lg select-none">
                    Select a user to start chatting.
                </p>
            )}
        </div>
    );
}
