export function applyDiscount(price, discount, type = "percent") {
    if (typeof price !== "number" || typeof discount !== "number") return null;
    if (price < 0) return null;
  
    if (type === "percent") {
      if (discount < 0 || discount > 100) return null;
      const result = price * (1 - discount / 100);
      return Math.max(0, Math.round(result * 100) / 100);
    }
  
    if (type === "flat") {
      if (discount < 0) return null;
      const result = price - discount;
      return Math.max(0, Math.round(result * 100) / 100);
    }
  
    return null;
  }
  