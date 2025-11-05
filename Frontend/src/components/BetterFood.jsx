import React from "react";
import "./BetterFood.css";

const BetterFood = () => {
  return (
    <section className="better-food-section">
      {/* Background Curve */}
      <img src="/assets/curve.png" alt="curve line" className="curve-bg" />

      {/* Centered Hero Text */}
      <div className="better-food-content">
        <h1>
          Better food <br /> for more people
        </h1>
        <p>
          At MessMate, we connect you with the best local messes and tiffin services — 
          tasty, affordable, and right at your doorstep.
        </p>
      </div>

      {/* Floating Food Images */}
      <div className="floating-images">
        <img src="/assets/burger.png" alt="Burger" className="floating-img burger" />
        <img src="/assets/vegthali2.png" alt="Thali" className="floating-img noodles" />
        <img src="/assets/biryani.png" alt="Biryani" className="floating-img biryani" />

        {/* 🍅 Leaves & Tomatoes */}
        <img src="/assets/tomato.png" alt="Tomato" className="floating-img tomato t1" />
        <img src="/assets/leaf.png" alt="Leaf" className="floating-img leaf l1" />
        <img src="/assets/tomato.png" alt="Tomato" className="floating-img tomato t2" />
        <img src="/assets/leaf.png" alt="Leaf" className="floating-img leaf l2" />
        <img src="/assets/tomato.png" alt="Tomato" className="floating-img tomato t3" />
        <img src="/assets/leaf.png" alt="Leaf" className="floating-img leaf l3" />
      </div>

      {/* Stats Section — pinned to bottom */}
      <div className="betterfood-stats-wrapper">
        <div className="stats-container">
          <div className="stat-box">
            <img src="/assets/messicon.png" alt="Mess Icon" className="stat-icon" />
            <h2>100+ curated messes</h2>
            <p>Handpicked local kitchens serving fresh home-style food</p>
          </div>

          <div className="stat-box">
            <img src="/assets/mealicon.png" alt="Meal Icon" className="stat-icon" />
            <h2>1,000+ meals served</h2>
            <p>Hygienic, tasty, and affordable meals delivered daily</p>
          </div>

          <div className="stat-box">
            <img src="/assets/rating.png" alt="Rating Icon" className="stat-icon" />
            <h2>4.5★ rated</h2>
            <p>Loved by thousands of students and professionals</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BetterFood;
