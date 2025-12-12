import React from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import Header from "./components/layout/Header";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ChatButton from "./components/chat/ChatButton";
import AppRouter from "./router/AppRouter";

import "./styles/globals.css";

function AppChrome() {
  const location = useLocation();
  const hideShell = location.pathname.startsWith("/admin");

  return (
    <div className="app-shell">
      {!hideShell && <Header />}
      {!hideShell && <Navbar />}

      <div className="app-content">
        <AppRouter />
      </div>

      {!hideShell && <ChatButton />}
      {!hideShell && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppChrome />
    </Router>
  );
}

export default App;
