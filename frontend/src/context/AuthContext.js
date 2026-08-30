import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext(null);

function getGuestId() {
  let guestId = localStorage.getItem("examforge_guest_id");
  if (!guestId) {
    guestId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("examforge_guest_id", guestId);
  }
  return guestId;
}

function makeGuestUser() {
  const guestId = getGuestId();
  return {
    id: guestId,
    name: "Guest Student",
    email: "Guest mode",
    board: "CBSE",
    class: "9",
    roll: "",
    streakDays: 0,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(makeGuestUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem("examforge_token");
    localStorage.removeItem("examforge_user");
  }, []);

  const login = useCallback(async () => {
    throw new Error("Login is disabled in guest mode.");
  }, []);

  const signup = useCallback(async () => {
    throw new Error("Signup is disabled in guest mode.");
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("examforge_token");
    localStorage.removeItem("examforge_user");
    localStorage.removeItem("examforge_guest_id");
    setUser(makeGuestUser());
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
