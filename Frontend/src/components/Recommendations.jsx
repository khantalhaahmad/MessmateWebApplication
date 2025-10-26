// src/components/RecommendedSection.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "../styles/Recommendations.css";
import FoodPopup from "./FoodPopup";
import ViewCartButton from "./ViewCartButton";

const RecommendedSection = ({ userId }) => {
  const [recommendedFoods, setRecommendedFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  // ✅ Fetch recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/recommendations/${userId || "guest"}`);
        setRecommendedFoods(res.data.data || []);
      } catch (error) {
        console.error("❌ Error fetching recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [backendURL, userId]);

  // ✅ Handle "Add +" click
  const handleAddClick = useCallback((food) => {
    setSelectedItem(food);
    setShowPopup(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedItem(null);
    setShowPopup(false);
  }, []);

  if (loading) return <p className="loading">Loading recommendations...</p>;

  return (
    <div className="recommendation-section">
      <h2 className="recommendation-title">🍽️ Recommended for You</h2>

      {recommendedFoods.length === 0 ? (
        <p className="no-recommendations">No recommendations available yet.</p>
      ) : (
        <div className="recommendation-grid">
          {recommendedFoods.map((food, index) => (
            <div key={index} className="recommendation-card">
              <div className="recommendation-image-wrapper">
                <img
                  src={
                    food.image?.startsWith("http")
                      ? food.image
                      : `${import.meta.env.BASE_URL}assets/${food.image || "default.png"}`
                  }
                  alt={food.name}
                  onError={(e) =>
                    (e.target.src = `${import.meta.env.BASE_URL}assets/default.png`)
                  }
                />
                <span className="recommendation-rating-badge">
                  {food.rating?.toFixed(1) || "4.0"}
                </span>
              </div>

              <div className="recommendation-info">
                <h4>{food.name}</h4>
                <p>{food.description || "Delicious and fresh meal"}</p>
                <div className="recommendation-bottom">
                  <span className="recommendation-price">₹{food.price}</span>
                  <button className="add-btn" onClick={() => handleAddClick(food)}>
                    ADD +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Popup opens when user clicks ADD */}
      {showPopup && selectedItem && (
        <FoodPopup
          item={selectedItem}
          mess={{
            name: selectedItem.mess_name || "Recommended Mess",
            mess_id: selectedItem.mess_id || "N/A",
          }}
          onClose={handleClosePopup}
        />
      )}

      <ViewCartButton />
    </div>
  );
};

export default RecommendedSection;
