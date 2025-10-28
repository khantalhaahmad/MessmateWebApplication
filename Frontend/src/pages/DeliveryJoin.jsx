import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/DeliveryJoin.css";

const DeliveryJoin = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    vehicleType: "",
    vehicleNumber: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // keep compatibility with your frontend usage: POST to admin route
      const res = await api.post("/admin/delivery-request", formData);
      if (res.status === 201 || res.status === 200) {
        setMessage("✅ Your request has been submitted successfully!");
        setFormData({
          name: "",
          phone: "",
          email: "",
          city: "",
          vehicleType: "",
          vehicleNumber: "",
        });
      } else {
        setMessage("❌ Something went wrong. Please try again later.");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setMessage("❌ Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delivery-join-container">
      <div className="delivery-join-header">
        <button className="home-btn" onClick={() => navigate("/")}>
          🏠 Home
        </button>
      </div>

      <div className="delivery-join-card">
        <h1>🚴 Join MessMate as a Delivery Partner</h1>
        <p>
          Earn on your schedule by delivering fresh meals from local messes to
          students. Apply below — our admin team will review your details.
        </p>

        <form onSubmit={handleSubmit} className="delivery-join-form">
          <input
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
            required
          />
          <input
            name="vehicleType"
            placeholder="Vehicle Type (e.g., Bike, Scooter)"
            value={formData.vehicleType}
            onChange={handleChange}
            required
          />
          <input
            name="vehicleNumber"
            placeholder="Vehicle Number"
            value={formData.vehicleNumber}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>

        {message && <p className="delivery-join-message">{message}</p>}
      </div>
    </div>
  );
};

export default DeliveryJoin;
