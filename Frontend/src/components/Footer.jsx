import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaLinkedin,
  FaInstagram,
  FaYoutube,
  FaFacebook,
  FaXTwitter,
} from "react-icons/fa6";
import "./Footer.css";

export default function Footer() {
  const location = useLocation();

  const hideFooterRoutes = [
    "/login",
    "/signup",
    "/dashboard",
    "/admin",
    "/privacy",
    "/security",
    "/terms",
    "/help-support",
    "/report-fraud",
    "/blog",
    "/partner-with-us",
    "/delivery-partners",
    "/delivery-join",
  ];

  const shouldHide = hideFooterRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  if (shouldHide) return null;

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* 🔥 BRAND (FIXED LEFT ALIGN) */}
        <div className="footer-top">
          <div className="footer-brand">
            <img
              src="/assets/messmate.png"
              alt="MessMate Logo"
              className="footer-logo"
            />
            <h2 className="footer-title">MessMate</h2>
          </div>
        </div>

        {/* 📚 GRID */}
        <div className="footer-grid">

          {/* 🍱 For Messes */}
          <div className="footer-column">
            <h4>For Messes</h4>
            <Link to="/partner-with-us">Partner With Us</Link>
            <Link to="#">Apps For You</Link>
          </div>

          {/* 🚴 Delivery */}
          <div className="footer-column">
            <h4>For Delivery Partners</h4>
            <Link to="/delivery-partners">Partner With Us</Link>
            <Link to="/delivery-join">Apps For You</Link>
          </div>

          {/* 🍽️ Restaurants */}
          <div className="footer-column">
            <h4>For Restaurants</h4>
            <Link to="/partner-with-us">Partner With Us</Link>
            <Link to="#">Apps For You</Link>
          </div>

          {/* 📘 Learn */}
          <div className="footer-column">
            <h4>Learn More</h4>
            <Link to="/privacy">Privacy</Link>
            <Link to="/security">Security</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/help-support">Help & Support</Link>
            <Link to="/report-fraud">Report a Fraud</Link>
            <Link to="/blog">Blog</Link>
          </div>

          {/* 🌐 Social */}
          <div className="footer-column social">
            <h4>Social Links</h4>

            <div className="footer-social">
              <a href="https://linkedin.com" target="_blank" rel="noreferrer">
                <FaLinkedin />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                <FaInstagram />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer">
                <FaYoutube />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer">
                <FaFacebook />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer">
                <FaXTwitter />
              </a>
            </div>

            {/* 🔥 ONLY GOOGLE PLAY BUTTON */}
            <div className="footer-apps">
  <a href="#" className="playstore-btn" target="_blank" rel="noreferrer">
    <div className="playstore-icon">
      <img src="/assets/playstore.png" alt="playstore" />
    </div>
    <div className="playstore-text">
      <span>GET IT ON</span>
      <strong>Google Play</strong>
    </div>
  </a>
</div>
          </div>

        </div>

        {/* ⚙️ BOTTOM */}
        <div className="footer-bottom">
          © {new Date().getFullYear()} MessMate™ Ltd. All rights reserved.
        </div>

      </div>
    </footer>
  );
}