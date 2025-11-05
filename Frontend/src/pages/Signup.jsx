import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../Context/AuthContext";
import {
  getFirebaseAuth,
  googleProvider,
  facebookProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "../firebase";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import "../styles/Auth.css";

const Signup = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student", // ✅ default role
  });
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  /* ============================================================
     🔄 INPUT HANDLER
  ============================================================ */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  /* ============================================================
     📧 EMAIL + PASSWORD SIGNUP (with verification)
  ============================================================ */
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }

    if (!form.email.endsWith("@gmail.com")) {
      setError("Please use a valid Gmail address.");
      return;
    }

    try {
      const auth = getFirebaseAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      await userCredential.user.sendEmailVerification();
      await updateProfile(userCredential.user, { displayName: form.name });

      alert("📩 Verification email sent! Please verify your Gmail before login.");
      navigate("/login");
    } catch (err) {
      console.error("❌ Signup Error:", err);
      setError(err.message || "Signup failed. Try again.");
    }
  };

  /* ============================================================
     🔵 GOOGLE SIGNUP (with selected role)
  ============================================================ */
  const handleGoogleSignup = async () => {
    try {
      // ✅ Always read latest dropdown value directly
      const selectedRole =
        document.querySelector(".role-dropdown")?.value || "student";

      console.log("🔥 Selected Role before signup:", selectedRole);

      const auth = getFirebaseAuth();
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      // Small delay ensures popup closes fully
      await new Promise((res) => setTimeout(res, 200));

      const res = await api.post(
        "/auth/firebase-login",
        { role: selectedRole },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      console.log("📤 Sent role payload:", { role: selectedRole });
      console.log("📥 Server response:", res.data);

      login(res.data);
      alert(
        `🎉 Welcome ${
          firebaseUser.displayName || firebaseUser.email
        }! You’re signed up as ${
          selectedRole === "owner" ? "Mess Owner" : "Student"
        }.`
      );
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Google Signup Error:", err);
      setError("Google signup failed. Try again.");
    }
  };

  /* ============================================================
     🟦 FACEBOOK SIGNUP (with selected role)
  ============================================================ */
  const handleFacebookSignup = async () => {
    try {
      const selectedRole =
        document.querySelector(".role-dropdown")?.value || "student";

      const auth = getFirebaseAuth();
      const result = await signInWithPopup(auth, facebookProvider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      const res = await api.post(
        "/auth/firebase-login",
        { role: selectedRole },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      login(res.data);
      alert(
        `🎉 Welcome ${
          firebaseUser.displayName || "User"
        }! You’re signed up as ${
          selectedRole === "owner" ? "Mess Owner" : "Student"
        }.`
      );
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Facebook Signup Error:", err);
      setError("Facebook signup failed. Try again.");
    }
  };

  /* ============================================================
     📱 PHONE OTP SIGNUP (with Role)
  ============================================================ */
  const sendOTP = async () => {
    if (!phone || phone.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      const auth = getFirebaseAuth();
      const fullPhone = `+91${phone.trim()}`;

      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => console.log("✅ reCAPTCHA verified"),
        });
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
        setError("Daily OTP limit reached. Try again tomorrow or upgrade your Firebase plan.");
      } else {
        setError("Failed to send OTP. Please try again.");
      }
    }
  };

  const verifyOTP = async () => {
    if (!otp) return alert("Please enter OTP");
    try {
      const result = await window.confirmationResult.confirm(otp);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      const selectedRole =
        document.querySelector(".role-dropdown")?.value || form.role;

      console.log("🔥 Sending role to backend:", selectedRole);

      const res = await api.post(
        "/auth/firebase-login",
        { role: selectedRole },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      login(res.data);
      alert(
        `✅ ${
          selectedRole === "owner" ? "Mess Owner" : "Student"
        } account created successfully!`
      );
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ OTP Verify Error:", err);
      setError("Invalid OTP. Try again.");
    }
  };

  /* ============================================================
     💅 UI SECTION
  ============================================================ */
  return (
    <div className="login-page new-theme">
      {/* LEFT SIDE — BRANDING */}
      <div className="login-left new-gradient">
        <div className="brand-section">
          <img src="/assets/messmate.png" alt="MessMate Logo" className="logo" />
          <h1 className="brand-title">MessMate</h1>
          <p className="brand-tagline">Join the Meal Revolution 🥗</p>
          <img
            src="/assets/food-illustration.png"
            alt="Food Illustration"
            className="illustration"
          />
        </div>
      </div>

      {/* RIGHT SIDE — SIGNUP FORM */}
      <div className="login-right">
        <div className="login-card glass elevate fade-in">
          <h2 className="login-heading">Create Account ✨</h2>
          <p className="subtext">Sign up with your preferred method</p>

          {/* Google Signup */}
          <button onClick={handleGoogleSignup} className="social-btn google">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png"
              alt="Google"
            />
            Sign up with Google
          </button>

          {/* Facebook Signup */}
          <button onClick={handleFacebookSignup} className="social-btn facebook">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png"
              alt="Facebook"
            />
            Sign up with Facebook
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          {/* 📱 Phone OTP Signup */}
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

              {/* ✅ Role Selection */}
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="role-dropdown"
              >
                <option value="student">Student</option>
                <option value="owner">Mess Owner</option>
              </select>

              <button onClick={sendOTP} className="login-btn">
                Send OTP
              </button>
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
              <button onClick={verifyOTP} className="login-btn">
                Verify OTP
              </button>
            </>
          )}

          <div className="divider">
            <span>or</span>
          </div>

          {/* 📧 Email Signup */}
          <form onSubmit={handleSignup} className="login-form">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />

            {/* ✅ Role Selection for Email Signup */}
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="role-dropdown"
            >
              <option value="student">Student</option>
              <option value="owner">Mess Owner</option>
            </select>

            <button type="submit" className="login-btn">
              Create Account
            </button>
          </form>

          {error && <p className="error">{error}</p>}

          <div className="extra-links">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="signup-link">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
