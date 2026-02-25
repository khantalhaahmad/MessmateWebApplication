import { useState, useEffect } from "react";
import AuthPage from "../pages/AuthPage";

const AuthDrawerProvider = () => {
  const [open, setOpen] = useState(false);

  /* ======================================================
     🔥 GLOBAL AUTH DRAWER HANDLER
     FloatingButtons / Navbar dono isko use karenge
  ====================================================== */
  useEffect(() => {
    window.openAuthDrawer = () => {
      console.log("🟣 AuthDrawerProvider: auth-drawer-open");
      setOpen(true);

      // 🔥 INFORM ALL LISTENERS (FloatingButtons etc.)
      window.dispatchEvent(new CustomEvent("auth-drawer-open"));
    };

    return () => {
      delete window.openAuthDrawer;
    };
  }, []);

  /* ======================================================
     🔥 CLOSE DRAWER
  ====================================================== */
  const closeDrawer = () => {
    console.log("🟢 AuthDrawerProvider: auth-drawer-close");
    setOpen(false);

    // 🔥 INFORM ALL LISTENERS
    window.dispatchEvent(new CustomEvent("auth-drawer-close"));
  };

  return <AuthPage open={open} onClose={closeDrawer} />;
};

export default AuthDrawerProvider;