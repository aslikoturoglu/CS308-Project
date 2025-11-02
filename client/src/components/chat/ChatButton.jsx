import { useState } from "react";
import ChatBox from "./ChatBox";
import "../../styles/chat.css";

function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && <ChatBox onClose={() => setIsOpen(false)} />}
      <button className="chat-button" onClick={() => setIsOpen(!isOpen)}>
        💬
      </button>
    </>
  );
}

export default ChatButton;