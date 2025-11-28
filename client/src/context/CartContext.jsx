import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(undefined);
const STORAGE_KEY = "cart";

const buildKey = (user) => (user ? `${STORAGE_KEY}:${user.id ?? user.email}` : STORAGE_KEY);

const readCart = (key) => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Cart storage read failed", error);
    return [];
  }
};

const writeCart = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Cart storage write failed", error);
  }
};

const mergeCarts = (userCart, guestCart) => {
  const map = new Map();
  [...userCart, ...guestCart].forEach((item) => {
    const existing = map.get(item.id);
    if (existing) {
      map.set(item.id, { ...existing, quantity: (existing.quantity || 0) + (item.quantity || 0) });
    } else {
      map.set(item.id, { ...item });
    }
  });
  return Array.from(map.values());
};

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState(() => readCart(STORAGE_KEY));

  // Persist cart when items change
  useEffect(() => {
    const key = buildKey(user);
    writeCart(key, items);
  }, [items, user]);

  // When user logs in, merge guest cart into user cart and clear guest cart
  useEffect(() => {
    if (!user) {
      setItems(readCart(STORAGE_KEY));
      return;
    }
    const guestCart = readCart(STORAGE_KEY);
    const userKey = buildKey(user);
    const userCart = readCart(userKey);
    const merged = mergeCarts(userCart, guestCart);
    setItems(merged);
    writeCart(userKey, merged);
    writeCart(STORAGE_KEY, []); // clear guest cart
  }, [user]);

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeItem = (id) => setItems((prev) => prev.filter((item) => item.id !== id));

  const increment = (id) =>
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );

  const decrement = (id) =>
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
        )
        .filter((item) => item.quantity > 0)
    );

  const clearCart = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      subtotal,
      addItem,
      removeItem,
      increment,
      decrement,
      clearCart,
    }),
    [items, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
