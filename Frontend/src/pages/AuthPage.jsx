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
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import "../styles/auth.css";

const AuthPage = ({ open, onClose }) => {
  const { login } = useContext(AuthContext);
  if (!open) return null;

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  const verifierRef = useRef(null);
  const confirmRef = useRef(null);
  const countdownRef = useRef(null);
  const deadlineRef = useRef(0);

  const success = (t, x = "") =>
    Swal.fire({ icon: "success", title: t, text: x });

  const error = (t, x = "") =>
    Swal.fire({ icon: "error", title: t, text: x });

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

  const sendOTP = async () => {
    if (phone.length !== 10)
      return error("Invalid Phone", "Enter valid 10-digit number");

    try {
      const auth = getFirebaseAuth();
      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        initVerifier()
      );

      confirmRef.current = confirmation;
      setOtpSent(true);
      deadlineRef.current = Date.now() + 30000;
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

      success("OTP Sent");
    } catch {
      clearVerifier();
      error("OTP Failed");
    }
  };

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
    } catch {
      error("Wrong OTP");
    }
  };

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
    } catch {
      error("Login Failed");
    }
  };

  return (
    <>
      <div className="auth-backdrop" onClick={onClose} />

      <div className="auth-drawer" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="auth-header">
          <button className="auth-close-btn" onClick={onClose}>
            ×
          </button>

          <div className="auth-header-content">
            <h2 className="auth-title">Login</h2>

            <div className="auth-logo">
              <img src="/assets/messmate.png" alt="MessMate" />
            </div>
          </div>
        </div>

        {!otpSent ? (
          <>
            {/* Phone input – single closed box */}
            <div className="phone-input">
              <span>+91</span>
              <input
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

            <div className="or-divider">
              <span>or</span>
            </div>

            <button
              className="social-btn"
              onClick={() => socialLogin(googleProvider)}
            >
              <FcGoogle size={20} />
              Continue with Google
            </button>

            <button
              className="social-btn facebook"
              onClick={() => socialLogin(facebookProvider)}
            >
              <FaFacebook size={18} />
              Continue with Facebook
            </button>
          </>
        ) : (
          <>
            <p className="auth-subtext">Enter OTP sent to +91 {phone}</p>

            <input
              className="auth-input"
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