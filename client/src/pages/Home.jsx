import { Link } from "react-router-dom";

const highlights = [
  {
    title: "Yeni Sezon Koleksiyonu",
    desc: "İskandinav minimalizmi ile sıcak dokuları buluşturan 2025 koleksiyonunu keşfet.",
    badge: "Yeni",
  },
  {
    title: "Çalışma Alanı Fikirleri",
    desc: "Evden çalışmayı daha konforlu hale getiren masa, sandalye ve ışık çözümleri.",
    badge: "İlham",
  },
  {
    title: "Depolama Çözümleri",
    desc: "Daha düzenli bir ev için akıllı raf, dolap ve organizer önerileri.",
    badge: "Favori",
  },
];

const categories = [
  { name: "Oturma Odası", image: "https://images.unsplash.com/photo-1484100356142-db6ab6244067" },
  { name: "Yatak Odası", image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511" },
  { name: "Çalışma Alanı", image: "https://images.unsplash.com/photo-1493666438817-866a91353ca9" },
];

function Home() {
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
            "linear-gradient(120deg, rgba(0,88,163,0.9), rgba(255,204,0,0.95))",
          color: "white",
          gap: 24,
        }}
      >
        <p style={{ letterSpacing: 2, fontSize: "0.95rem", margin: 0 }}>
          HOŞ GELDİN
        </p>
        <h1 style={{ fontSize: "3rem", maxWidth: 720, margin: 0 }}>
          Evin için ilham veren IKEA deneyimi burada başlıyor
        </h1>
        <p style={{ maxWidth: 540, lineHeight: 1.6, fontSize: "1.1rem" }}>
          Konforlu koltuklardan akıllı depolama çözümlerine kadar aradığın her şey
          tek tık uzağında. Yeni sezona özel kampanyaları kaçırma.
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
            Ürünleri Keşfet
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
            İlham Al
          </a>
        </div>
      </section>

      <section id="ilham" style={{ padding: "60px 24px", backgroundColor: "#f8f9fa" }}>
        <h2 style={{ textAlign: "center", color: "#0058a3", marginBottom: 32 }}>
          Evine iyi gelecek fikirler
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
                  backgroundColor: "#ffcc00",
                  color: "#0058a3",
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
