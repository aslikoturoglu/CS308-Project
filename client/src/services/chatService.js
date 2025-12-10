// client/src/services/chatService.js
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3000";

let customerSocket = null;

export function connectCustomerSocket({ onConversation, onMessage }) {
  if (customerSocket && customerSocket.connected) return customerSocket;

  customerSocket = io(SOCKET_URL, {
    query: { role: "customer" },
  });

  customerSocket.on("connect", () => {
    // Şimdilik user bilgisi göndermiyoruz, guest olarak başlasın
    customerSocket.emit("customer:init", {
      name: "Guest",
      userId: null,
      email: null,
    });
  });

  customerSocket.on("conversation:created", (conv) => {
    onConversation && onConversation(conv);
  });

  customerSocket.on("conversation:updated", (conv) => {
    onConversation && onConversation(conv);
  });

  customerSocket.on("message:received", ({ conversationId, message }) => {
    onMessage && onMessage(conversationId, message);
  });

  return customerSocket;
}

export function sendCustomerMessage(conversationId, text) {
  if (!customerSocket) return;
  customerSocket.emit("customer:message", { conversationId, text });
}

export function disconnectCustomerSocket() {
  if (customerSocket) {
    customerSocket.disconnect();
    customerSocket = null;
  }
}
