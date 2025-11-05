import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../Context/AuthContext";
import {
  getFirebaseAuth,
  googleProvider,
  facebookProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "../firebase";
import { signInWithPopup } from "firebase/auth";
import "../styles/Auth.css";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useContext(AuthContext);

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (user?.role) {
      if (user.role === "admin") navigate("/admin/dashboard", { replace: true });
      else navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  /* ============================================================
     🔵 GOOGLE LOGIN
  ============================================================ */
  const handleGoogleLogin = async () => {
    try {
      const auth = getFirebaseAuth();
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const idToken = await firebaseUser.getIdToken();
      const res = await api.post(
        "/auth/firebase-login",
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      login(res.data);
      alert(`🎉 Welcome ${firebaseUser.displayName || firebaseUser.email}!`);
      navigate("/dashboard");
    } catch (err) {
      console.error("Google Login Error:", err);
      setError("Google login failed. Try again.");
    }
  };

  /* ============================================================
     🟦 FACEBOOK LOGIN
  ============================================================ */
  const handleFacebookLogin = async () => {
    try {
      const auth = getFirebaseAuth();
      const result = await signInWithPopup(auth, facebookProvider);
      const firebaseUser = result.user;

      const idToken = await firebaseUser.getIdToken();
      const res = await api.post(
        "/auth/firebase-login",
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      login(res.data);
      alert(`🎉 Welcome ${firebaseUser.displayName || "User"}!`);
      navigate("/dashboard");
    } catch (err) {
      console.error("Facebook Login Error:", err);
      setError("Facebook login failed. Try again.");
    }
  };

  /* ============================================================
     📱 PHONE OTP LOGIN (+91 fixed prefix)
  ============================================================ */
  const sendOTP = async () => {
    if (!phone || phone.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      const auth = getFirebaseAuth();
      const fullPhone = `+91${phone.trim()}`;

      // ✅ Initialize invisible reCAPTCHA safely
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          "recaptcha-container",
          {
            size: "invisible",
            callback: () => console.log("reCAPTCHA verified ✅"),
          },
          auth
        );
      }

      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
      window.confirmationResult = confirmation;
      setOtpSent(true);
      alert("✅ OTP sent successfully!");
    } catch (err) {
      console.error("❌ OTP Send Error:", err);
      if (err.code === "auth/too-many-requests") {
        setError("Too many OTP requests. Try again later.");
      } else if (err.code === "auth/quota-exceeded") {
        setError("Daily OTP limit reached. Try tomorrow or upgrade your plan.");
      } else {
        setError(err.message || "Failed to send OTP. Please try again.");
      }
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      alert("Please enter the OTP.");
      return;
    }

    try {
      const result = await window.confirmationResult.confirm(otp);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      const res = await api.post(
        "/auth/firebase-login",
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      login(res.data);
      alert("✅ Phone verified successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ OTP Verify Error:", err);
      setError("Invalid OTP. Please try again.");
    }
  };

  /* ============================================================
   📧 EMAIL + PASSWORD LOGIN (with verification check)
============================================================ */
const handleEmailLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await api.post("/auth/login", { identifier, password });
    const { user, token } = res.data;

    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;

    if (currentUser && !currentUser.emailVerified) {
      alert("⚠️ Please verify your Gmail before logging in.");
      return;
    }

    login({ user, token });
    alert(`Welcome back, ${user.name}!`);
    navigate("/dashboard");
  } catch (err) {
    console.error("Login Error:", err);
    setError("Login failed. Try again.");
  }
};


  /* ============================================================
     💅 UI
  ============================================================ */
  return (
    <div className="login-page new-theme">
      {/* LEFT SIDE — BRANDING */}
      <div className="login-left new-gradient">
        <div className="brand-section">
          <img src="/assets/messmate.png" alt="MessMate Logo" className="logo" />
          <h1 className="brand-title">MessMate</h1>
          <p className="brand-tagline">Delivering Health, Taste & Trust 🥗</p>
          <img
            src="/assets/food-illustration.png"
            alt="Food illustration"
            className="illustration"
          />
        </div>
      </div>

      {/* RIGHT SIDE — LOGIN CARD */}
      <div className="login-right">
        <div className="login-card glass elevate fade-in">
          <h2 className="login-heading">Welcome Back 👋</h2>
          <p className="subtext">Login with your favorite method</p>

          {/* 🔵 Google Login */}
          <button className="social-btn google" onClick={handleGoogleLogin}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png"
              alt="Google"
            />
            Continue with Google
          </button>

          {/* 🟦 Facebook Login */}
          <button className="social-btn facebook" onClick={handleFacebookLogin}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png"
              alt="Facebook"
            />
            Continue with Facebook
          </button>

          <div className="divider"><span>or</span></div>

          {/* 📱 PHONE OTP LOGIN */}
          {!otpSent ? (
            <>
              <div className="phone-input">
                <span className="country-code">+91</span>
                <input
                  type="tel"
                  placeholder="Enter Mobile Number"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhone(val);
                  }}
                />
              </div>
              <button onClick={sendOTP} className="login-btn">Send OTP</button>
              <div id="recaptcha-container"></div>
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button onClick={verifyOTP} className="login-btn">Verify OTP</button>
            </>
          )}

          <div className="divider"><span>or</span></div>

          {/* 📧 EMAIL / PASSWORD LOGIN */}
          <form onSubmit={handleEmailLogin} className="login-form">
            <input
              type="text"
              placeholder="Email or Username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="login-btn">Login</button>
          </form>

          {error && <p className="error">{error}</p>}

          <div className="extra-links">
            <p>
              Don’t have an account?{" "}
              <Link to="/signup" className="signup-link">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
