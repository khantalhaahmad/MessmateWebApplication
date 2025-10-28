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
        const res = await api.get("/admin/owners", config);
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setOwners(data);
        setFilteredOwners(data);
      } catch (err) {
        console.error("❌ Failed to fetch owners:", err);
        setOwners([]);
        setFilteredOwners([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOwners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const lowerSearch = (search || "").toLowerCase();
    const filtered = owners.filter((o) => {
      const ownerName = (o.ownerName || "").toLowerCase();
      const email = (o.email || "").toLowerCase();
      const messesArr = Array.isArray(o.messes) ? o.messes : [];
      return (
        ownerName.includes(lowerSearch) ||
        email.includes(lowerSearch) ||
        messesArr.some((m) => (m || "").toLowerCase().includes(lowerSearch))
      );
    });
    setFilteredOwners(filtered);
  }, [search, owners]);

  if (loading) return <div className="admin-loading-screen">Loading Mess Owners...</div>;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>👨‍🍳 Mess Owners</h1>
        <div className="admin-header-right">
          <div className="admin-info">
            <span className="admin-name">{user?.name || "Admin"}</span>
          </div>
          <button className="logout-btn" onClick={() => navigate("/admin/dashboard")}>
            ← Back to Dashboard
          </button>
        </div>
      </header>

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
                  <td>{o.ownerName || "—"}</td>
                  <td>{o.email || "—"}</td>
                  <td>{Array.isArray(o.messes) && o.messes.length > 0 ? o.messes.join(", ") : "—"}</td>
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
