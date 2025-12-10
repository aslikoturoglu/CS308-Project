/*
import { useMemo, useState } from "react";

const shippingOptions = [
  { id: "standard", label: "Standard Delivery (2-4 days)", fee: 49.9 },
  { id: "express", label: "Express Delivery (1 day)", fee: 129.9 },
];

function CheckoutForm({ cartTotal = 0, onSubmit }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
    shipping: "standard",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const shippingFee = useMemo(() => {
    const selected = shippingOptions.find((option) => option.id === formData.shipping);
    return selected ? selected.fee : 0;
  }, [formData.shipping]);

  const grandTotal = useMemo(() => Number(cartTotal || 0) + shippingFee, [cartTotal, shippingFee]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.address.trim()) {
      setError("Please fill out the required fields.");
      return;
    }

    if (formData.cardNumber.replace(/\s/g, "").length < 16) {
      setError("Card number must be 16 digits.");
      return;
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiry)) {
      setError("Expiry date must match MM/YY.");
      return;
    }

    if (formData.cvc.length < 3) {
      setError("CVC must be 3 or 4 digits.");
      return;
    }

    const payload = {
      ...formData,
      cartTotal,
      shippingFee,
      grandTotal,
    };

    setInfo("Order created! Redirecting to payment confirmation.");
    if (typeof onSubmit === "function") {
      onSubmit(payload);
    }
  };

  return (
    <div className="checkout-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <p style={{ margin: 0, color: "#0f172a", fontWeight: 700, fontSize: "1.35rem" }}>
            🛒 Secure Checkout
          </p>
          <p style={{ margin: 0, color: "#475569", fontSize: "0.95rem" }}>
            Review your details and we will ship your order.
          </p>
        </div>
        <div
          style={{
            background: "#0f172a",
            color: "white",
            padding: "10px 14px",
            borderRadius: 12,
            minWidth: 120,
            textAlign: "right",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Amount Due</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            ₺{grandTotal.toFixed(2)}
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            color: "#b91c1c",
            border: "1px solid #fecdd3",
            padding: "10px 12px",
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {info && (
        <div
          style={{
            background: "#ecfdf3",
            color: "#166534",
            border: "1px solid #bbf7d0",
            padding: "10px 12px",
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          {info}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 16,
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 12, color: "#0f172a" }}>Shipping Details</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
              Full Name*
              <input
                type="text"
                value={formData.fullName}
                onChange={handleChange("fullName")}
                placeholder="e.g. Alex Morgan"
                required
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
              Email*
              <input
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                placeholder="you@example.com"
                required
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
              Phone
              <input
                type="tel"
                value={formData.phone}
                onChange={handleChange("phone")}
                placeholder="+90 5xx xxx xx xx"
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
              Address*
              <textarea
                value={formData.address}
                onChange={handleChange("address")}
                placeholder="Street, number, district"
                required
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <label style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
                City
                <input
                  type="text"
                  value={formData.city}
                  onChange={handleChange("city")}
                  placeholder="City"
                  style={inputStyle}
                />
              </label>
              <label style={{ width: 130, fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
                Postal Code
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={handleChange("postalCode")}
                  placeholder="34000"
                  style={inputStyle}
                />
              </label>
            </div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
              Notes
              <input
                type="text"
                value={formData.notes}
                onChange={handleChange("notes")}
                placeholder="Add a note for the courier"
                style={inputStyle}
              />
            </label>
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 16,
            border: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 4, color: "#0f172a" }}>Payment & Shipping</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {shippingOptions.map((option) => (
              <label
                key={option.id}
                style={{
                  flex: 1,
                  minWidth: 200,
                  border: formData.shipping === option.id ? "2px solid #0f172a" : "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                  background: formData.shipping === option.id ? "#f8fafc" : "#ffffff",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="shipping"
                  value={option.id}
                  checked={formData.shipping === option.id}
                  onChange={handleChange("shipping")}
                  style={{ marginRight: 8 }}
                />
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{option.label}</span>
                <div style={{ color: "#475569", fontSize: "0.9rem" }}>₺{option.fee.toFixed(2)}</div>
              </label>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
              Name on Card
              <input
                type="text"
                value={formData.cardName}
                onChange={handleChange("cardName")}
                placeholder="e.g. ALEX MORGAN"
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
              Card Number
              <input
                type="text"
                inputMode="numeric"
                value={formData.cardNumber}
                onChange={handleChange("cardNumber")}
                placeholder="**** **** **** ****"
                style={inputStyle}
              />
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <label style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
                Expiry (MM/YY)
                <input
                  type="text"
                  value={formData.expiry}
                  onChange={handleChange("expiry")}
                  placeholder="08/26"
                  style={inputStyle}
                />
              </label>
              <label style={{ width: 120, fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
                CVC
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.cvc}
                  onChange={handleChange("cvc")}
                  placeholder="123"
                  style={inputStyle}
                />
              </label>
            </div>
          </div>

          <div
            style={{
              marginTop: "auto",
              background: "#0f172a",
              color: "white",
              borderRadius: 12,
              padding: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
                Items: ₺{Number(cartTotal).toFixed(2)} • Shipping: ₺{shippingFee.toFixed(2)}
              </div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Total: ₺{grandTotal.toFixed(2)}</div>
            </div>
            <button
              type="submit"
              style={{
                background: "#facc15",
                color: "#0f172a",
                border: "none",
                borderRadius: 10,
                padding: "12px 16px",
                fontWeight: 800,
                cursor: "pointer",
                minWidth: 150,
              }}
            >
              Place Order
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  marginTop: 6,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  fontSize: "0.95rem",
  background: "#f8fafc",
};

export default CheckoutForm;
*/

