import RegisterForm from "../components/forms/RegisterForm";

function Register() {
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
        background: "linear-gradient(135deg, #fff9db 0%, #f0f6ff 100%)",
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
          maxWidth: 420,
        }}
      >
        <h1 style={{ color: "#0058a3", fontSize: "2rem", margin: 0 }}>
          IKEA Ailesine Katıl
        </h1>
        <p style={{ color: "#4b5563", lineHeight: 1.6 }}>
          Favori ürünlerini kaydet, siparişlerini takip et ve sana özel fırsatlardan
          haberdar ol. Kayıt işlemi sadece birkaç dakikanı alır.
        </p>
      </div>

      <RegisterForm />
    </section>
  );
}

export default Register;
