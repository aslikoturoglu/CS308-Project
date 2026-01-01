import { useState } from "react";
import LoginForm from "../components/forms/LoginForm";

function Login() {
  const [lightPos, setLightPos] = useState({ x: "50%", y: "50%" });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setLightPos({
      x: `${e.clientX - rect.left}px`,
      y: `${e.clientY - rect.top}px`,
    });
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      style={{
        minHeight: "70vh",
        position: "relative", 
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 16px",
        flexWrap: "wrap",
        gap: 32,
        background: "#14001f",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
       <div
       style={{
         position: "absolute",
         inset: 0,
         pointerEvents: "none",
         zIndex: 0,
         background: `radial-gradient(
           circle at ${lightPos.x} ${lightPos.y},
           rgba(255,255,255,0.22),
           rgba(255,255,255,0.1) 25%,
           rgba(66, 41, 80, 0.95) 50%
         )`,
         transition: "background 0.05s linear",
       }}
     />
    
    <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#0058a3", fontSize: "2rem", margin: 0 }}>
          Welcome back 
        </h1>
        <p style={{ color: "#4b5563", maxWidth: 360 }}>
          Sign in to browse your favorite SUHome products, manage your cart, and catch special offers.
        </p>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <LoginForm />
      </div>
    </section>
  );
}

export default Login;
