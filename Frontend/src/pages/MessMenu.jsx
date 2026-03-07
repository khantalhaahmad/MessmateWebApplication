import React, { useEffect, useState, useCallback, useContext } from "react";
import { useParams } from "react-router-dom";
import "../styles/MessMenu.css";
import { CartContext } from "../Context/CartContext";
import FoodPopup from "../components/FoodPopup";
import ViewCartButton from "../components/ViewCartButton";
import api from "../services/api";
import { Star, Clock, MapPin, Tag } from "lucide-react";

/* =========================================
   Backend base URL for images
========================================= */
const BASE_URL = "http://localhost:4000";

const MessMenu = () => {
  const { mess_id } = useParams();

  const [mess, setMess] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [filterType, setFilterType] = useState("All");
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const { addToCart } = useContext(CartContext);

  /* ======================================================
     Fetch mess info + merged menu (old + new)
  ====================================================== */

  const fetchMessMenu = useCallback(async () => {
    try {
      setLoading(true);

      /* -----------------------------
         1️⃣ Fetch mess info
      ----------------------------- */

      const messRes = await api.get(`/messes/${mess_id}`);
      const fetchedMess = messRes.data?.mess || messRes.data || {};

      setMess(fetchedMess);

      /* -----------------------------
         2️⃣ Fetch merged menu
      ----------------------------- */

      if (fetchedMess?._id) {
        const menuRes = await api.get(`/menu/${fetchedMess._id}`);
        setMenuItems(menuRes.data || []);
      }

    } catch (err) {
      console.error("❌ Error fetching mess menu:", err);
    } finally {
      setLoading(false);
    }
  }, [mess_id]);

  useEffect(() => {
    fetchMessMenu();
  }, [fetchMessMenu]);

  /* ======================================================
     Resolve image URL
  ====================================================== */

  const getImageUrl = (image) => {
    if (!image) return "/assets/default-food.png";

    if (image.startsWith("http")) {
      return image;
    }

    return `${BASE_URL}${image}`;
  };

  /* ======================================================
     Add to cart
  ====================================================== */

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

  /* ======================================================
     Veg / Non-Veg filter
  ====================================================== */

  const filtered =
    filterType === "All"
      ? menuItems
      : menuItems.filter((i) =>
          filterType === "Veg"
            ? i.isVeg === true
            : i.isVeg === false
        );

  if (loading) {
    return <div className="menu-loading">Loading menu...</div>;
  }

  return (
    <div className="menu-page">

      {/* ======================================================
          Mess Info
      ====================================================== */}

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

      {/* ======================================================
          Filters
      ====================================================== */}

      <div className="filter-bar">
        {["All", "Veg", "Non-veg"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`filter-btn ${
              filterType === type ? "active" : ""
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* ======================================================
          Menu Items
      ====================================================== */}

      <div className="menu-container">

        {filtered.length > 0 ? (

          filtered.map((item) => (

            <div
              key={item._id || item.name}
              className="menu-card shadow-md hover-scale"
            >

              <img
                src={getImageUrl(item.image)}
                alt={item.name}
                className="menu-img"
                onError={(e) =>
                  (e.target.src = "/assets/default-food.png")
                }
              />

              <div className="menu-details">

                <h3>{item.name}</h3>

                <p className="menu-desc">
                  {item.description || "Delicious food item"}
                </p>

                <p className="menu-price">₹{item.price}</p>

                <button
                  className="add-btn"
                  onClick={() => handleAddClick(item)}
                >
                  ADD +
                </button>

              </div>
            </div>

          ))

        ) : (

          <p className="no-items">
            🍽️ No menu items available yet.
          </p>

        )}

      </div>

      {/* ======================================================
          Food Popup
      ====================================================== */}

      {selectedItem && (
        <FoodPopup
          item={selectedItem}
          mess={mess}
          onClose={() => setSelectedItem(null)}
          onAdd={handleConfirmAdd}
        />
      )}

      <ViewCartButton />

    </div>
  );
};

export default MessMenu;