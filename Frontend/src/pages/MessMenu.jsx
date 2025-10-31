import React, { useEffect, useState, useCallback, useContext } from "react";
import { useParams } from "react-router-dom";
import "../styles/MessMenu.css";
import { CartContext } from "../Context/CartContext";
import FoodPopup from "../components/FoodPopup";
import ViewCartButton from "../components/ViewCartButton";
import api from "../services/api";
import { Star, Clock, MapPin, Tag } from "lucide-react";

const MessMenu = () => {
  const { mess_id } = useParams();
  const [mess, setMess] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [filterType, setFilterType] = useState("All");
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);

  const fetchMessMenu = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/messes/${mess_id}`);
      const fetched = res.data?.mess || res.data || {};
      const items = fetched.menu?.items || [];
      setMess(fetched);
      setMenuItems(items);
    } catch (err) {
      console.error("❌ Error fetching mess data:", err);
    } finally {
      setLoading(false);
    }
  }, [mess_id]);

  useEffect(() => {
    fetchMessMenu();
  }, [fetchMessMenu]);

  const handleAddClick = (item) => {
    console.log("🟢 Opening popup for:", item);
    setSelectedItem(item);
  };

  const handleConfirmAdd = (food, qty) => {
    if (!mess || !mess._id || !mess.name) {
      alert("⚠️ Please wait, mess details are still loading...");
      return;
    }

    const validMessId = mess._id.toString();
    const validMessName = mess.name;

    addToCart({
      ...food,
      quantity: qty || 1,
      mess_id: validMessId,
      mess_name: validMessName,
      mess,
    });

    console.log("✅ Added to cart:", {
      mess_id: validMessId,
      mess_name: validMessName,
      item: food.name,
      qty,
    });

    setSelectedItem(null);
  };

  const filtered =
    filterType === "All"
      ? menuItems
      : menuItems.filter((i) => (filterType === "Veg" ? i.isVeg : !i.isVeg));

  if (loading) return <div className="menu-loading">Loading menu...</div>;

  return (
    <div className="menu-page">
      <div className="mess-info-card glass-card">
        <h1>{mess?.name || "Loading Mess..."}</h1>
        <p className="mess-location">
          <MapPin size={16} /> {mess?.location || "Location not available"}
        </p>
        <div className="mess-meta">
          <span>
            <Clock size={16} /> {mess?.delivery_time || "25–30 mins"}
          </span>
          <span>
            <Star size={16} /> {mess?.rating || "4.3"}
          </span>
        </div>
        {mess?.offer && (
          <div className="mess-offer">
            <Tag size={16} /> {mess.offer}
          </div>
        )}
      </div>

      <div className="filter-bar">
        {["All", "Veg", "Non-veg"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`filter-btn ${filterType === type ? "active" : ""}`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="menu-container">
        {filtered.length > 0 ? (
          filtered.map((item, idx) => (
            <div key={idx} className="menu-card shadow-md hover-scale">
              <img
                src={`/assets/${item.image || "default-food.png"}`}
                alt={item.name}
                className="menu-img"
                onError={(e) => (e.target.src = "/assets/default-food.png")}
              />
              <div className="menu-details">
                <h3>{item.name}</h3>
                <p className="menu-desc">{item.description}</p>
                <p className="menu-price">₹{item.price}</p>
                <button className="add-btn" onClick={() => handleAddClick(item)}>
                  ADD +
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-items">🍽️ No menu items available yet.</p>
        )}
      </div>

      {selectedItem && (
        <FoodPopup
          item={selectedItem}
          mess={mess} // ✅ pass mess
          onClose={() => setSelectedItem(null)}
          onAdd={handleConfirmAdd}
        />
      )}

      <ViewCartButton />
    </div>
  );
};

export default MessMenu;
