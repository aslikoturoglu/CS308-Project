import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  addWishlistItem as addWishlistItemApi,
  fetchWishlist,
  removeWishlistItem as removeWishlistItemApi,
} from "../services/wishlistService";

const WishlistContext = createContext(undefined);
const STORAGE_KEY = "wishlist";

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error("Wishlist storage read failed", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Wishlist storage write failed", error);
    }
  }, [items]);

  const numericUserId = Number(user?.id);
  const canSync = Number.isFinite(numericUserId);

  useEffect(() => {
    if (!canSync) return undefined;
    const controller = new AbortController();

    fetchWishlist(numericUserId, controller.signal)
      .then((serverItems) => {
        const normalized = (serverItems || []).map((item) => ({
          id: item.id ?? item.product_id,
          name: item.name,
          price: item.price,
          image: item.image,
          added_at: item.added_at,
        }));
        setItems((prev) => {
          if (!prev.length) return normalized;
          const merged = [...normalized];
          const seen = new Set(normalized.map((item) => String(item.id)));
          prev.forEach((item) => {
            if (!seen.has(String(item.id))) {
              merged.push(item);
              addWishlistItemApi(numericUserId, item.id).catch(() => {});
            }
          });
          return merged;
        });
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        console.error("Wishlist fetch failed", error);
      });

    return () => controller.abort();
  }, [canSync, numericUserId]);

  const addItem = (product) => {
    setItems((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;
      if (canSync) {
        addWishlistItemApi(numericUserId, product.id).catch((error) => {
          console.error("Wishlist add failed", error);
          setItems((current) => current.filter((item) => item.id !== product.id));
        });
      }
      return [...prev, product];
    });
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (canSync) {
      removeWishlistItemApi(numericUserId, id).catch((error) => {
        console.error("Wishlist remove failed", error);
      });
    }
  };

  const toggleItem = (product) => {
    setItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        if (canSync) {
          removeWishlistItemApi(numericUserId, product.id).catch((error) => {
            console.error("Wishlist remove failed", error);
            setItems((current) => [...current, product]);
          });
        }
        return prev.filter((item) => item.id !== product.id);
      }
      if (canSync) {
        addWishlistItemApi(numericUserId, product.id).catch((error) => {
          console.error("Wishlist add failed", error);
          setItems((current) => current.filter((item) => item.id !== product.id));
        });
      }
      return [...prev, product];
    });
  };

  const inWishlist = (id) => items.some((item) => item.id === id);

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      toggleItem,
      inWishlist,
    }),
    [items]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return ctx;
}
