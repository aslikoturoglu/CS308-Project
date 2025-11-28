import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

function LoginForm({ onSuccess }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setError("Enter a valid email address.");
      addToast("Invalid email format", "error");
      return;
    }
    if (!password.trim()) {
      setError("Email and password are required.");
      addToast("Email and password are required", "error");
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
      const role = found?.role || demoRoles[email.trim().toLowerCase()] || "customer";
      const userPayload = found || { email, name: "Demo User", address: "N/A", role };
      login({
        email: userPayload.email,
        name: userPayload.fullName || userPayload.name || "User",
        address: userPayload.address,
        role,
      });

      if (typeof onSuccess === "function") {
        onSuccess();
      } else {
        if (role === "admin" || role === "product_manager" || role === "sales_manager" || role === "support") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    } else {
      const msg = "Invalid credentials. Try test@suhome.com / 1234 or register a new account.";
      setError(msg);
      addToast(msg, "error");
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
          marginBottom: 12,
          fontWeight: 700,
        }}
      >
        🔐 Sign In
      </h2>
      <p style={{ marginTop: 0, marginBottom: 12, fontSize: "0.85rem", color: "#475569", lineHeight: 1.4 }}>
        Demo creds: <br />
        Customer: test@suhome.com / 1234<br />
        Product Manager: demo1@suhome.com / demo1pass<br />
        Sales Manager: demo2@suhome.com / demo2pass<br />
        Support: support@suhome.com / support
      </p>

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
