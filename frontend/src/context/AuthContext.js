import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("examforge_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("examforge_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ user: freshUser }) => {
        setUser(freshUser);
        localStorage.setItem("examforge_user", JSON.stringify(freshUser));
      })
      .catch(() => {
        localStorage.removeItem("examforge_token");
        localStorage.removeItem("examforge_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: u } = await authApi.login({ email, password });
    localStorage.setItem("examforge_token", token);
    localStorage.setItem("examforge_user", JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (payload) => {
    const { token, user: u } = await authApi.signup(payload);
    localStorage.setItem("examforge_token", token);
    localStorage.setItem("examforge_user", JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("examforge_token");
    localStorage.removeItem("examforge_user");
    setUser(null);
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
