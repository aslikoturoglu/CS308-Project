import { useState } from "react";
import "../../styles/chat.css";

function ChatBox({ onClose }) {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const handleSend = () => {
    if (message.trim() === "") return;
    setChat([...chat, { text: message, from: "user" }]);
    setMessage("");
  };

  return (
    <div className="chat-box">
      <div className="chat-header">
        <span>Chat Support</span>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="chat-messages">
        {chat.length === 0 ? (
          <p className="placeholder">Start a conversation...</p>
        ) : (
          chat.map((msg, i) => (
            <div key={i} className={`message ${msg.from}`}>
              {msg.text}
            </div>
          ))
        )}
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default ChatBox;