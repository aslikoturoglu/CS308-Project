import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ProductGrid from "./components/product/ProductGrid";
import ChatButton from "./components/chat/ChatButton";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";

function App() {
  return (
    <Router>
      <Header />
      <nav style={{ marginBottom: "1rem" }}>
        <Link to="/" style={{ marginRight: "1rem" }}>Home</Link>
        <Link to="/login">Login</Link>
      </nav>
      <Routes>
        <Route path="/" element={<ProductGrid />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      <ChatButton />
      <Footer />
    </Router>
  );
}

export default App;