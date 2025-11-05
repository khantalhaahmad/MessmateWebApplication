import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../Context/AuthContext";
import Swal from "sweetalert2";
import "animate.css";
import {
  getFirebaseAuth,
  googleProvider,
  facebookProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "../firebase";
import { signInWithPopup } from "firebase/auth";
import "../styles/auth.css";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useContext(AuthContext);
  const from = location.state?.from?.pathname || "/dashboard";

  // Shared states
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student"); // ✅ Added role selection state

  // OTP/UI states
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const countdownRef = useRef(null);
  const verifierRef = useRef(null);
  const confirmRef = useRef(null);
  const deadlineRef = useRef(0);

  // ---------- Redirect if already logged in ----------
  useEffect(() => {
    if (user?.role) {
      if (user.role === "admin") navigate("/admin/dashboard", { replace: true });
      else navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // ---------- SweetAlert helpers ----------
  const showSuccess = (title, text = "") =>
    Swal.fire({
      title,
      text,
      icon: "success",
      background: "#fff",
      color: "#333",
      confirmButtonColor: "#6c63ff",
    });

  const showError = (title, text = "") =>
    Swal.fire({
      title,
      text,
      icon: "error",
      background: "#fff",
      color: "#333",
      confirmButtonColor: "#6c63ff",
    });

  // ---------- EMAIL + PASSWORD LOGIN ----------
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password)
      return showError("Missing Fields", "Enter both email and password.");

    try {
      const identifier = String(email).trim().toLowerCase();
      const res = await api.post("/auth/login", { identifier, password });
      if (!res.data?.success) throw new Error(res.data?.message || "Login failed");

      login(res.data);
      await showSuccess("Welcome Back!", "You’ve successfully logged in.");
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Email Login Error:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Invalid email or password.";
      showError("Login Failed", msg);
    }
  };

  // ---------- SOCIAL LOGIN (Google / Facebook) ----------
  const handleGoogle = async () => {
    try {
      const auth = getFirebaseAuth();
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await api.post(
        "/auth/firebase-login",
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      login(res.data);
      await showSuccess(`Welcome, ${result.user.displayName || result.user.email}!`);
      navigate("/dashboard");
    } catch (err) {
      console.error("Google Auth Error:", err);
      showError("Google Login Failed");
    }
  };

  const handleFacebook = async () => {
    try {
      const auth = getFirebaseAuth();
      const result = await signInWithPopup(auth, facebookProvider);
      const idToken = await result.user.getIdToken();
      const res = await api.post(
        "/auth/firebase-login",
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      login(res.data);
      await showSuccess(`Welcome, ${result.user.displayName || "User"}!`);
      navigate("/dashboard");
    } catch (err) {
      console.error("Facebook Auth Error:", err);
      showError("Facebook Login Failed");
    }
  };

  // ---------- OTP Section ----------
  const clearVerifier = () => {
    try {
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
      }
    } catch (_) {}
    window.recaptchaVerifier = null;
  };

  const initVerifier = (containerId) => {
    const auth = getFirebaseAuth();
    clearVerifier();
    const v = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
    verifierRef.current = v;
    window.recaptchaVerifier = v;
    return v;
  };

  const sendOTP = async () => {
    const clean = (phone || "").replace(/\D/g, "");
    if (clean.length !== 10)
      return showError("Invalid Phone", "Enter a valid 10-digit phone number.");

    try {
      const auth = getFirebaseAuth();
      const fullPhone = `+91${clean}`;
      const containerId = isSignUp ? "recaptcha-signup" : "recaptcha-login";

      const appVerifier = initVerifier(containerId);
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, appVerifier);

      confirmRef.current = confirmation;
      setOtp("");
      setOtpSent(true);
      deadlineRef.current = Date.now() + 30_000;
      setTimer(30);

      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        const remaining = Math.max(0, deadlineRef.current - Date.now());
        const secs = Math.ceil(remaining / 1000);
        setTimer(secs);
        if (remaining <= 0) {
          clearInterval(countdownRef.current);
          setOtpSent(false);
          confirmRef.current = null;
          clearVerifier();
          showError("⏰ OTP Expired", "Please request a new OTP.");
        }
      }, 500);

      await showSuccess("OTP Sent ✅", "Check your phone for the code.");
    } catch (err) {
      console.error("OTP Send Error:", err);
      clearVerifier();
      showError("Failed to Send OTP");
    }
  };

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      clearVerifier();
    };
  }, []);

  const verifyOTP = async () => {
    if (!otp) return showError("Missing OTP");
    if (!confirmRef.current) return showError("OTP Session Expired");

    try {
      const result = await confirmRef.current.confirm(otp);
      const firebaseUser = result?.user;
      if (!firebaseUser?.uid) throw new Error("Invalid Firebase user");

      const idToken = await firebaseUser.getIdToken();

      // ✅ Send role to backend
      const res = await api.post(
        "/auth/firebase-login",
        { role },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      login(res.data);
      if (countdownRef.current) clearInterval(countdownRef.current);
      clearVerifier();
      confirmRef.current = null;
      setOtpSent(false);

      await showSuccess("Phone Verified 📱", "Welcome to MessMate!");
      navigate("/dashboard");
    } catch (err) {
      console.error("OTP Verify Error:", err);
      showError("Invalid OTP", "Please try again.");
    }
  };

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
  };

  const otpPlaceholder = `Enter OTP (${timer || 0}s left)`;

  // ---------- UI ----------
  return (
    <div className={`auth-container ${isSignUp ? "sign-up-mode" : ""}`}>
      {/* ---------- LOGIN FORM ---------- */}
      <div className="form-container sign-in-container">
        <form onSubmit={handleEmailLogin}>
          <h1>Welcome Back to MessMate!</h1>

          <div className="social-container">
            <button type="button" onClick={handleGoogle}>
              <img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" alt="Google" />
            </button>
            <button type="button" onClick={handleFacebook}>
              <img src="https://cdn-icons-png.flaticon.com/512/5968/5968764.png" alt="Facebook" />
            </button>
          </div>

          <span>Login via Email, Google, Facebook, or Phone</span>

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="auth-btn">
            Login
          </button>

          <div className="divider">or</div>

          <div className="phone-input">
            <span className="country-code">+91</span>
            <input
              type="tel"
              placeholder="10-digit Phone"
              value={phone}
              onChange={handlePhoneChange}
            />
          </div>
          {!otpSent ? (
            <button type="button" className="auth-btn" onClick={sendOTP}>
              Login via OTP
            </button>
          ) : (
            <>
              <input
                type="text"
                placeholder={otpPlaceholder}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button type="button" className="auth-btn" onClick={verifyOTP}>
                Verify OTP
              </button>
              <p className="timer-text">⏱ OTP expires in {timer}s</p>
            </>
          )}
          <div id="recaptcha-login" />
        </form>
      </div>

      {/* ---------- SIGN UP FORM ---------- */}
      <div className="form-container sign-up-container">
        <form onSubmit={(e) => e.preventDefault()}>
          <h1>Join the MessMate Family</h1>

          <div className="social-container">
            <button type="button" onClick={handleGoogle}>
              <img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" alt="Google" />
            </button>
            <button type="button" onClick={handleFacebook}>
              <img src="https://cdn-icons-png.flaticon.com/512/5968/5968764.png" alt="Facebook" />
            </button>
          </div>

          <span>or continue with your phone number</span>

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="phone-input">
            <span className="country-code">+91</span>
            <input
              type="tel"
              placeholder="10-digit Phone"
              value={phone}
              onChange={handlePhoneChange}
            />
          </div>

          {/* ✅ Role Dropdown */}
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="role-dropdown"
          >
            <option value="student">Student</option>
            <option value="owner">Mess Owner</option>
          </select>

          {!otpSent ? (
            <button type="button" className="auth-btn" onClick={sendOTP}>
              Signup via OTP
            </button>
          ) : (
            <>
              <input
                type="text"
                placeholder={otpPlaceholder}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button type="button" className="auth-btn" onClick={verifyOTP}>
                Verify OTP
              </button>
              <p className="timer-text">⏱ OTP expires in {timer}s</p>
            </>
          )}

          <div id="recaptcha-signup" />
        </form>
      </div>

      {/* ---------- OVERLAY ---------- */}
      <div className="overlay-container">
        <div className="overlay">
          <div className="overlay-panel overlay-left">
            <h1>Already a MessMate?</h1>
            <p>Sign in to manage your meals or mess details.</p>
            <button className="ghost" onClick={() => setIsSignUp(false)}>
              Login
            </button>
          </div>
          <div className="overlay-panel overlay-right">
            <h1>Welcome to MessMate!</h1>
            <p>Discover affordable, tasty messes near your college or hostel.</p>
            <button className="ghost" onClick={() => setIsSignUp(true)}>
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
