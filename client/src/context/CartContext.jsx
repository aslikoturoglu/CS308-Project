import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { getOrCreateClientToken } from "../utils/storage";
import { fetchCart, syncCartItems } from "../services/cartService";

const CartContext = createContext(undefined);
const STORAGE_KEY = "cart";
const GUEST_TOKEN_KEY = "cart-guest-token";

const storageKeyFor = (token) =>
  token ? `${STORAGE_KEY}:${token}` : STORAGE_KEY;

const readCart = (token) => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(storageKeyFor(token));
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Cart storage read failed", error);
    return [];
  }
};

const writeCart = (token, value) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKeyFor(token), JSON.stringify(value));
  } catch (error) {
    console.error("Cart storage write failed", error);
  }
};

const normalizeItems = (apiItems = []) =>
  apiItems.map((row) => {
    const productId = row.product_id ?? row.id;
    const quantity = Number(row.quantity ?? row.qty ?? 1);
    const price = Number(row.price ?? row.unit_price ?? row.product_price ?? 0);
    return {
      id: productId,
      productId,
      cartItemId: row.id ?? row.cart_item_id,
      name: row.name ?? row.product_name,
      price,
      quantity,
      image: row.image ?? row.product_image,
      availableStock: Number(row.availableStock ?? row.stock ?? row.product_stock ?? 0),
      stock: Number(row.stock ?? row.product_stock ?? 0),
      line_total: row.line_total ?? price * quantity,
    };
  });

const toSyncPayload = (items) =>
  items
    .map((item) => ({
      product_id: item.productId ?? item.id,
      quantity: Number(item.quantity ?? item.qty ?? 1),
    }))
    .filter(
      (row) =>
        row.product_id &&
        Number.isFinite(row.quantity) &&
        row.quantity > 0
    );

const buildCartToken = (user) =>
  user ? `user-${user.id ?? user.email}` : getOrCreateClientToken(GUEST_TOKEN_KEY);

export function CartProvider({ children }) {
  const { user } = useAuth();

  const [cartToken, setCartToken] = useState(() => buildCartToken(user));
  const [items, setItems] = useState(() => readCart(cartToken));

  const syncRef = useRef(Promise.resolve());
  const prevTokenRef = useRef(cartToken);

  useEffect(() => {
    setCartToken(buildCartToken(user));
  }, [user]);

  useEffect(() => {
    if (!cartToken) return;

    // Token değiştiğinde eldeki item'ları yeni token'a taşı
    if (prevTokenRef.current && prevTokenRef.current !== cartToken) {
      if (items.length > 0) {
        writeCart(cartToken, items);
        syncToBackend(items);
      }
    }
    prevTokenRef.current = cartToken;
  }, [cartToken]);

  useEffect(() => {
    if (!cartToken) return;
    let cancelled = false;

    fetchCart(cartToken)
      .then((data) => {
        if (cancelled) return;
        const normalized = normalizeItems(data.items ?? data ?? []);
        setItems(normalized);
        writeCart(cartToken, normalized);
      })
      .catch((error) => {
        console.error("Cart fetch failed, using local fallback", error);
        const local = readCart(cartToken);
        setItems(local);
        writeCart(cartToken, local);
      });

    return () => {
      cancelled = true;
    };
  }, [cartToken]);

  const syncToBackend = (nextItems) => {
    if (!cartToken) return;
    const payload = toSyncPayload(nextItems);
    syncRef.current = syncRef.current
      .catch(() => undefined)
      .then(async () => {
        try {
          await syncCartItems({ token: cartToken, items: payload });
          const refreshed = await fetchCart(cartToken);
          const normalized = normalizeItems(refreshed.items ?? refreshed ?? []);
          setItems(normalized);
          writeCart(cartToken, normalized);
        } catch (error) {
          console.error("Cart sync failed", error);
        }
      });
  };

  const applyAndSync = (updater) => {
    setItems((prev) => {
      const next = updater(prev);
      writeCart(cartToken, next);
      syncToBackend(next);
      return next;
    });
  };

  // === Cart operations ===

  const addItem = (product, quantity = 1) => {
    const qty = Math.max(1, Number(quantity) || 1);

    applyAndSync((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: (Number(item.quantity) || 0) + qty }
            : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          id: product.id,
          productId: product.id,
          quantity: qty,
        },
      ];
    });
  };

  const removeItem = (id) =>
    applyAndSync((prev) => prev.filter((item) => item.id !== id));

  const increment = (id) =>
    applyAndSync((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: (Number(item.quantity) || 0) + 1 }
          : item
      )
    );

  const decrement = (id) =>
    applyAndSync((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, (Number(item.quantity) || 0) - 1) }
            : item
        )
        .filter((item) => (Number(item.quantity) || 0) > 0)
    );

  const clearCart = () => applyAndSync(() => []);

  const itemCount = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + (Number(item.quantity) || Number(item.qty) || 0),
        0
      ),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
            (Number(item.quantity) || Number(item.qty) || 0),
        0
      ),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      subtotal,
      itemCount,
      addItem,
      removeItem,
      increment,
      decrement,
      clearCart,
    }),
    [items, subtotal, itemCount]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
