import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ChatContext = createContext(undefined);
const STORAGE_KEY = "chat-thread";

const seedMessages = [
  {
    id: "welcome",
    from: "assistant",
    text: "Hi there! Ask about orders, returns, or product suggestions anytime.",
    timestamp: Date.now(),
  },
];

const cannedReplies = [
  {
    match: /cargo|shipping|delivery|kargo|teslim/i,
    text: "Orders ship in 1-3 business days. I can share your tracking code once it’s ready.",
  },
  {
    match: /return|refund|exchange|iade|degisim|değişim/i,
    text: "You can return items within 14 days for free. I can create a return code for you.",
  },
  {
    match: /stock|size|color|ürün|beden/i,
    text: "Share the product name and I’ll check available sizes and colors for you.",
  },
  {
    match: /price|discount|sale|fiyat|indirim/i,
    text: "We apply basket-only discounts automatically when you add items to cart.",
  },
];

const fallbackReplies = [
  "Got it—I'll get back to you with the details in a moment.",
  "I’m putting together a couple of options for you.",
  "Checking that now. Let me know if you have another question meanwhile.",
];

const buildMessage = (text, from) => ({
  id: `${from}-${Date.now()}-${Math.round(Math.random() * 1000)}`,
  from,
  text,
  timestamp: Date.now(),
});

function resolveReply(input) {
  const found = cannedReplies.find((item) => item.match.test(input));
  if (found) return found.text;
  return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
}

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState(() => {
    if (typeof window === "undefined") return seedMessages;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : seedMessages;
    } catch (error) {
      console.error("Chat storage read failed", error);
      return seedMessages;
    }
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Chat storage write failed", error);
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  const appendMessage = (text, from) => {
    const message = buildMessage(text, from);
    setMessages((prev) => [...prev, message]);
    if (from === "assistant" && !isOpen) {
      setUnreadCount((prev) => prev + 1);
    }
    return message;
  };

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    appendMessage(trimmed, "user");
    setIsTyping(true);
    setTimeout(() => {
      appendMessage(resolveReply(trimmed), "assistant");
      setIsTyping(false);
    }, 450);
  };

  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);
  const toggleChat = () => setIsOpen((prev) => !prev);

  const value = useMemo(
    () => ({
      messages,
      isOpen,
      isTyping,
      unreadCount,
      sendMessage,
      appendMessage,
      openChat,
      closeChat,
      toggleChat,
    }),
    [messages, isOpen, isTyping, unreadCount]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}
