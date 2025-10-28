import React, { useEffect, useState, useContext } from "react";
import api from "../services/api";
import "../styles/AdminDashboard.css"; // reuse same styling
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const AdminDeliveryAgents = () => {
  const [agents, setAgents] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await api.get("/admin/delivery-agents", config); // ✅ fixed route
        setAgents(res.data);
      } catch (err) {
        console.error("❌ Error fetching delivery agents:", err);
        Swal.fire("Error", "Failed to fetch delivery agents.", "error");
      }
    };
    fetchAgents();
  }, []);

  return (
    <div className="admin-dashboard">
      {/* ===== HEADER ===== */}
      <header className="admin-header">
        <div className="header-left">
          <h1>🚴 Delivery Agents</h1>
        </div>
        <div className="header-right">
          <button className="home-btn" onClick={() => navigate("/admin/dashboard")}>
            ⬅️ Back to Dashboard
          </button>
          <span className="admin-name">{user?.name || "Admin"}</span>
        </div>
      </header>

      {/* ===== TABLE ===== */}
      <section className="table-section">
        <h2>📋 List of All Delivery Agents</h2>
        <table className="earnings-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>City</th>
              <th>Vehicle Type</th>
              <th>Vehicle Number</th>
              <th>Status</th>
              <th>Created On</th>
            </tr>
          </thead>
          <tbody>
            {agents.length > 0 ? (
              agents.map((a, i) => (
                <tr key={i}>
                  <td>{a.name}</td>
                  <td>{a.phone}</td>
                  <td>{a.email}</td>
                  <td>{a.city || "N/A"}</td>
                  <td>{a.vehicleType}</td>
                  <td>{a.vehicleNumber}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        a.status === "available"
                          ? "approved"
                          : a.status === "busy"
                          ? "pending"
                          : "rejected"
                      }`}
                    >
                      {a.status || "unknown"}
                    </span>
                  </td>
                  <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data">
                  No delivery agents found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminDeliveryAgents;
