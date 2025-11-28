import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function LoginForm({ onSuccess }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password.trim()) {
      setError("Email and password are required.");
      return;
    }

    const stored = (() => {
      try {
        return JSON.parse(window.localStorage.getItem("registered-users") || "[]");
      } catch {
        return [];
      }
    })();

    const found = stored.find(
      (u) => u.email?.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    const demoRoles = {
      "test@suhome.com": "customer",
      "demo1@suhome.com": "product_manager",
      "demo2@suhome.com": "sales_manager",
      "support@suhome.com": "support",
    };
    const isDemo =
      (email.trim().toLowerCase() === "test@suhome.com" && password === "1234") ||
      (email.trim().toLowerCase() === "demo1@suhome.com" && password === "demo1pass") ||
      (email.trim().toLowerCase() === "demo2@suhome.com" && password === "demo2pass") ||
      (email.trim().toLowerCase() === "support@suhome.com" && password === "support");

    if (found || isDemo) {
      setError("");
      const userPayload = found || { email, name: "Demo User", address: "N/A", role: demoRoles[email.trim().toLowerCase()] ?? "customer" };
      login({
        email: userPayload.email,
        name: userPayload.fullName || userPayload.name || "User",
        address: userPayload.address,
        role: userPayload.role || "customer",
      });

      if (typeof onSuccess === "function") {
        onSuccess();
      } else {
        navigate("/");
      }
    } else {
      setError("Invalid credentials. Try test@suhome.com / 1234 or register a new account.");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
        padding: "36px 32px",
        width: "100%",
        maxWidth: 360,
        borderTop: "6px solid #0058a3",
      }}
    >
      <h2
        style={{
          color: "#0058a3",
          marginBottom: 24,
          fontWeight: 700,
        }}
      >
        🔐 Sign In
      </h2>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            color: "#b91c1c",
            border: "1px solid #fecdd3",
            padding: "10px 12px",
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ textAlign: "left", color: "#1a1a1a", fontSize: "0.85rem", fontWeight: 600 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="test@suhome.com"
            style={{
              width: "100%",
              padding: 10,
              marginTop: 6,
              borderRadius: 8,
              border: "1px solid #d4d7dd",
              fontSize: "0.95rem",
            }}
          />
        </label>

        <label style={{ textAlign: "left", color: "#1a1a1a", fontSize: "0.85rem", fontWeight: 600 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••"
            style={{
              width: "100%",
              padding: 10,
              marginTop: 6,
              borderRadius: 8,
              border: "1px solid #d4d7dd",
              fontSize: "0.95rem",
            }}
          />
        </label>

        <button
          type="submit"
          style={{
            marginTop: 12,
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "#ffcc00",
            color: "#1a1a1a",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "1rem",
            transition: "filter 0.2s ease",
          }}
        >
          Sign In
        </button>
      </form>

      <p style={{ fontSize: "0.85rem", marginTop: 16, color: "#4b5563" }}>
        Don’t have an account?{" "}
        <button
          type="button"
          onClick={() => navigate("/register")}
          style={{
            background: "none",
            border: "none",
            color: "#0058a3",
            cursor: "pointer",
            fontWeight: 600,
            padding: 0,
          }}
        >
          Create one now.
        </button>
      </p>
    </div>
  );
}

export default LoginForm;
