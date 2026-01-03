import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/payment-flow.css";

const formatAmount = (value) => {
  const amount = Number(value || 0);
  return amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function PaymentBank() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const [smsCode, setSmsCode] = useState("");
  const [error, setError] = useState("");

  const maskedDigits = useMemo(() => {
    const digits = String(state.shippingDetails?.phone || "").replace(/\D/g, "");
    return digits ? `******${digits.slice(-4)}` : "******6655";
  }, [state.shippingDetails?.phone]);

  const handleApprove = () => {
    if (!smsCode.trim()) {
      setError("SMS code is required.");
      return;
    }
    setError("");
    navigate("/payment-bank-result", {
      replace: true,
      state: {
        ...state,
        smsCode: smsCode.trim(),
      },
    });
  };

  if (!state.orderId) {
    return (
      <section className="payment-flow payment-flow--empty">
        <div className="payment-flow__empty-card">
          <h2>Payment step not found</h2>
          <p>Please return to checkout to complete your payment.</p>
          <Link to="/checkout" className="payment-btn payment-btn--primary">
            Back to checkout
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="payment-flow">
      <header className="payment-flow__header">
        <div>
          <h1>Bank Approval</h1>
          <p>Enter the SMS code to finalize your payment.</p>
        </div>
        <Link to="/payment-details" className="payment-flow__back">
          ← Back to details
        </Link>
      </header>

      <div className="payment-flow__grid">
        <article className="payment-card payment-card--bank">
          <div className="payment-card__bank-header">
            <span>BANKSECURE</span>
            <small>PAYMENT SYSTEM</small>
          </div>
          <h3>SUHOME Online Store</h3>
          <p className="payment-card__amount">
            Amount: <strong>₺{formatAmount(state.amount)}</strong>
          </p>
          <p className="payment-card__note">
            Enter the SMS code sent to the phone number ending with {maskedDigits}.
          </p>
          <div className="payment-card__input">
            <input
              type="text"
              inputMode="numeric"
              placeholder="SMS code"
              value={smsCode}
              onChange={(event) => setSmsCode(event.target.value)}
            />
          </div>
          {error && <div className="payment-card__error">{error}</div>}
          <button type="button" className="payment-btn payment-btn--success" onClick={handleApprove}>
            Approve Payment
          </button>
          <Link to="/payment-details" className="payment-btn payment-btn--ghost">
            Cancel
          </Link>
        </article>
      </div>
    </section>
  );
}

export default PaymentBank;
