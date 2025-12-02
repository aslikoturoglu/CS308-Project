import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProductsWithMeta } from "../services/productService";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);


const highlights = [
  {
    title: "New Season Collection",
    desc: "Discover the 2025 line blending Scandinavian minimalism with warm textures.",
    badge: "New",
  },
  {
    title: "Workspace Ideas",
    desc: "Desks, chairs, and lighting to make working from home more comfortable.",
    badge: "Inspiration",
  },
  {
    title: "Storage Solutions",
    desc: "Smart shelves, closets, and organizers for a more orderly home.",
    badge: "Favorite",
  },
];

const categories = [
  { name: "Living Room", image: "https://raw.githubusercontent.com/aslikoturoglu/CS308-Project/main/project_pictures/10027.png" },
  { name: "Bedroom", image: "https://raw.githubusercontent.com/aslikoturoglu/CS308-Project//main/project_pictures/10049.png" },
  { name: "Workspace", image: "https://raw.githubusercontent.com/aslikoturoglu/CS308-Project//main/project_pictures/10019.png" },
];

function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    gsap.from(".hero-item", {
      opacity: 0,
      y: 40,
      duration: 1,
      stagger: 0.2,
      ease: "power3.out",
    });
  }, []); 

  useEffect(() => {
    const controller = new AbortController();
    fetchProductsWithMeta(controller.signal)
      .then((items) => setFeatured(items.slice(0, 4)))
      .catch((err) => console.error("Featured products failed", err));
    return () => controller.abort();
  }, []);

  return (
    <main style={{ fontFamily: "Arial, sans-serif" }}>
      <section
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "80px 16px",
          background:
            "linear-gradient(120deg, rgba(0, 174, 255, 0.9), rgba(0, 14, 79, 0.95))",
          color: "white",
          gap: 24,
        }}
      >
        <p className="hero-item" style={{ letterSpacing: 2, fontSize: "0.95rem", margin: 0 }}>
          WELCOME
        </p>
        <h1 className="hero-item" style={{ fontSize: "3rem", maxWidth: 720, margin: 0 }}>
          The SUHome experience that inspires your home starts here
        </h1>
        <p className="hero-item" style={{ maxWidth: 540, lineHeight: 1.6, fontSize: "1.1rem" }}>
          From comfy sofas to smart storage, everything you are looking for is a click away.
          Don’t miss the new season offers.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            to="/products"
            style={{
              padding: "12px 26px",
              borderRadius: 999,
              backgroundColor: "#ffffff",
              color: "#0058a3",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Browse Products
          </Link>
          <a
            href="#ilham"
            style={{
              padding: "12px 26px",
              borderRadius: 999,
              border: "2px solid white",
              color: "white",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Get Inspired
          </a>
        </div>
      </section>

      <section style={{ padding: "50px 24px", backgroundColor: "#ffffff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 520 }}>
            <p style={{ margin: 0, letterSpacing: 1, color: "#94a3b8" }}>FEATURED</p>
            <h2 style={{ margin: "6px 0 12px", color: "#0f172a" }}>Handpicked for this week</h2>
            <p style={{ margin: "0 0 12px", color: "#475569" }}>
              Limited stock picks with high ratings. Add to cart while they last.
            </p>
          </div>
          <Link
            to="/products"
            style={{
              alignSelf: "center",
              color: "#0058a3",
              fontWeight: 800,
              textDecoration: "none",
              border: "1px solid #cbd5e1",
              padding: "10px 14px",
              borderRadius: 10,
            }}
          >
            View all products →
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            maxWidth: 1100,
            margin: "20px auto 0",
          }}
        >
          {featured.map((item) => (
            <Link
              key={item.id}
              to={`/products/${item.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                background: "#f8fafc",
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
              }}
            >
              <img src={item.image} alt={item.name} style={{ width: "100%", height: 170, objectFit: "cover" }} />
              <div style={{ padding: 14, display: "grid", gap: 6 }}>
                <h4 style={{ margin: 0, color: "#0f172a" }}>{item.name}</h4>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "#f59e0b", fontWeight: 700 }}>⭐ {item.averageRating}</span>
                  <span style={{ color: "#64748b", fontSize: "0.9rem" }}>({item.ratingCount})</span>
                </div>
                <p style={{ margin: 0, fontWeight: 800, color: "#0f172a" }}>₺{item.price.toLocaleString("tr-TR")}</p>
                <p style={{ margin: 0, color: item.availableStock > 0 ? "#059669" : "#b91c1c", fontWeight: 700 }}>
                  {item.availableStock > 0 ? `${item.availableStock} in stock` : "Out of stock"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="ilham" style={{ padding: "60px 24px", backgroundColor: "#f8f9fa" }}>
        <h2 style={{ textAlign: "center", color: "#0058a3", marginBottom: 32 }}>
          Ideas to elevate your home
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          {highlights.map((item) => (
            <article
              key={item.title}
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 18px 35px rgba(0,0,0,0.05)",
                minHeight: 200,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: "#0058a3",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: 999,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  marginBottom: 14,
                }}
              >
                {item.badge}
              </span>
              <h3 style={{ margin: "0 0 8px" }}>{item.title}</h3>
              <p style={{ color: "#4b5563", margin: 0 }}>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ padding: "60px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          {categories.map((category) => (
            <div
              key={category.name}
              style={{
                position: "relative",
                borderRadius: 16,
                overflow: "hidden",
                minHeight: 220,
                boxShadow: "0 18px 35px rgba(0,0,0,0.08)",
                backgroundColor: "#e5e7eb",
              }}
            >
              <img
                src={`${category.image}?auto=format&fit=crop&w=600&q=60`}
                alt={category.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)",
                  color: "white",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: 20,
                  fontSize: "1.2rem",
                  fontWeight: 700,
                }}
              >
                {category.name}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Home;
