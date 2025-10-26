import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import "../styles/AddMessButton.css";

const AddMessButton = () => {
  const [visible, setVisible] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // ✅ Show only for logged-in owners
  const isOwner = user && user.role === "owner";

  // ✅ Pages where Add Mess button should be hidden
  const hiddenPaths = [
    "/messes/id", // menu section
    "/available-messes",
    "/checkout",
    "/cart",
    "/login",
    "/signup",
  ];

  // ✅ Hide if current path matches any restricted one
  const isHiddenPath = hiddenPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  useEffect(() => {
    if (!isOwner || isHiddenPath) {
      setVisible(false);
      return;
    }

    const messSection = document.querySelector("#mess-section");
    const footerSection = document.querySelector("#footer-section");

    if (!messSection || !footerSection) {
      // default visible if sections don't exist
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isMessVisible = entries.some(
          (entry) => entry.target.id === "mess-section" && entry.isIntersecting
        );
        const isFooterVisible = entries.some(
          (entry) => entry.target.id === "footer-section" && entry.isIntersecting
        );

        // ✅ Hide when either mess or footer is visible
        setVisible(!(isMessVisible || isFooterVisible));
      },
      { threshold: 0.1 }
    );

    observer.observe(messSection);
    observer.observe(footerSection);

    return () => observer.disconnect();
  }, [isOwner, isHiddenPath, location.pathname]);

  const handleAddMess = () => navigate("/addmess");

  // ✅ Never render button if not owner or on restricted pages
  if (!isOwner || isHiddenPath) return null;

  return (
    <button
      className={`add-mess-btn ${visible ? "show" : "hide"}`}
      onClick={handleAddMess}
    >
      + Add Mess
    </button>
  );
};

export default AddMessButton;
