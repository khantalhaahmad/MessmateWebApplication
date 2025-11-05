import React from "react";
import "../styles/Hero.css";
import heroBg from "/assets/campuseat.mp4";

const HeroSection = () => {
  const scrollToNextSection = () => {
    const nextSection = document.querySelector(".better-food-section");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="messmate-hero-section">
      <video className="messmate-hero-bg" autoPlay loop muted playsInline>
        <source src={heroBg} type="video/mp4" />
      </video>

      <div className="messmate-hero-overlay" />
      <div className="messmate-hero-content">
        <h1 className="messmate-hero-title">MessMate</h1>
        <h2 className="messmate-hero-subtitle">#1 Mess Delivery Website</h2>
        <p className="messmate-hero-text">
          Fresh, fast, and hygienic meals made with love — delivered straight from your favorite local kitchens.
        </p>
      </div>

      <div className="messmate-scroll-down" onClick={scrollToNextSection}>
        <span className="scroll-text">Scroll Down</span>
        <i className="scroll-arrow">↓</i>
      </div>
    </section>
  );
};

export default HeroSection;
