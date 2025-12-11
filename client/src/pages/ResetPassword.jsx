import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { submitPasswordReset } from "../services/authService";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler uyuşmuyor");
      return;
    }

    setLoading(true);
    submitPasswordReset({ token, password })
      .then(() => {
        setSuccess("Şifre güncellendi. Giriş ekranına yönlendiriliyorsunuz.");
        addToast("Şifre başarıyla sıfırlandı", "info");
        setTimeout(() => navigate("/login"), 1200);
      })
      .catch((err) => {
        const msg = err.message || "Sıfırlama başarısız";
        setError(msg);
        addToast(msg, "error");
      })
      .finally(() => setLoading(false));
  };

  return (
    <section
      style={{
        minHeight: "70vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 16px",
        background: "linear-gradient(135deg, #f8f9fa 0%, #eef2f7 100%)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          padding: 28,
          borderRadius: 14,
          boxShadow: "0 18px 40px rgba(0,0,0,0.06)",
          maxWidth: 420,
          width: "100%",
          display: "grid",
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0, color: "#0f172a" }}>Şifreyi Sıfırla</h2>
        <p style={{ margin: 0, color: "#475569" }}>Yeni şifreni belirle.</p>
        {error && <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p>}
        {success && <p style={{ color: "#059669", margin: 0 }}>{success}</p>}
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Yeni şifre"
            minLength={6}
            required
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
            }}
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Şifreyi tekrar et"
            minLength={6}
            required
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              border: "none",
              background: "#0058a3",
              color: "white",
              padding: "12px 14px",
              borderRadius: 10,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? "Kaydediliyor..." : "Şifreyi Güncelle"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default ResetPassword;
