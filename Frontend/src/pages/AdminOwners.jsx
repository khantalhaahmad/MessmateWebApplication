// src/pages/AdminOwners.jsx
import React, { useEffect, useState, useContext } from "react";
import api from "../services/api";
import "../styles/AdminDashboard.css";
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

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
        const res = await api.get("/admin/owners", config); // ✅ fixed route
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];
        setOwners(data);
        setFilteredOwners(data);
      } catch (err) {
        console.error("❌ Failed to fetch owners:", err);
        Swal.fire("Error", "Failed to load mess owners.", "error");
        setOwners([]);
        setFilteredOwners([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOwners();
  }, []);

  // 🔍 Search Filter
  useEffect(() => {
    const lowerSearch = (search || "").toLowerCase();
    const filtered = owners.filter((o) => {
      const ownerName = (o.ownerName || "").toLowerCase();
      const email = (o.email || "").toLowerCase();
      const messesArr = Array.isArray(o.messes) ? o.messes : [];
      return (
        ownerName.includes(lowerSearch) ||
        email.includes(lowerSearch) ||
        messesArr.some((m) =>
          (m || "").toLowerCase().includes(lowerSearch)
        )
      );
    });
    setFilteredOwners(filtered);
  }, [search, owners]);

  if (loading)
    return (
      <div className="admin-loading-screen">
        <div className="spinner"></div>
        <p>Loading Mess Owners...</p>
      </div>
    );

  return (
    <div className="admin-dashboard">
      {/* HEADER */}
      <header className="admin-header">
        <h1>👨‍🍳 Mess Owners</h1>
        <div className="admin-header-right">
          <span className="admin-name">{user?.name || "Admin"}</span>
          <button
            className="logout-btn"
            onClick={() => navigate("/admin/dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* SEARCH */}
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

      {/* TABLE */}
      <section className="table-section">
        <table className="earnings-table">
          <thead>
            <tr>
              <th>Owner Name</th>
              <th>Email</th>
              <th>Messes Owned</th>
            </tr>
          </thead>
          <tbody>
            {filteredOwners.length > 0 ? (
              filteredOwners.map((o, i) => (
                <tr key={i}>
                  <td>{o.ownerName || "—"}</td>
                  <td>{o.email || "—"}</td>
                  <td>
                    {Array.isArray(o.messes) && o.messes.length > 0
                      ? o.messes.join(", ")
                      : "—"}
                  </td>
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
