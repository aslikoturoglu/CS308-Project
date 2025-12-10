import React from "react";
import { BrowserRouter as Router } from "react-router-dom";

import Header from "./components/layout/Header";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import ChatButton from "./components/chat/ChatButton";
import { ChatProvider } from "./context/ChatContext";

import AppRouter from "./router/AppRouter";
import "./styles/globals.css";

function App() {
  return (
    <ChatProvider>
      <Router>
        <div className="app-shell">
          <Header />
          <Navbar />

          <div className="app-content">
            <AppRouter />
          </div>

          <ChatButton />
          <Footer />
        </div>
      </Router>
    </ChatProvider>
  );
}

export default App;
