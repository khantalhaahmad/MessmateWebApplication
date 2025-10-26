import React from "react";
import "./BetterFood.css";

const BetterFood = () => {
  return (
    <section className="better-food-section">
      {/* Background Curve */}
      <img src="/assets/curve.png" alt="curve line" className="curve-bg" />

      {/* Centered Text */}
      <div className="better-food-content">
        <h1>
          Better food <br /> for more people
        </h1>
        <p>
          For over a decade, we’ve enabled our customers to discover new tastes,
          delivered right to their doorstep
        </p>
      </div>

      {/* Floating Food Images */}
      <div className="floating-images">
        <img src="/assets/burger.png" alt="Burger" className="floating-img burger" />
        <img src="/assets/vegthali2.png" alt="vegthali" className="floating-img noodles" />
        <img src="/assets/biryani.png" alt="Biryani" className="floating-img biryani" />

        {/* Tomatoes & Leaves */}
        <img src="/assets/tomato.png" alt="Tomato" className="floating-img tomato t1" />
        <img src="/assets/leaf.png" alt="Leaf" className="floating-img leaf l1" />
        <img src="/assets/tomato.png" alt="Tomato" className="floating-img tomato t2" />
        <img src="/assets/leaf.png" alt="Leaf" className="floating-img leaf l2" />
        <img src="/assets/tomato.png" alt="Tomato" className="floating-img tomato t3" />
        <img src="/assets/leaf.png" alt="Leaf" className="floating-img leaf l3" />
      </div>

      {/* Stats Section */}
      <div className="stats-container">
        <div className="stat-box">
          <img src="/assets/messicon.png" alt="Mess Icon" className="stat-icon" />
          <h2>100+ curated messes</h2>
          <p>Handpicked local kitchens serving daily meals</p>
        </div>
        <div className="stat-box">
          <img src="/assets/mealicon.png" alt="Meal Icon" className="stat-icon" />
          <h2>1,000+ meals served</h2>
          <p>Fresh, hygienic, and affordable food every day</p>
        </div>
        <div className="stat-box">
          <img src="/assets/rating.png" alt="Rating Icon" className="stat-icon" />
          <h2> 4.5/5 rated</h2>
          <p>Loved by our early users and partners</p>
        </div>
      </div>
    </section>
  );
};

export default BetterFood;
