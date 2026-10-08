/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("adminToken"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("adminUser");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("adminToken");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      setToken(storedToken);

      try {
        const res = await authService.getProfile(); // { success, data: user }
        setUser(res.data);
        localStorage.setItem("adminUser", JSON.stringify(res.data));
      } catch (e) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password); // { success, data: { token, user } }
    const newToken = res?.data?.token;
    const newUser = res?.data?.user;

    localStorage.setItem("adminToken", newToken);
    localStorage.setItem("adminUser", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    return res;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {}
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  // ✅ Auth extra actions for pages
  const forgotPassword = (email) => authService.forgotPassword(email);
  const resetPassword = (token, newPassword) => authService.resetPassword(token, newPassword);
  const verifyEmail = (token) => authService.verifyEmail(token);
  const resendVerification = (email) => authService.resendVerification(email);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      logout,
      forgotPassword,
      resetPassword,
      verifyEmail,
      resendVerification,
      isLoggedIn: !!token,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
