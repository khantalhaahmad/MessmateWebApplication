// src/components/Hero.jsx
import React from "react";
import "../styles/Hero.css";
import heroBg from "/assets/campuseat.mp4"; // 🎥 Background video

const HeroSection = () => {
  const scrollToNextSection = () => {
    const nextSection = document.querySelector(".better-food-section");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="messmate-hero-section">
      {/* 🎥 Background Video */}
      <video className="messmate-hero-bg" autoPlay loop muted playsInline>
        <source src={heroBg} type="video/mp4" />
      </video>

      {/* 🌑 Overlay */}
      <div className="messmate-hero-overlay"></div>

      {/* ✨ Centered Content */}
      <div className="messmate-hero-content">
        <h1 className="messmate-hero-title">MessMate</h1>
        <h2 className="messmate-hero-subtitle">#1 Mess Delivery Website</h2>
        <p className="messmate-hero-text">
          Fresh, fast, and hygienic meals made with love — delivered straight
          from your favorite local kitchens.
        </p>
      </div>

      {/* ⬇️ Scroll Down Indicator */}
      <div className="messmate-scroll-down" onClick={scrollToNextSection}>
        <span className="scroll-text">Scroll Down</span>
        <i className="scroll-arrow">↓</i>
      </div>
    </section>
  );
};

export default HeroSection;
