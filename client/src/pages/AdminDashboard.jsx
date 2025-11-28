import React, { useMemo, useState } from "react";
import AdminSidebar from "../components/admin/AdminSidebar";
import ProductTable from "../components/admin/ProductTable";
import OrderTable from "../components/admin/OrderTable";

const metricCards = [
  { label: "Revenue (7d)", value: "₺125,430", change: "+8.2%", tone: "#0058a3" },
  { label: "Orders", value: "312", change: "+5.4%", tone: "#f59e0b" },
  { label: "Pending", value: "24", change: "-3 pending vs yesterday", tone: "#ef4444" },
  { label: "Avg. Cart", value: "₺402", change: "+1.1%", tone: "#0ea5e9" },
];

const mockProducts = [
  { id: "P-1023", name: "MALM Bed Frame", category: "Bedroom", stock: 42, price: 18999, status: "Published" },
  { id: "P-2045", name: "POÄNG Armchair", category: "Living Room", stock: 18, price: 7999, status: "Draft" },
  { id: "P-3502", name: "ALEX Drawer Unit", category: "Workspace", stock: 7, price: 5499, status: "Low stock" },
  { id: "P-4110", name: "BESTÅ Storage", category: "Storage", stock: 64, price: 9999, status: "Published" },
];

const mockOrders = [
  { id: "#ORD-1001", customer: "Ayşe Demir", date: "2024-12-18", total: 28999, status: "Shipped" },
  { id: "#ORD-1002", customer: "Mehmet Kaya", date: "2024-12-19", total: 15999, status: "Pending" },
  { id: "#ORD-1003", customer: "Selin Yılmaz", date: "2024-12-20", total: 8299, status: "Delivered" },
  { id: "#ORD-1004", customer: "Kerem Çelik", date: "2024-12-21", total: 11999, status: "Preparing" },
];

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const totals = useMemo(() => {
    const revenue = mockOrders.reduce((sum, o) => sum + o.total, 0);
    const lowStock = mockProducts.filter((p) => p.stock < 10).length;
    return { revenue, lowStock };
  }, []);

  return (
    <div style={{ background: "#f3f4f6", minHeight: "calc(100vh - 160px)", padding: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <AdminSidebar activeSection={activeSection} onSelect={setActiveSection} />

        <main
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <header
            style={{
              background: "white",
              borderRadius: 16,
              padding: 18,
              boxShadow: "0 18px 40px rgba(0,0,0,0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ margin: "0 0 6px", color: "#6b7280", fontWeight: 700 }}>
                Admin workspace / {activeSection}
              </p>
              <h1 style={{ margin: 0, color: "#0f172a" }}>Dashboard</h1>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, color: "#6b7280" }}>Today&apos;s revenue</p>
              <strong style={{ fontSize: "1.4rem", color: "#0058a3" }}>
                ₺{totals.revenue.toLocaleString("tr-TR")}
              </strong>
            </div>
          </header>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            {metricCards.map((card) => (
              <div
                key={card.label}
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                  borderLeft: `6px solid ${card.tone}`,
                }}
              >
                <p style={{ margin: "0 0 6px", color: "#6b7280", fontWeight: 700 }}>{card.label}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>
                    {card.value}
                  </span>
                  <span style={{ color: card.tone, fontWeight: 700, fontSize: "0.95rem" }}>
                    {card.change}
                  </span>
                </div>
              </div>
            ))}
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 16,
            }}
          >
            <OrderTable orders={mockOrders} onUpdateStatus={(order) => console.log("Update", order)} />
            <ProductTable
              products={mockProducts}
              onEdit={(product) => console.log("Edit", product)}
              onDelete={(id) => console.log("Delete", id)}
            />
          </section>

          <section
            style={{
              background: "linear-gradient(135deg, rgba(0,88,163,0.08), rgba(255,204,0,0.12))",
              borderRadius: 16,
              padding: 16,
              border: "1px solid rgba(0,88,163,0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>Operational reminders</h3>
                <p style={{ margin: 0, color: "#374151" }}>
                  {totals.lowStock} products are low on stock. Prioritize restock before weekend campaigns.
                </p>
              </div>
              <button
                type="button"
                style={{
                  backgroundColor: "#0f172a",
                  color: "white",
                  border: "none",
                  padding: "10px 14px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                View details
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
