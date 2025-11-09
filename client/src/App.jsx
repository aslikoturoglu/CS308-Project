import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProductGrid from "./components/product/ProductGrid";
import Login from "./pages/Login";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import ChatButton from "./components/chat/ChatButton";

import "./styles/globals.css";



function App() {
  return (
    <Router>
      <Header />
      <Navbar />

      <Routes>
        {/* 🏠 HOME */}
        <Route path="/" element={<ProductGrid />} />

        {/* 🛋️ PRODUCTS */}
        <Route path="/products" element={<ProductGrid />} />

        {/* 🛒 CART */}
        <Route path="/cart" element={<Cart />} />

        {/* ❤️ WISHLIST */}
        <Route path="/wishlist" element={<Wishlist />} />

        {/* 👤 PROFILE */}
        <Route path="/profile" element={<Profile />} />

        {/* 🔑 LOGIN */}
        <Route path="/login" element={<Login />} />
      </Routes>

      <ChatButton />
      <Footer />
    </Router>
  );
}

export default App;
