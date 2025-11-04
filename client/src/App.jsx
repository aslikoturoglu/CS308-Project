import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ProductGrid from "./components/product/ProductGrid";
import ChatButton from "./components/chat/ChatButton";
import Login from "./pages/Login";

import "./styles/globals.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* LOGIN PAGE (Header + Footer only) */}
        <Route
          path="/"
          element={
            <>
              <Header />
              <Login />
              <Footer />
            </>
          }
        />

        {/* MAIN SITE*/}
        <Route
          path="/home"
          element={
            <>
              <Header />
              <ProductGrid />
              <ChatButton />
              <Footer />
            </>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;