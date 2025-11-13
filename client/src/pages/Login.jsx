import LoginForm from "../components/forms/LoginForm";

function Login() {
  return (
    <section
      style={{
        minHeight: "70vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 16px",
        flexWrap: "wrap",
        gap: 32,
        background: "linear-gradient(135deg, #f8f9fa 0%, #eef2f7 100%)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#0058a3", fontSize: "2rem", margin: 0 }}>
          Tekrar hoş geldin 👋
        </h1>
        <p style={{ color: "#4b5563", maxWidth: 360 }}>
          Favori IKEA ürünlerini görmek, sepetini yönetmek ve özel teklifleri
          yakalamak için hesabına giriş yap.
        </p>
      </div>

      <LoginForm />
    </section>
  );
}

export default Login;
