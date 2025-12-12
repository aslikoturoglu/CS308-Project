import { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/chat.css";
import { useChat } from "../../context/ChatContext";

const formatTime = (value) =>
  new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

function ChatBox() {
  const {
    messages,
    sendMessage,
    isSending,
    isLoading,
    syncError,
    lastError,
    hasHydrated,
    closeChat,
  } = useChat();
  const [draft, setDraft] = useState("");
  const endRef = useRef(null);

  const hasMessages = useMemo(() => messages?.length > 0, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSend = (text = draft) => {
    if (!text.trim()) return;
    sendMessage(text);
    setDraft("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="chat-box">
      <div className="chat-header">
        <div className="chat-title">
          <div className="chat-status-dot" />
          <div>
            <p className="chat-label">Live Support</p>
            <p className="chat-subtitle">We usually reply within a few minutes</p>
          </div>
        </div>
        <button className="close-btn" onClick={closeChat} aria-label="Close chat">
          ✕
        </button>
      </div>

      <div className="chat-messages">
        {isLoading && !hasHydrated && <p className="placeholder">Connecting you to support...</p>}
        {!isLoading && !hasMessages ? (
          <p className="placeholder">Type your question and we’ll jump in to help.</p>
        ) : (
          messages.map((msg) => {
            const alignment = msg.from === "user" || msg.from === "customer" ? "user" : "assistant";
            return (
              <div key={msg.id} className={`message-row ${alignment}`}>
                <div className="avatar">{alignment === "assistant" ? "🤝" : "🙂"}</div>
                <div className="bubble">
                  <p>{msg.text}</p>
                  <span className="meta">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            );
          })
        )}

        {isSending && (
          <div className="message-row assistant">
            <div className="avatar">🤖</div>
            <div className="bubble typing">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {(syncError || lastError) && (
        <div style={{ padding: "8px 12px", color: "#b91c1c", fontSize: "0.9rem" }}>
          {syncError || lastError}
        </div>
      )}

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Write a message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={isSending}
        />
        <button type="submit" disabled={isSending}>
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default ChatBox;
