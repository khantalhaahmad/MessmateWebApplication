// src/pages/AdminOwners.jsx
import React, { useEffect, useState, useContext } from "react";
import api from "../services/api";
import "../styles/AdminDashboard.css";
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminOwners = () => {
  const [owners, setOwners] = useState([]);
  const [filteredOwners, setFilteredOwners] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const res = await api.get("/admin-extra/owners", config);
        setOwners(res.data);
        setFilteredOwners(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch owners:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOwners();
  }, []);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    const filtered = owners.filter(
      (o) =>
        o.ownerName.toLowerCase().includes(lowerSearch) ||
        o.email.toLowerCase().includes(lowerSearch) ||
        o.messes.some((m) => m.toLowerCase().includes(lowerSearch))
    );
    setFilteredOwners(filtered);
  }, [search, owners]);

  if (loading)
    return <div className="admin-loading-screen">Loading Mess Owners...</div>;

  return (
    <div className="admin-dashboard">
      {/* ===== HEADER NAVBAR ===== */}
      <header className="admin-header">
        <h1>👨‍🍳 Mess Owners</h1>
        <div className="admin-header-right">
          <div className="admin-info">
            <span className="admin-name">{user?.name || "Admin"}</span>
          </div>
          <button
            className="logout-btn"
            onClick={() => navigate("/admin/dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* ===== SEARCH BAR (LEFT ALIGNED) ===== */}
      <section className="search-section left-align">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by owner or mess name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </section>

      {/* ===== OWNERS TABLE ===== */}
      <section className="table-section">
        <table className="earnings-table">
          <thead>
            <tr>
              <th>OWNER NAME</th>
              <th>EMAIL</th>
              <th>MESSES OWNED</th>
            </tr>
          </thead>
          <tbody>
            {filteredOwners.length > 0 ? (
              filteredOwners.map((o, i) => (
                <tr key={i}>
                  <td>{o.ownerName}</td>
                  <td>{o.email}</td>
                  <td>{o.messes.length > 0 ? o.messes.join(", ") : "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="no-data">
                  No owners found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminOwners;
