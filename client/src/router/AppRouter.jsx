import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import ProductList from "../pages/ProductList";
import Cart from "../pages/Cart";
import Wishlist from "../pages/Wishlist";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import Register from "../pages/Register";
import OrderHistory from "../pages/OrderHistory";
import ProductDetail from "../pages/ProductDetail";
import Checkout from "../pages/Checkout";
import NotFound from "../pages/NotFound";
import AdminDashboard from "../pages/AdminDashboard";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<ProductList />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/orders" element={<OrderHistory />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRouter;
