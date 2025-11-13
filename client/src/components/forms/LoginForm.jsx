import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginForm({ onSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (email.trim() === "test@ikea.com" && password === "1234") {
      setError("");

      if (typeof onSuccess === "function") {
        onSuccess();
      } else {
        navigate("/");
      }
    } else {
      setError("Geçersiz e-posta veya şifre. test@ikea.com / 1234 deneyebilirsin.");
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
        🔐 Giriş Yap
      </h2>

      {error && (
        <p
          style={{
            color: "#c62828",
            marginBottom: 16,
            fontSize: "0.9rem",
          }}
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ textAlign: "left", color: "#1a1a1a", fontSize: "0.85rem", fontWeight: 600 }}>
          E-posta
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="test@ikea.com"
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
          Şifre
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
          Giriş Yap
        </button>
      </form>

      <p style={{ fontSize: "0.85rem", marginTop: 16, color: "#4b5563" }}>
        Hesabın yok mu?{" "}
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
          Hemen kaydol.
        </button>
      </p>
    </div>
  );
}

export default LoginForm;
