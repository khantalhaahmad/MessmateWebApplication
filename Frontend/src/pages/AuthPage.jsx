import React, { useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../Context/AuthContext";
import Swal from "sweetalert2";
import api from "../services/api";
import {
  getFirebaseAuth,
  googleProvider,
  facebookProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "../firebase";
import { signInWithPopup } from "firebase/auth";
import "../styles/auth.css";

const AuthPage = ({ open, onClose }) => {
  const { login } = useContext(AuthContext);

  // ❌ Drawer closed → kuch render nahi
  if (!open) return null;

  /* ================= STATE ================= */
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  const verifierRef = useRef(null);
  const confirmRef = useRef(null);
  const countdownRef = useRef(null);
  const deadlineRef = useRef(0);

  /* ================= ALERTS ================= */
  const success = (t, x = "") =>
    Swal.fire({ icon: "success", title: t, text: x });

  const error = (t, x = "") =>
    Swal.fire({ icon: "error", title: t, text: x });

  /* ================= CLEANUP ================= */
  const clearVerifier = () => {
    try {
      verifierRef.current?.clear();
    } catch {}
    verifierRef.current = null;
    window.recaptchaVerifier = null;
  };

  useEffect(() => {
    return () => {
      clearInterval(countdownRef.current);
      clearVerifier();
    };
  }, []);

  /* ================= RECAPTCHA ================= */
  const initVerifier = () => {
    const auth = getFirebaseAuth();
    clearVerifier();
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
    verifierRef.current = verifier;
    window.recaptchaVerifier = verifier;
    return verifier;
  };

  /* ================= SEND OTP ================= */
  const sendOTP = async () => {
    const clean = phone.replace(/\D/g, "");
    if (clean.length !== 10)
      return error("Invalid Phone", "Enter valid 10-digit number");

    try {
      const auth = getFirebaseAuth();
      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${clean}`,
        initVerifier()
      );

      confirmRef.current = confirmation;
      setOtpSent(true);
      setOtp("");
      deadlineRef.current = Date.now() + 30_000;
      setTimer(30);

      countdownRef.current = setInterval(() => {
        const remain = Math.max(0, deadlineRef.current - Date.now());
        setTimer(Math.ceil(remain / 1000));
        if (remain <= 0) {
          clearInterval(countdownRef.current);
          setOtpSent(false);
          confirmRef.current = null;
          clearVerifier();
        }
      }, 500);

      success("OTP Sent", "Check your phone");
    } catch (err) {
      console.error(err);
      clearVerifier();
      error("OTP Failed", "Please try again");
    }
  };

  /* ================= VERIFY OTP ================= */
  const verifyOTP = async () => {
    if (!otp || !confirmRef.current) return error("Invalid OTP");

    try {
      const result = await confirmRef.current.confirm(otp);
      const idToken = await result.user.getIdToken();

      const res = await api.post(
        "/auth/firebase-login",
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      login(res.data);
      success("Login Successful");
      onClose();
    } catch (err) {
      console.error(err);
      error("Wrong OTP", "Try again");
    }
  };

  /* ================= SOCIAL LOGIN ================= */
  const socialLogin = async (provider) => {
    try {
      const auth = getFirebaseAuth();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const res = await api.post(
        "/auth/firebase-login",
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      login(res.data);
      success("Login Successful");
      onClose();
    } catch (err) {
      console.error(err);
      error("Login Failed");
    }
  };

  /* ================= UI ================= */
  return (
    <>
      {/* ✅ BACKDROP (click = close) */}
      <div className="auth-backdrop" onClick={onClose} />

      {/* ✅ DRAWER (IMPORTANT: stop click bubbling) */}
      <div
        className="auth-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="auth-header">
          <h2 className="auth-title">Login or Sign up</h2>
          <span className="auth-close" onClick={onClose}>×</span>
        </div>

        {!otpSent ? (
          <>
            <p className="auth-subtext">
              Enter your phone number to continue
            </p>

            <div className="phone-row">
              <span className="country-code">+91</span>
              <input
                className="auth-input"
                type="tel"
                placeholder="Mobile number"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
              />
            </div>

            <button className="auth-btn" onClick={sendOTP}>
              Continue
            </button>

            <div className="auth-divider">or</div>

            <button
              className="social-btn"
              onClick={() => socialLogin(googleProvider)}
            >
              Continue with Google
            </button>

            <button
              className="social-btn"
              onClick={() => socialLogin(facebookProvider)}
            >
              Continue with Facebook
            </button>
          </>
        ) : (
          <>
            <p className="otp-info">
              Enter OTP sent to +91 {phone}
            </p>

            <input
              className="auth-input"
              type="text"
              placeholder={`Enter OTP (${timer}s)`}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <button className="auth-btn" onClick={verifyOTP}>
              Verify OTP
            </button>

            <p className="timer-text">OTP expires in {timer}s</p>
          </>
        )}

        <div id="recaptcha-container" />
      </div>
    </>
  );
};

export default AuthPage;