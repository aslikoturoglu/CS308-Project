import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Header from "./components/layout/Header";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ChatButton from "./components/chat/ChatButton";
import AppRouter from "./router/AppRouter";

import "./styles/globals.css";



function App() {
  return (
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
  );
}

export default App;
