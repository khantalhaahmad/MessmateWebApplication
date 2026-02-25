// ✅ src/Context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getFirebaseAuth } from "../firebase";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* ============================================================
     🔄 SESSION RESTORE (NO BACKEND CALL HERE ❗)
     - Drawer open hone par koi redirect / blink nahi hoga
     - Sirf localStorage se session uthayega
  ============================================================ */
  useEffect(() => {
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, () => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            ...parsedUser,
            _id: parsedUser._id || parsedUser.id,
          });
          setToken(storedToken);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error("❌ Session restore failed:", err);
        setUser(null);
        setToken(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /* ============================================================
     🔐 LOGIN HANDLER
     - OTP / Google / Facebook / Email → AuthPage se call hota hai
     - Redirect yahin se controlled hota hai
  ============================================================ */
  const login = ({ user, token }) => {
    if (!user || !token) {
      Swal.fire("Error", "Invalid login response", "error");
      return;
    }

    const normalizedUser = {
      ...user,
      _id: user._id || user.id,
    };

    // 💾 Store session
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    localStorage.setItem("token", token);

    setUser(normalizedUser);
    setToken(token);

    // 🔁 Redirect (ONLY after successful login)
    setTimeout(() => {
      if (normalizedUser.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }, 200);
  };

  /* ============================================================
     🚪 LOGOUT HANDLER
     - Firebase + Backend safe
  ============================================================ */
  const logout = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch (err) {
      console.warn("⚠️ Firebase signOut skipped:", err.message);
    }

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setUser(null);
    setToken(null);

    Swal.fire({
      icon: "success",
      title: "Logged out",
      timer: 1000,
      showConfirmButton: false,
    });

    setTimeout(() => {
      navigate("/", { replace: true });
    }, 200);
  };

  /* ============================================================
     🌍 PROVIDER
  ============================================================ */
  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};