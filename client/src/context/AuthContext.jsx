import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(undefined);
const STORAGE_KEY = "auth-user";

const readUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Auth read failed", error);
    return null;
  }
};

const writeUser = (user) => {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error("Auth write failed", error);
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readUser());

  useEffect(() => {
    writeUser(user);
  }, [user]);

  const login = (payload) => {
    const nextUser = { id: payload.id ?? payload.email, email: payload.email, name: payload.name ?? "User" };
    setUser(nextUser);
  };

  const logout = () => setUser(null);

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
