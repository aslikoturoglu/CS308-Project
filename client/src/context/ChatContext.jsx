// client/src/context/ChatContext.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  connectCustomerSocket,
  sendCustomerMessage,
  disconnectCustomerSocket,
} from "../services/chatService";

const ChatContext = createContext(undefined);

function mapBackendMessage(msg) {
  return {
    id: `${msg.timestamp}-${Math.random().toString(16).slice(2)}`,
    from: msg.from === "agent" ? "assistant" : "user",
    text: msg.text,
    timestamp: msg.timestamp || Date.now(),
  };
}

export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping] = useState(false); // typing şimdilik yok
  const [conversationId, setConversationId] = useState(null);

  const socketReadyRef = useRef(false);

  const handleConversation = useCallback((conv) => {
    setConversationId(conv.id);

    if (Array.isArray(conv.messages)) {
      setMessages(conv.messages.map(mapBackendMessage));
    }
  }, []);

  const handleIncomingMessage = useCallback(
    (_convId, msg) => {
      const mapped = mapBackendMessage(msg);
      setMessages((prev) => [...prev, mapped]);

      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    },
    [isOpen]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (socketReadyRef.current) return;

    connectCustomerSocket({
      onConversation: handleConversation,
      onMessage: handleIncomingMessage,
    });

    socketReadyRef.current = true;

    return () => {
      // Uygulama tamamen kapanırken disconnect istersen burayı açarsın
      // disconnectCustomerSocket();
    };
  }, [isOpen, handleConversation, handleIncomingMessage]);

  const sendMessage = useCallback(
    (text) => {
      if (!conversationId || !text.trim()) return;

      const myMsg = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        from: "user",
        text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, myMsg]);

      sendCustomerMessage(conversationId, text);
    },
    [conversationId]
  );

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) setUnreadCount(0);
      return next;
    });
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      toggleChat,
      closeChat,
      messages,
      sendMessage,
      isTyping,
      unreadCount,
    }),
    [isOpen, toggleChat, closeChat, messages, sendMessage, isTyping, unreadCount]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return ctx;
}
