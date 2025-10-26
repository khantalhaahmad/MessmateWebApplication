// src/components/MessList.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";
import MessCard from "./MessCard"; // ✅ Import card component
import "../styles/MessList.css"; // optional CSS for grid layout

function MessList({ refresh }) {
  const [messes, setMesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Fetch messes from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/messes");
      setMesses(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching mess data:", err);
      setError("Failed to fetch mess data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refresh]);

  if (loading) return <p className="messlist-loading">Loading messes...</p>;
  if (error) return <p className="messlist-error">{error}</p>;

  // ✅ If there are no messes
  if (!messes.length)
    return <p className="messlist-empty">No messes available.</p>;

  return (
    <div className="messlist-container">
      <h2 className="messlist-title">Available Messes</h2>

      <div className="messlist-grid">
        {messes.map((mess, index) => (
          <MessCard key={mess._id || index} mess={mess} index={index} />
        ))}
      </div>
    </div>
  );
}

export default MessList;
