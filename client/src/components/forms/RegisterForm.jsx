import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";

function RegisterForm({ onSuccess }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setInfo("");

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please check again.");
      addToast("Passwords do not match", "error");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      addToast("Password must be at least 6 characters", "error");
      return;
    }

    if (!address.trim()) {
      setError("Address is required.");
      addToast("Address is required", "error");
      return;
    }

    if (!emailPattern.test(email.trim())) {
      setError("Enter a valid email address.");
      addToast("Enter a valid email address", "error");
      return;
    }

    const users = (() => {
      try {
        return JSON.parse(window.localStorage.getItem("registered-users") || "[]");
      } catch {
        return [];
      }
    })();

    if (users.some((u) => u.email?.toLowerCase() === email.trim().toLowerCase())) {
      setError("This email is already registered.");
      addToast("This email is already registered", "error");
      return;
    }

    const newUser = {
      fullName,
      email: email.trim(),
      password,
      address: address.trim(),
    };

    try {
      window.localStorage.setItem("registered-users", JSON.stringify([...users, newUser]));
    } catch (storageError) {
      console.error("Failed to save user", storageError);
    }

    setError("");
    setInfo("Account created! Redirecting you to the login page...");
    addToast("Account created, redirecting to login", "info");

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
        📝 Create Account
      </h2>

      {error && (
        <p style={{ color: "#c62828", marginBottom: 16, fontSize: "0.9rem" }}>{error}</p>
      )}

      {info && (
        <p style={{ color: "#0f9d58", marginBottom: 16, fontSize: "0.9rem" }}>{info}</p>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1a1a1a" }}>
          Full Name
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Jane Doe"
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
          Email
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
          Password
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
          Confirm Password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
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
          Address
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            placeholder="Street, number, district, city"
            style={{
              width: "100%",
              padding: 10,
              marginTop: 6,
              borderRadius: 8,
              border: "1px solid #d4d7dd",
              fontSize: "0.95rem",
              minHeight: 70,
              resize: "vertical",
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
          Sign Up
        </button>
      </form>

      <p style={{ fontSize: "0.85rem", marginTop: 16, color: "#4b5563" }}>
        Already have an account?{" "}
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
          Sign In
        </button>
      </p>
    </div>
  );
}

export default RegisterForm;
