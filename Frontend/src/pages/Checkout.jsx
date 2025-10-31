// ✅ src/pages/Checkout.jsx — FINAL PRODUCTION VERSION
import React, { useContext, useState } from "react";
import "../styles/Checkout.css";
import { useCart } from "../Context/CartContext";
import api from "../services/api";
import { AuthContext } from "../Context/AuthContext";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";

const Checkout = () => {
  const { cartItems, calculateTotal, clearCart, removeFromCart } = useCart();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  /* ------------------------------------------------------------
     ✅ Helper: Fix Image Path
  ------------------------------------------------------------ */
  const getImagePath = (item) => {
    if (item.image) {
      if (item.image.startsWith("http")) return item.image;
      if (item.image.startsWith("/assets/")) return item.image;
      if (item.image.startsWith("assets/")) return `/${item.image}`;
      if (item.image.startsWith("./assets/")) return item.image.replace("./", "/");
      return `/assets/${item.image}`;
    }
    const formatted = item.name.toLowerCase().replace(/\s+/g, "").replace(/[()]/g, "");
    return `/assets/${formatted}.png`;
  };

  /* ------------------------------------------------------------
     ✅ Helper: Create Order on Backend
  ------------------------------------------------------------ */
  const createOrder = async (paymentMethod) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return toast.error("⚠️ Please log in first.");
      if (cartItems.length === 0) return toast.error("🛒 Your cart is empty.");

      // 🧠 Smart mess info extraction
      const validMess = cartItems.find(
        (item) => item.mess_id && item.mess_id !== "N/A"
      );
      const mess_id = validMess?.mess_id || cartItems[0]?.mess_id;
      const mess_name = validMess?.mess_name || cartItems[0]?.mess_name;
      const total = calculateTotal();

      const items = cartItems.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      console.log("📦 Sending order:", { mess_id, mess_name, paymentMethod, total });

      await api.post(
        "/orders",
        {
          mess_id,
          mess_name,
          items,
          total_price: total,
          paymentMethod,
          status: paymentMethod === "COD" ? "Pending (COD)" : "confirmed",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        title: "🍽️ Order Placed Successfully! 🎉",
        html: `
          <p style="font-size:16px; color:#555; margin-top:10px;">
            ${
              paymentMethod === "COD"
                ? "Your Cash on Delivery order has been confirmed."
                : "Your payment was successful and order placed!"
            }<br/>You will receive your delicious food shortly! 😋
          </p>
        `,
        icon: "success",
        confirmButtonText: "🍕 Track My Order",
        confirmButtonColor: "#ff6b00",
        background: "#fff",
        color: "#333",
        backdrop: `
          rgba(0,0,0,0.5)
          url("/assets/confetti.gif")
          center top
          no-repeat
        `,
      }).then(() => {
        clearCart();
        window.location.href = "/my-orders";
      });
    } catch (error) {
      console.error("💥 Order Error:", error);
      toast.error("❌ Failed to place order. Please try again!");
    }
  };

  /* ------------------------------------------------------------
     ✅ Online Payment + Order
  ------------------------------------------------------------ */
  const handlePaymentAndOrder = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return toast.error("⚠️ Please log in first.");
      if (cartItems.length === 0) return toast.error("🛒 Your cart is empty.");

      const total = calculateTotal();
      setLoading(true);

      const { data: order } = await api.post("/payment/create-order", { amount: total });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "MessMate",
        description: "Mess Payment",
        order_id: order.id,
        handler: async (response) => {
          const verifyRes = await api.post("/payment/verify", response);
          if (verifyRes.data.success) {
            await createOrder("Online");
            toast.success("✅ Payment Success & Order Placed!");
          } else {
            toast.error("❌ Payment Verification Failed!");
          }
        },
        prefill: {
          name: user?.name || "Customer",
          email: user?.email || "user@example.com",
          contact: user?.phone || "9999999999",
        },
        theme: { color: "#4CAF50" },
      };

      new window.Razorpay(options).open();
      setLoading(false);
    } catch (error) {
      console.error("💥 Payment Error:", error);
      toast.error("❌ Payment Failed!");
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------
     ✅ Cash on Delivery
  ------------------------------------------------------------ */
  const handleCODOrder = async () => {
    await createOrder("COD");
  };

  /* ------------------------------------------------------------
     🛒 UI Rendering
  ------------------------------------------------------------ */
  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty">
        <img src="/assets/empty-cart.png" alt="Empty cart" className="empty-cart-img" />
        <h2>Your cart is empty 🛒</h2>
        <p>Add something delicious to your cart!</p>
      </div>
    );
  }

  return (
    <div className="checkout-wrapper">
      <div className="checkout-container">
        <h2 className="checkout-heading">Checkout 🧾</h2>

        <div className="checkout-content">
          {/* LEFT: Cart Section */}
          <div className="cart-section">
            {cartItems.map((item, index) => (
              <div key={index} className="cart-card">
                <img src={getImagePath(item)} alt={item.name} className="cart-img" />
                <div className="cart-info">
                  <h4>{item.name}</h4>
                  <p>Qty: {item.quantity}</p>
                  <p>₹{item.price} each</p>
                  <strong>Total: ₹{(item.price * item.quantity).toFixed(2)}</strong>
                </div>
                <button className="remove-item" onClick={() => removeFromCart(item)}>🗑</button>
              </div>
            ))}
          </div>

          {/* RIGHT: Summary Section */}
          <div className="summary-section">
            <div className="delivery-box">
              <h3>Delivery Details 🚚</h3>
              <p><strong>{user?.name || "Customer"}</strong></p>
              <p>{user?.email || "user@example.com"}</p>
              <p>{user?.phone || "9999999999"}</p>
              <p className="address-line">📍 {user?.address || "Your saved address will appear here"}</p>
            </div>

            <div className="bill-box">
              <h3>Bill Summary</h3>
              <div className="summary-row"><span>Subtotal</span><span>₹{calculateTotal().toFixed(2)}</span></div>
              <div className="summary-row"><span>GST (5%)</span><span>₹{(calculateTotal() * 0.05).toFixed(2)}</span></div>
              <div className="summary-row"><span>Delivery Fee</span><span>₹20.00</span></div>
              <hr />
              <div className="summary-row total">
                <span>Grand Total</span>
                <span>₹{(calculateTotal() * 1.05 + 20).toFixed(2)}</span>
              </div>
            </div>

            <div className="payment-buttons">
              <button
                className="btn pay-online"
                onClick={handlePaymentAndOrder}
                disabled={loading}
              >
                {loading ? "Processing..." : "💳 Pay Securely Online"}
              </button>
              <button className="btn cod" onClick={handleCODOrder}>
                💵 Cash on Delivery
              </button>
            </div>

            <p className="secure-text">🔒 100% Secure Payments powered by Razorpay</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
