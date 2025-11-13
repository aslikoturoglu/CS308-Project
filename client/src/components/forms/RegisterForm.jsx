import { useState } from "react";
import { useNavigate } from "react-router-dom";

function RegisterForm({ onSuccess }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setInfo("");

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor. Lütfen tekrar kontrol et.");
      return;
    }

    setError("");
    setInfo("Hesabın başarıyla oluşturuldu! Seni giriş sayfasına yönlendiriyoruz...");

    setTimeout(() => {
      if (typeof onSuccess === "function") {
        onSuccess();
      } else {
        navigate("/login");
      }
    }, 1500);
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
        padding: "36px 32px",
        width: "100%",
        maxWidth: 420,
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
        📝 Hesap Oluştur
      </h2>

      {error && (
        <p style={{ color: "#c62828", marginBottom: 16, fontSize: "0.9rem" }}>{error}</p>
      )}

      {info && (
        <p style={{ color: "#0f9d58", marginBottom: 16, fontSize: "0.9rem" }}>{info}</p>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1a1a1a" }}>
          Ad Soyad
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Ayşe Öztürk"
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

        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1a1a1a" }}>
          E-posta
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="ornek@mail.com"
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

        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1a1a1a" }}>
          Şifre
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={4}
            required
            placeholder="••••••"
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

        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1a1a1a" }}>
          Şifre (Tekrar)
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={4}
            required
            placeholder="••••••"
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
            padding: "12px 12px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "#0058a3",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "1rem",
            transition: "filter 0.2s ease",
          }}
        >
          Kayıt Ol
        </button>
      </form>

      <p style={{ fontSize: "0.85rem", marginTop: 16, color: "#4b5563" }}>
        Zaten hesabın var mı?{" "}
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            background: "none",
            border: "none",
            color: "#0058a3",
            cursor: "pointer",
            fontWeight: 600,
            padding: 0,
          }}
        >
          Giriş Yap
        </button>
      </p>
    </div>
  );
}

export default RegisterForm;
