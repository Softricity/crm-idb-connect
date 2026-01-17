"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Button, Input, Avatar, Spinner } from "@heroui/react";
import { Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.idbconnect.global';
// Convert https:// to wss:// and http:// to ws://
const SOCKET_URL = API_BASE.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');

interface Message {
  id: string;
  message: string;
  sender_type: "LEAD" | "PARTNER" | "AGENT";
  created_at: string;
  is_read: boolean;
  partner?: {
    name: string;
    email: string;
  };
}

interface ChatComponentProps {
  leadId: string;
  leadName: string;
  currentUserType: "PARTNER" | "AGENT";
}

function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(c => c.trim().startsWith('auth-token='));
  if (!tokenCookie) return null;
  try {
    const value = tokenCookie.split('=')[1];
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export default function ChatComponent({ leadId, leadName, currentUserType }: ChatComponentProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMessageRef = useRef<string | null>(null); // Track pending message

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/chat/history/${leadId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data || []);
        } else {
          toast.error("Failed to load chat history");
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        toast.error("Error loading chat history");
      } finally {
        setLoading(false);
      }
    };

    if (leadId) {
      loadHistory();
    }
  }, [leadId]);

  // Socket connection
  useEffect(() => {
    const token = getAuthToken();
    if (!token || !leadId) {
      toast.error("Authentication required");
      return;
    }

    console.log("🔌 Connecting to Socket.io...", `${SOCKET_URL}/chat`);
    console.log("🔑 Using token:", token ? "Token exists" : "No token");

    const socketInstance = io(`${SOCKET_URL}/chat`, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected successfully!", socketInstance.id);
      setIsConnected(true);
      
      // If staff (Partner/Agent), join the room
      if (currentUserType === "PARTNER" || currentUserType === "AGENT") {
        console.log("👤 Staff user - joining room:", leadId);
        socketInstance.emit("join_room", { lead_id: leadId });
      }
    });

    socketInstance.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
      console.error("Error details:", err);
      toast.error(`Connection error: ${err.message}`);
      setIsConnected(false);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected. Reason:", reason);
      setIsConnected(false);
    });

    // Listen for new messages
    socketInstance.on("receive_message", (data: Message) => {
      console.log("Received message:", data);
      setMessages((prev) => {
        // Remove temp message if this is the confirmed version
        const filteredMessages = prev.filter(msg => {
          // Remove temp messages that match the incoming real message
          if (msg.id.startsWith('temp-') && 
              msg.message === data.message && 
              msg.sender_type === data.sender_type) {
            return false; // Remove this temp message
          }
          return true;
        });
        
        // Avoid duplicates
        if (filteredMessages.some(msg => msg.id === data.id)) {
          return filteredMessages;
        }
        
        return [...filteredMessages, data];
      });

      // Clear pending message ref
      if (pendingMessageRef.current === data.message) {
        pendingMessageRef.current = null;
      }

      // Mark as read if chat window is open
      socketInstance.emit("mark_read", { lead_id: leadId });
    });

    // Listen for typing indicator
    socketInstance.on("user_typing", (data: { user: string; isTyping: boolean }) => {
      console.log("Typing status:", data);
      if (data.isTyping) {
        setTypingUser(data.user);
      } else {
        setTypingUser(null);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [leadId, currentUserType]);

  const handleTyping = useCallback((typing: boolean) => {
    if (!socket || !isConnected) return;

    socket.emit("typing", {
      lead_id: leadId,
      isTyping: typing,
    });
  }, [socket, isConnected, leadId]);

  const handleInputChange = (value: string) => {
    setNewMessage(value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start typing
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      handleTyping(true);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      handleTyping(false);
    }, 2000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket || !isConnected) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    // Stop typing indicator
    setIsTyping(false);
    handleTyping(false);

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Track pending message
    pendingMessageRef.current = messageText;

    // Optimistic UI update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      message: messageText,
      sender_type: currentUserType,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev) => [...prev, tempMessage]);

    // Send via socket
    socket.emit("send_message", {
      lead_id: leadId,
      message: messageText,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar
            name={leadName}
            size="sm"
            src="https://swiftwebapp.sgp1.digitaloceanspaces.com/images/avatar.png"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{leadName}</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-xs text-gray-500">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender_type === currentUserType;
            const isTemp = msg.id.startsWith('temp-');

            return (
              <div
                key={msg.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  } ${isTemp ? 'opacity-50' : ''}`}
                >
                  {!isOwnMessage && msg.partner && (
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {msg.partner.name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {format(new Date(msg.created_at), 'hh:mm a')}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {typingUser && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
              <span className="text-sm text-gray-600">{typingUser} is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isConnected}
            className="flex-1"
            size="lg"
          />
          <Button
            color="primary"
            isIconOnly
            onPress={sendMessage}
            isDisabled={!newMessage.trim() || !isConnected}
            size="lg"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        {!isConnected && (
          <p className="text-xs text-red-500 mt-2">
            Disconnected from server. Trying to reconnect...
          </p>
        )}
      </div>
    </div>
  );
}
