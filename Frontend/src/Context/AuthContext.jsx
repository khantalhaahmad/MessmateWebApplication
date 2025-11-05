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
     🔄 SYNC FIREBASE LOGIN STATE + LOCAL STORAGE FALLBACK
  ============================================================ */
  useEffect(() => {
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // ✅ Firebase user detected
          const firebaseToken = await firebaseUser.getIdToken();

          setUser({
            name: firebaseUser.displayName || firebaseUser.email,
            email: firebaseUser.email,
            uid: firebaseUser.uid,
            role: "student", // default; backend role overrides this
          });
          setToken(firebaseToken);
        } else {
          // ✅ Fallback: backend login (saved in localStorage)
          const storedUser = localStorage.getItem("user");
          const storedToken = localStorage.getItem("token");

          if (storedUser && storedToken) {
            const parsedUser = JSON.parse(storedUser);
            const normalizedUser = {
              ...parsedUser,
              _id: parsedUser._id || parsedUser.id,
            };
            setUser(normalizedUser);
            setToken(storedToken);
          } else {
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        console.error("Auth sync failed:", err);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /* ============================================================
     🔐 BACKEND LOGIN HANDLER
  ============================================================ */
  const login = ({ user, token }) => {
    if (!user || !token) {
      Swal.fire("Error", "Invalid credentials provided.", "error");
      return;
    }

    const normalizedUser = { ...user, _id: user._id || user.id };

    // Store session
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    localStorage.setItem("token", token);

    // Update context
    setUser(normalizedUser);
    setToken(token);

    // ✅ Redirect based on role
    setTimeout(() => {
      if (normalizedUser.role === "admin") navigate("/admin/dashboard");
      else navigate("/dashboard");
    }, 300);
  };

  /* ============================================================
     🚪 LOGOUT HANDLER (Firebase + Backend Safe)
  ============================================================ */
  const logout = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch (err) {
      console.warn(
        "⚠️ Firebase signOut failed (probably non-Firebase user):",
        err.message
      );
    }

    // Clear local data
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setUser(null);
    setToken(null);

    Swal.fire({
      icon: "success",
      title: "Logged out successfully",
      showConfirmButton: false,
      timer: 1000,
    });

    // Small delay before navigation to avoid race conditions
    setTimeout(() => {
      navigate("/", { replace: true });
    }, 200);
  };

  /* ============================================================
     🌍 CONTEXT PROVIDER
  ============================================================ */
  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
