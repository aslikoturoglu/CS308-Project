import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === "test@ikea.com" && password === "1234") {
      navigate("/"); // Home = "/"
    } else {
      alert("Invalid email or password!");
    }
  };

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f8f9fa",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
          padding: "40px 32px",
          width: "320px",
          textAlign: "center",
          borderTop: "6px solid #0058a3",
        }}
      >
        <h2 style={{ color: "#0058a3", marginBottom: 20, fontWeight: "bold" }}>
          🔑 Login
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 12,
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 12,
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
          />
          <button
            type="submit"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 6,
              border: "none",
              backgroundColor: "#ffcc00",
              color: "#1a1a1a",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
