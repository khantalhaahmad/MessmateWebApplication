import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import "../styles/MessDetails.css";

const MessDetails = () => {
  const { mess_id } = useParams();
  const [mess, setMess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMess = async () => {
      try {
        const res = await api.get(`/messes/id/${mess_id}`);
        setMess(res.data);
      } catch (err) {
        console.error("❌ Error fetching mess:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMess();
  }, [mess_id]);

  if (loading) return <p>Loading mess...</p>;
  if (!mess) return <p>Mess not found</p>;

  return (
    <div className="mess-details">
      <Link to="/" className="back-btn">← Back</Link>
      <h1>{mess.name}</h1>
      <p className="mess-meta">
        📍 {mess.location} &nbsp; ⏱ {mess.delivery_time || "25–30 mins"} &nbsp; ⭐ {mess.rating || 4.3}
      </p>
      {mess.offer && <p className="mess-offer">{mess.offer}</p>}

      <h3>Menu Items</h3>
      {mess.menu?.length ? (
        <div className="menu-grid">
          {mess.menu.map((item, idx) => (
            <div key={idx} className="menu-card">
              <img
                src={item.image || "/assets/default.png"}
                alt={item.name}
                className="menu-img"
              />
              <h4>{item.name}</h4>
              <p>₹{item.price}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No menu items available.</p>
      )}
    </div>
  );
};

export default MessDetails;
