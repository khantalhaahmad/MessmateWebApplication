// src/components/MessCard.jsx

import React from "react";
import { Link } from "react-router-dom";
import "../styles/MessCard.css";

const MessCard = ({ mess }) => {

  if (!mess) return null;

  console.log("🟩 Rendering mess:", mess);

  const deliveryTime = mess.delivery_time || "25–30 mins";
  const distance = mess.distance || "2.0 km";
  const rating = mess.rating || 4.3;
  const offer = mess.offer || "Flat ₹50 OFF above ₹199";

  const imagePath = `/assets/${mess.name
    ?.toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()]/g, "")
    .trim()}.png`;

  /* -----------------------------
     HANDLE CLOSED CLICK
  ----------------------------- */

  const handleClick = (e) => {

    if (!mess.isOpen) {

      e.preventDefault();

      alert("Restaurant is currently closed");

    }

  };

  return (

    <Link
      to={`/messes/${mess.mess_id}`}
      className={`messcard-link ${!mess.isOpen ? "messcard-closed" : ""}`}
      onClick={handleClick}
    >

      <div className="messcard">

        {/* Image section */}

        <div className="messcard-image">

          <img
            src={
              mess.banner ||
              mess.documents?.menuPhoto ||
              imagePath
            }
            alt={mess.name}
            onError={(e) => (e.target.src = "/assets/default.png")}
          />

          <div className="messcard-rating">
            <span>{Number(rating).toFixed(1)}</span>
          </div>

          {/* CLOSED BADGE */}

          {!mess.isOpen && (
            <div className="messcard-closed-tag">
              Closed
            </div>
          )}

        </div>

        {/* Info section */}

        <div className="messcard-info">

          <h3 className="messcard-title">
            {mess.name}
          </h3>

          <div className="messcard-meta">
            <span>⏱ {deliveryTime}</span>
            <span>•</span>
            <span>{distance}</span>
          </div>

          {offer && (
            <p className="messcard-offer">
              {offer}
            </p>
          )}

        </div>

      </div>

    </Link>

  );

};

export default MessCard;