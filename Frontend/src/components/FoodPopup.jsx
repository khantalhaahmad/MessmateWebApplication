// src/components/FoodPopup.jsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useCart } from "../Context/CartContext";
import "../styles/FoodPopup.css";

const FoodPopup = ({ item, mess, onClose, onAdd }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [show, setShow] = useState(false); // for fade animation

  // ✅ Stable mount animation (no blinking)
  useEffect(() => {
    const timer = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  if (!item) return null;

  // ✅ Unified image resolver
  const getImagePath = (imagePath, itemName) => {
    if (imagePath) {
      if (imagePath.startsWith("http")) return imagePath;
      if (imagePath.startsWith("/assets/")) return imagePath;
      if (imagePath.startsWith("assets/")) return `/${imagePath}`;
      if (imagePath.startsWith("./assets/")) return imagePath.replace("./", "/");
      return `/assets/${imagePath}`;
    }
    // fallback from item name
    const formatted = itemName.toLowerCase().replace(/\s+/g, "").replace(/[()]/g, "");
    return `/assets/${formatted}.png`;
  };

  const imageSrc = getImagePath(item.image, item.name);

  // ✅ Add to cart logic
  const handleAdd = () => {
    const validMessId =
      mess?.mess_id || item?.mess_id || "unknown";

    const itemToAdd = {
      ...item,
      mess_id: validMessId,
      quantity,
    };

    addToCart(itemToAdd);
    setShow(false);
    setTimeout(onClose, 200);
  };

  // ✅ Smooth close
  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 200);
  };

  // ✅ Render portal (only once)
  return ReactDOM.createPortal(
    <div
      className={`popup-overlay ${show ? "show" : ""}`}
      onClick={handleClose}
    >
      <div
        className={`popup-card ${show ? "show" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="popup-close" onClick={handleClose}>
          ✕
        </button>

        <div className="popup-content">
          <img
            src={imageSrc}
            alt={item.name}
            className="popup-image"
            onError={(e) => (e.target.src = "/assets/default-food.png")}
          />

          <h3 className="popup-name">{item.name}</h3>
          <p className="popup-price">₹{item.price}</p>

          <div className="quantity-controls">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="qty-btn minus"
            >
              −
            </button>
            <span className="qty">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="qty-btn plus"
            >
              +
            </button>
          </div>

          <button className="popup-add-btn" onClick={handleAdd}>
            Add item – ₹{(item.price * quantity).toFixed(2)}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default React.memo(FoodPopup);