import { useMemo, useState } from "react";

function InputError({ message }) {
  if (!message) return null;

  return (
    <div
      style={{
        background: "#fff7ed",
        color: "#b45309",
        border: "1px solid #fde68a",
        padding: "6px 10px",
        borderRadius: 8,
        fontSize: "0.8rem",
        marginTop: 4,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ fontWeight: 900 }}>!</span>
      <span>{message}</span>
    </div>
  );
}

const shippingOptions = [
  { id: "standard", label: "Standard Delivery (2-4 days)", fee: 49.9 },
  { id: "express", label: "Express Delivery (1 day)", fee: 129.9 },
];

function CheckoutForm({ cartTotal = 0, onSubmit }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
    shipping: "standard",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  // ------- VALIDATION RULES -------
  const validateFullName = (v) => v.includes(" ");
  const validateCardName = (v) => v.includes(" ");
  const validateCardNumber = (v) => /^\d{14,16}$/.test(v.replace(/\s/g, ""));
  const validateExpiry = (v) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(v);
  const validateCVC = (v) => /^\d{3,4}$/.test(v);

  const shippingFee = useMemo(() => {
    const option = shippingOptions.find((o) => o.id === formData.shipping);
    return option ? option.fee : 0;
  }, [formData.shipping]);

  const grandTotal = useMemo(() => Number(cartTotal || 0) + shippingFee, [cartTotal, shippingFee]);

  // ------- HANDLE CHANGE -------
  const handleChange = (field) => (e) => {
    const value = e.target.value;

    setFormData((prev) => ({ ...prev, [field]: value }));

    // realtime validation
    switch (field) {
      case "fullName":
        setErrors((p) => ({
          ...p,
          fullName: validateFullName(value) ? "" : "It must be Full Name.",
        }));
        break;

      case "email":
        setErrors((p) => ({
          ...p,
          email: value.includes("@") ? "" : "Invalid Email",
        }));
        break;

      case "cardName":
        setErrors((p) => ({
          ...p,
          cardName: validateCardName(value) ? "" : "It must be Full Name.",
        }));
        break;

      case "cardNumber":
        setErrors((p) => ({
          ...p,
          cardNumber: validateCardNumber(value)
            ? ""
            : "Card number must be 14–16 digits.",
        }));
        break;

      case "expiry":
        setErrors((p) => ({
          ...p,
          expiry: validateExpiry(value) ? "" : "Format must be MM/YY",
        }));
        break;

      case "cvc":
        setErrors((p) => ({
          ...p,
          cvc: validateCVC(value) ? "" : "CVC must be 3–4 digits.",
        }));
        break;

      default:
        break;
    }
  };

  // ------- SUBMIT -------
  const handleSubmit = (e) => {
    e.preventDefault();

    const valid =
      validateFullName(formData.fullName) &&
      formData.email.trim().includes("@") &&
      validateCardName(formData.cardName) &&
      validateCardNumber(formData.cardNumber) &&
      validateExpiry(formData.expiry) &&
      validateCVC(formData.cvc);

    if (!valid) {
      alert("Please fill the highlighted fields.");
      return;
    }

    onSubmit({
      ...formData,
      grandTotal,
      shippingFee,
      cartTotal,
    });
  };

  return (
    <div className="checkout-card">
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ marginBottom: 4 }}>🛒 Secure Checkout</h2>
          <p style={{ color: "#475569" }}>Review your details and place your order.</p>
        </div>

        <div
          style={{
            background: "#0f172a",
            color: "white",
            padding: "10px 14px",
            borderRadius: 12,
            textAlign: "right",
          }}
        >
          <div style={{ color: "#cbd5e1", fontSize: "0.8rem" }}>Amount Due</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            ₺{grandTotal.toFixed(2)}
          </div>
        </div>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {/* LEFT SIDE — Shipping Details */}
        <div style={cardBox}>
          <h3>Shipping Details</h3>

          <label>
            Full Name*
            <input
              value={formData.fullName}
              onChange={handleChange("fullName")}
              style={inputStyle}
              placeholder="e.g. Alex Morgan"
            />
            <InputError message={errors.fullName} />
          </label>

          <label>
            Email*
            <input
              value={formData.email}
              onChange={handleChange("email")}
              style={inputStyle}
              placeholder="you@suhome.com"
            />
            <InputError message={errors.email} />
          </label>

          <label>
            Phone
            <input
              value={formData.phone}
              onChange={handleChange("phone")}
              style={inputStyle}
              placeholder="+90 5xx xxx xx xx"
            />
          </label>

          <label>
            Address*
            <textarea
              value={formData.address}
              onChange={handleChange("address")}
              style={{ ...inputStyle, resize: "vertical" }}
              rows={3}
              placeholder="Street, number, district"
            />
          </label>

          <div style={{ display: "flex", gap: 10 }}>
            <label style={{ flex: 1 }}>
              City
              <input
                value={formData.city}
                onChange={handleChange("city")}
                style={inputStyle}
                placeholder="İstanbul"
              />
            </label>

            <label style={{ width: 130 }}>
              Postal Code
              <input
                value={formData.postalCode}
                onChange={handleChange("postalCode")}
                style={inputStyle}
                placeholder="34000"
              />
            </label>
          </div>

          <label>
            Notes
            <input
              value={formData.notes}
              onChange={handleChange("notes")}
              style={inputStyle}
              placeholder="Add note for courier"
            />
          </label>
        </div>

        {/* RIGHT SIDE — Payment */}
        <div style={cardBox}>
          <h3>Payment Details</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {shippingOptions.map((option) => (
              <label
              key={option.id}
              style={{
              flex: 1,
              minWidth: 200,
              border:
              formData.shipping === option.id ? "2px solid #0f172a": "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 12,
              background: formData.shipping === option.id ? "#f8fafc" : "#ffffff",
              cursor: "pointer",
            }}
           >
            <input
              type="radio"
              name="shipping"
              value={option.id}
              checked={formData.shipping === option.id}
              onChange={handleChange("shipping")}
              style={{ marginRight: 8 }}
              />
              <span style={{ fontWeight: 700, color: "#0f172a" }}>
                {option.label}
                </span>
                <div style={{ color: "#475569", fontSize: "0.9rem" }}>
                  ₺{option.fee.toFixed(2)}
                  </div>
                  </label>
                ))}
                </div>

          <label>
            Name on Card*
            <input
              value={formData.cardName}
              onChange={handleChange("cardName")}
              style={inputStyle}
              placeholder="e.g. ALEX MORGAN"
            />
            <InputError message={errors.cardName} />
          </label>

          <label>
            Card Number*
            <input
              value={formData.cardNumber}
              onChange={handleChange("cardNumber")}
              style={inputStyle}
              placeholder="**** **** **** ****"
            />
            <InputError message={errors.cardNumber} />
          </label>

          <label>
            Expiry (MM/YY)*
            <input
              value={formData.expiry}
              onChange={handleChange("expiry")}
              style={inputStyle}
            />
            <InputError message={errors.expiry} />
          </label>

          <label>
            CVC*
            <input
              value={formData.cvc}
              onChange={handleChange("cvc")}
              style={inputStyle}
              placeholder="123"
            />
            <InputError message={errors.cvc} />
          </label>

          <button type="submit" style={submitBtn}>
            Place Order
          </button>
        </div>
      </form>
    </div>
  );
}

const cardBox = {
  background: "white",
  padding: 16,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  marginTop: 6,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  fontSize: "0.95rem",
  background: "#f8fafc",
};

const submitBtn = {
  background: "#facc15",
  color: "#0f172a",
  border: "none",
  borderRadius: 10,
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
  marginTop: 12,
  width: "100%",
  fontSize: "1rem",
};


export default CheckoutForm;


