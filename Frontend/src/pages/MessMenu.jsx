// src/pages/MessMenu.jsx
import React, { useEffect, useState, useCallback, useContext } from "react";
import { useParams } from "react-router-dom";
import "../styles/MessMenu.css";
import { CartContext } from "../Context/CartContext";
import FoodPopup from "../components/FoodPopup";
import ViewCartButton from "../components/ViewCartButton";
import { RotateCcw } from "lucide-react";
import api from "../services/api"; // ✅ use axios instance

const MessMenu = () => {
  const { mess_id } = useParams();
  const [mess, setMess] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [filterType, setFilterType] = useState("All");
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);

  /**
   * ✅ Fetch Mess Details + Menu
   */
  const fetchMessMenu = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/messes/${mess_id}`); // ✅ dynamic baseURL
      const fetchedMess = response.data;

      if (!fetchedMess || !fetchedMess.menu) {
        console.warn("⚠️ No mess or menu data found for:", mess_id);
        setMess(null);
        setMenuItems([]);
        setFilteredItems([]);
        return;
      }

      setMess(fetchedMess);
      setMenuItems(fetchedMess.menu.items || []);
      setFilteredItems(fetchedMess.menu.items || []);
    } catch (error) {
      console.error("❌ Error fetching mess menu:", error.response?.data || error.message);
      setMess(null);
      setMenuItems([]);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  }, [mess_id]);

  useEffect(() => {
    fetchMessMenu();
  }, [fetchMessMenu]);

  /**
   * ✅ Filter logic (Veg / Non-veg / Highly Reordered / All)
   */
  const handleFilter = (type) => {
    setFilterType(type);
    if (type === "Veg") {
      setFilteredItems(menuItems.filter((item) => item.type?.toLowerCase() === "veg"));
    } else if (type === "Non-veg") {
      setFilteredItems(menuItems.filter((item) => item.type?.toLowerCase() === "non-veg"));
    } else if (type === "Highly reordered") {
      setFilteredItems(menuItems.filter((item) => item.isHighlyReordered));
    } else {
      setFilteredItems(menuItems);
    }
  };

  /**
   * ✅ Handle Image Paths
   */
  const getImagePath = (imagePath) => {
    if (!imagePath) return "/assets/default-food.png";
    if (imagePath.startsWith("/assets/")) return imagePath;
    if (imagePath.startsWith("assets/")) return `/${imagePath}`;
    return `/assets/${imagePath}`;
  };

  /**
   * ✅ Add to cart popup logic
   */
  const handleAddClick = (item) => {
    setSelectedItem({
      ...item,
      mess_id: mess?.mess_id,
      image: getImagePath(item.image),
    });
  };

  const handleConfirmAdd = (foodItem, quantity) => {
    addToCart({
      ...foodItem,
      mess_id: mess?.mess_id,
      quantity,
    });
    setSelectedItem(null);
  };

  /**
   * ✅ Render Logic
   */
  if (loading) {
    return (
      <div className="loading-container">
        <p>🍽️ Loading mess menu...</p>
      </div>
    );
  }

  if (!mess) {
    return (
      <div className="error-container">
        <p>❌ Unable to load mess menu. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="mess-menu-container">
      {/* 🏠 Mess Header */}
      <div className="mess-header">
        <div className="mess-header-left">
          <h2>{mess.name}</h2>
          <p className="mess-subinfo">
            📍 {mess.location || "On Main NH"} • ⏱️ {mess.delivery_time || "25–30 mins"} • ⭐{" "}
            {mess.rating || "4.3"}
          </p>
        </div>
        {mess.offer && <p className="offer-text">{mess.offer}</p>}
      </div>

      {/* 🔘 Filter Buttons */}
      <div className="filter-buttons">
        {["All", "Veg", "Non-veg", "Highly reordered"].map((type) => (
          <button
            key={type}
            className={`filter-button ${filterType === type ? "active" : ""}`}
            onClick={() => handleFilter(type)}
          >
            {type === "Highly reordered" ? <RotateCcw size={14} /> : null} {type}
          </button>
        ))}
      </div>

      <h3 className="section-title">Recommended for you</h3>

      {/* 🍛 Menu List */}
      <div className="menu-list">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <div key={item._id || index} className="menu-row">
              <div className="menu-info">
                <span
                  className={item.type?.toLowerCase() === "veg" ? "dot veg" : "dot nonveg"}
                ></span>
                <div className="menu-text">
                  <h4>{item.name}</h4>
                  <p className="price">₹{item.price}</p>
                  {item.description && <p className="desc">{item.description}</p>}
                </div>
              </div>

              <div className="menu-img-container">
                <img
                  src={getImagePath(item.image)}
                  alt={item.name}
                  onError={(e) => (e.target.src = "/assets/default-food.png")}
                  className="menu-img"
                />
                <button className="add-btn" onClick={() => handleAddClick(item)}>
                  ADD +
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-items">No items available in this category.</p>
        )}
      </div>

      {/* 🛒 Add Item Popup */}
      {selectedItem && (
        <FoodPopup
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={handleConfirmAdd}
        />
      )}

      <ViewCartButton />
    </div>
  );
};

export default MessMenu;
