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
      <Header />
      <Navbar />

      <AppRouter />

      <ChatButton />
      <Footer />
    </Router>
  );
}

export default App;
