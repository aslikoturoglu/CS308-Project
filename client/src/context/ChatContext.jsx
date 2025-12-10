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

const seedMessages = [
  {
    id: "welcome",
    from: "assistant",
    text: "Hi there! Ask about orders, returns, or product suggestions anytime.",
    timestamp: Date.now(),
  },
];

const buildMessage = (text, from) => ({
  id: `${from}-${Date.now()}-${Math.round(Math.random() * 1000)}`,
  from,
  text,
  timestamp: Date.now(),
});

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [clientToken] = useState(() => {
    if (typeof window === "undefined") return "guest";
    const key = "chat-client-token";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const fresh = `g-${crypto.randomUUID?.() ?? Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(key, fresh);
    return fresh;
  });
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState(seedMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [syncError, setSyncError] = useState(null);

  const activeUserId = useMemo(() => user?.id ?? clientToken, [user, clientToken]);
  const identityEmail = useMemo(
    () => user?.email || `${clientToken}@chat.local`,
    [user, clientToken]
  );
  const identityName = useMemo(() => user?.name || "Guest", [user]);

  const normalizeMessages = useCallback(
    (incoming) =>
      (incoming || []).map((msg) => ({
        id: msg.id ?? msg.message_id ?? `${msg.from}-${msg.timestamp}`,
        from: (msg.from === "support" ? "assistant" : msg.from) ??
          (msg.sender_id === activeUserId ? "user" : "assistant"),
        sender_id: msg.sender_id ?? activeUserId,
        text: msg.text ?? msg.message_text ?? "",
        timestamp: msg.timestamp ?? msg.created_at ?? Date.now(),
      })),
    [activeUserId]
  );

  const hydrateFromServer = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserConversation({
        userId: activeUserId,
        email: identityEmail,
        name: identityName,
      });
      setConversationId(data.conversation_id);
      const nextMessages = normalizeMessages(data.messages);
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => String(m.id)));
        const incoming =
          nextMessages.length > 0 ? nextMessages : seedMessages;
        if (!isOpen) {
          const newSupportMessages = incoming.filter(
            (m) => m.from !== "user" && !existingIds.has(String(m.id))
          ).length;
          if (newSupportMessages > 0) {
            setUnreadCount((val) => val + newSupportMessages);
          }
        }
        return incoming;
      });
      setSyncError(null);
    } catch (error) {
      console.error("Chat sync failed", error);
      setSyncError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeUserId, isOpen, normalizeMessages]);

  useEffect(() => {
    hydrateFromServer();
  }, [hydrateFromServer]);

  useEffect(() => {
    if (!conversationId || !isOpen) return undefined;
    const interval = setInterval(() => {
      hydrateFromServer();
    }, 4500);
    return () => clearInterval(interval);
  }, [conversationId, hydrateFromServer, isOpen]);

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
        setSyncError(null);
      })
      .catch((error) => {
        console.error("Support message send failed", error);
        setSyncError(error.message);
        setMessages((prev) =>
          prev
            .filter((msg) => msg.id !== optimistic.id)
            .concat(
              buildMessage(
                "Mesaj gönderilemedi, lütfen tekrar deneyin.",
                "assistant"
              )
            )
        );
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
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}
