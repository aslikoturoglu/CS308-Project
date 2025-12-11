import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import {
  fetchUserConversation,
  sendUserMessage,
} from "../services/supportService";

const ChatContext = createContext(undefined);

const seedMessages = [];

const buildMessage = (text, from) => ({
  id: `${from}-${Date.now()}-${Math.round(Math.random() * 1000)}`,
  from,
  text,
  timestamp: Date.now(),
});

const safeStorage = {
  get(key) {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.error("Chat storage read failed", error);
      return null;
    }
  },
  set(key, value) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.error("Chat storage write failed", error);
    }
  },
};

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [clientToken] = useState(() => {
    if (typeof window === "undefined") return "guest";
    const key = "chat-client-token";
    const existing = safeStorage.get(key);
    if (existing) return existing;
    const fresh = `g-${crypto.randomUUID?.() ?? Math.random().toString(16).slice(2)}`;
    safeStorage.set(key, fresh);
    return fresh;
  });
  const [serverUserId, setServerUserId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState(seedMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [syncError, setSyncError] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [chatUnavailable, setChatUnavailable] = useState(false);

  const activeUserId = useMemo(
    () => serverUserId ?? user?.id ?? clientToken,
    [serverUserId, user, clientToken]
  );
  const identityEmail = useMemo(
    () => user?.email || `${clientToken}@chat.local`,
    [user, clientToken]
  );
  const identityName = useMemo(() => user?.name || "Guest", [user]);

  const normalizeMessages = useCallback(
    (incoming) =>
      (incoming || []).map((msg) => ({
        id: msg.id ?? msg.message_id ?? `${msg.from}-${msg.timestamp}`,
        from:
          (msg.from === "support" ? "assistant" : msg.from) ??
          (String(msg.sender_id ?? "") === String(activeUserId) ? "user" : "assistant"),
        sender_id: msg.sender_id ?? activeUserId,
        text: msg.text ?? msg.message_text ?? "",
        timestamp: msg.timestamp ?? msg.created_at ?? Date.now(),
      })),
    [activeUserId]
  );

  const hydrateFromServer = useCallback(async () => {
    if (chatUnavailable) return;
    setIsLoading((prev) => prev || !hasHydrated);
    try {
      const data = await fetchUserConversation({
        userId: activeUserId,
        email: identityEmail,
        name: identityName,
      });
      if (data?.user_id) {
        setServerUserId(data.user_id);
      }
      setConversationId(data.conversation_id);
      const nextMessages = normalizeMessages(data.messages);
      const existingIds = new Set(messages.map((m) => String(m.id)));
      const incoming = nextMessages.length > 0 ? nextMessages : seedMessages;
      if (!isOpen) {
        const newSupportMessages = incoming.filter(
          (m) => m.from !== "user" && !existingIds.has(String(m.id))
        ).length;
        if (newSupportMessages > 0) {
          setUnreadCount((val) => val + newSupportMessages);
        }
      }
      setMessages(incoming);
      setSyncError(null);
      setLastError(null);
      setHasHydrated(true);
    } catch (error) {
      const isNetworkLike =
        error?.message?.toLowerCase().includes("failed to fetch") ||
        error?.message?.toLowerCase().includes("load failed") ||
        error?.name === "TypeError";
      if (isNetworkLike) {
        setChatUnavailable(true);
      }
      setSyncError(error.message);
      setLastError(error.message);
      setMessages([]);
      setHasHydrated(true);
    } finally {
      setIsLoading(false);
    }
  }, [activeUserId, isOpen, normalizeMessages, messages, chatUnavailable]);

  useEffect(() => {
    hydrateFromServer();
  }, [hydrateFromServer]);

  useEffect(() => {
    if (!conversationId || !isOpen || chatUnavailable) return undefined;
    const interval = setInterval(() => {
      hydrateFromServer();
    }, 4500);
    return () => clearInterval(interval);
  }, [conversationId, hydrateFromServer, isOpen, chatUnavailable]);

  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const optimistic = buildMessage(trimmed, "user");
    setMessages((prev) => [...prev, optimistic]);
    setIsSending(true);

    sendUserMessage({
      userId: activeUserId,
      text: trimmed,
      email: identityEmail,
      name: identityName,
    })
      .then((payload) => {
        if (payload?.conversation_id) {
          setConversationId(payload.conversation_id);
        }
        if (payload?.message) {
          const [confirmed] = normalizeMessages([payload.message]);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === optimistic.id ? confirmed : msg
            )
          );
        }
        if (payload?.user_id) {
          setServerUserId(payload.user_id);
        }
        setSyncError(null);
      })
      .catch((error) => {
        console.error("Support message send failed", error);
        setSyncError(error.message);
        setLastError(error.message);
        setMessages((prev) => prev.filter((msg) => msg.id !== optimistic.id));
      })
      .finally(() => setIsSending(false));
  };

  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);
  const toggleChat = () => setIsOpen((prev) => !prev);

  const value = useMemo(
    () => ({
      messages,
      isOpen,
      isSending,
      isLoading,
      unreadCount,
      conversationId,
      syncError,
      lastError,
      hasHydrated,
      sendMessage,
      openChat,
      closeChat,
      toggleChat,
    }),
    [
      messages,
      isOpen,
      isSending,
      isLoading,
      unreadCount,
      conversationId,
      syncError,
      lastError,
      hasHydrated,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}
