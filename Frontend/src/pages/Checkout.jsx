// src/pages/Checkout.jsx
import React, { useContext } from "react";
import "../styles/Checkout.css";
import { useCart } from "../Context/CartContext";
import api from "../services/api";
import { AuthContext } from "../Context/AuthContext";
import { toast } from "react-hot-toast";

const Checkout = () => {
  const { cartItems, calculateTotal, clearCart, removeFromCart } = useCart();
  const { user } = useContext(AuthContext);

  // ✅ Unified Image Resolver
  const getImagePath = (item) => {
    if (item.image) {
      // Handle absolute URLs or asset paths
      if (item.image.startsWith("http")) return item.image;
      if (item.image.startsWith("/assets/")) return item.image;
      if (item.image.startsWith("assets/")) return `/${item.image}`;
      if (item.image.startsWith("./assets/")) return item.image.replace("./", "/");
      return `/assets/${item.image}`;
    }

    // 🔁 Fallback: Try using item name as file name
    const formatted = item.name.toLowerCase().replace(/\s+/g, "").replace(/[()]/g, "");
    return `/assets/${formatted}.png`;
  };

  // ✅ Handle Place Order
  const handlePlaceOrder = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("⚠️ Please log in before placing an order.");
        return;
      }

      if (cartItems.length === 0) {
        toast.error("🛒 Your cart is empty.");
        return;
      }

      const mess_id = cartItems[0]?.mess_id;
      if (!mess_id) {
        toast.error("❌ Mess ID missing. Please order from a valid mess.");
        console.warn("⚠️ Cart items:", cartItems);
        return;
      }

      const items = cartItems.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      console.log("🧾 Sending order request:", { mess_id, items });
      console.table(items);

      const res = await api.post(
        "/orders",
        { mess_id, items },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("🎉 Order placed successfully!");
      clearCart();
    } catch (err) {
      console.error("💥 Order placement error:", err.response?.data || err.message);
      toast.error(`❌ Failed to place order: ${err.response?.data?.message || err.message}`);
    }
  };

  // ✅ Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="checkout-container">
        <div className="empty-cart">
          <h2>Your cart is empty 🛒</h2>
          <p>Add some delicious food from the menu to continue!</p>
        </div>
      </div>
    );
  }

  // ✅ Main Cart View
  return (
    <div className="checkout-container">
      <div className="checkout-box">
        <h2 className="checkout-title">Your Cart 🛍️</h2>

        <div className="cart-items">
          {cartItems.map((item, index) => (
            <div key={index} className="cart-item">
              <img
                src={getImagePath(item)}
                alt={item.name}
                className="cart-item-img"
                onError={(e) => (e.target.src = "/assets/default-food.png")}
              />
              <div className="cart-item-details">
                <h4>{item.name}</h4>
                <p>Qty: {item.quantity}</p>
                <p>Per Price: ₹{item.price}</p>
                <p className="item-total">
                  Total: ₹{(item.price * item.quantity).toFixed(2)}
                </p>
                <button
                  className="remove-btn"
                  onClick={() => removeFromCart(item)}
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-total">
          <h3>Total Amount: ₹{calculateTotal().toFixed(2)}</h3>
          <button className="place-order-btn" onClick={handlePlaceOrder}>
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
