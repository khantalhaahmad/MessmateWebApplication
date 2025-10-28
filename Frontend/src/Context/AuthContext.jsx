import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        const parsed = JSON.parse(storedUser);
        // ✅ Normalize user so _id always exists
        const normalizedUser = { ...parsed, _id: parsed._id || parsed.id };
        setUser(normalizedUser);
        setToken(storedToken);
      }
    } catch (err) {
      console.error("❌ Error loading user from storage:", err);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = ({ user, token }) => {
    if (!user || !token) return Swal.fire("Error", "Invalid credentials", "error");

    // ✅ Normalize _id when saving to localStorage
    const normalizedUser = { ...user, _id: user._id || user.id };
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    localStorage.setItem("token", token);
    setUser(normalizedUser);
    setToken(token);

    setTimeout(() => {
      if (normalizedUser.role === "admin") navigate("/admin/dashboard");
      else navigate("/dashboard");
    }, 300);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
