import React, { useEffect, useState, useContext, useMemo } from "react";
import api from "../services/api";
import "../styles/AdminDashboard.css";
import LogoutPopup from "../components/LogoutPopup";
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Swal from "sweetalert2";

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [messList, setMessList] = useState([]);
  const [topMesses, setTopMesses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [deliveryRequests, setDeliveryRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // 🔒 Auth check
  useEffect(() => {
    if (!token) {
      Swal.fire("Session Expired", "Please log in again.", "warning");
      navigate("/login");
    }
  }, [token, navigate]);

  // 🕒 Live clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const date = now.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const time = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentTime(`${date} | ${time}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 📦 Fetch all admin dashboard data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        summaryRes,
        trendsRes,
        payoutsRes,
        requestsRes,
        messListRes,
        topMessesRes,
        reviewsRes,
        deliveryReqRes,
      ] = await Promise.allSettled([
        api.get("/admin/daily-summary", config),
        api.get("/admin/revenue-trends", config),
        api.get("/admin/owner-payouts", config),
        api.get("/admin/mess-requests/pending", config),
        api.get("/admin/mess-list", config),
        api.get("/admin/top-messes", config),
        api.get("/admin/reviews", config),
        api.get("/admin/delivery-requests/pending", config),
      ]);

      setSummary(summaryRes?.value?.data || {});
      setTrends(trendsRes?.value?.data || []);
      setPayouts(payoutsRes?.value?.data || []);
      setRequests(requestsRes?.value?.data || []);
      setMessList(messListRes?.value?.data || []);
      setTopMesses(topMessesRes?.value?.data || []);
      setReviews(reviewsRes?.value?.data || []);
      setDeliveryRequests(deliveryReqRes?.value?.data || []);
    } catch (err) {
      console.error("❌ Dashboard fetch failed:", err);
      Swal.fire("Error", "Failed to load admin dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // 💸 Update payout status
  const updatePayoutStatus = async (messName, payoutStatus) => {
    try {
      const res = await api.put(
        "/admin/payout-status",
        { messName, payoutStatus },
        config
      );
      if (res.data.success) {
        Swal.fire("Updated!", res.data.message, "success");
        setPayouts((prev) =>
          prev.map((p) =>
            p.messName === messName ? { ...p, payoutStatus } : p
          )
        );
      }
    } catch (err) {
      Swal.fire("Error", "Something went wrong while updating payout.", "error");
    }
  };

  // 🧾 Approve/Reject Mess Request
  const handleApprove = async (id) => {
    const confirm = await Swal.fire({
      icon: "question",
      title: "Approve Mess Request?",
      text: "This will move it to active Messes.",
      showCancelButton: true,
      confirmButtonText: "Yes, Approve",
      confirmButtonColor: "#28a745",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await api.put(`/admin/mess-request/${id}/approve`, {}, config);
      if (res.data.success) {
        Swal.fire("Approved!", "Mess added successfully.", "success");
        setRequests((prev) => prev.filter((r) => r._id !== id));
      }
    } catch (err) {
      Swal.fire("Error", "Failed to approve mess.", "error");
    }
  };

  const handleReject = async (id) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Reject Mess Request?",
      showCancelButton: true,
      confirmButtonText: "Yes, Reject",
      confirmButtonColor: "#e23744",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await api.put(`/admin/mess-request/${id}/reject`, {}, config);
      if (res.data.success) {
        Swal.fire("Rejected!", "Mess request removed.", "info");
        setRequests((prev) => prev.filter((r) => r._id !== id));
      }
    } catch (err) {
      Swal.fire("Error", "Failed to reject mess request.", "error");
    }
  };

  // ⭐ Review Delete
  const deleteReview = async (id) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete Review?",
      text: "This cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      confirmButtonColor: "#e23744",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await api.delete(`/admin/reviews/${id}`, config);
      Swal.fire("Deleted!", res.data.message, "success");
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch {
      Swal.fire("Error", "Failed to delete review.", "error");
    }
  };

  // 🚴 Delivery partner approvals
  const handleApproveDelivery = async (id) => {
    const confirm = await Swal.fire({
      icon: "question",
      title: "Approve Delivery Partner?",
      text: "Approving will add them as a delivery agent and remove the request.",
      showCancelButton: true,
      confirmButtonText: "Approve",
      confirmButtonColor: "#28a745",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await api.put(`/admin/delivery-request/${id}/approve`, {}, config);
      if (res.data.success) {
        Swal.fire("Approved!", res.data.message, "success");
        setDeliveryRequests((prev) => prev.filter((d) => d._id !== id));
      }
    } catch (err) {
      Swal.fire("Error", "Failed to approve delivery request.", "error");
    }
  };

  const handleRejectDelivery = async (id) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Reject Delivery Request?",
      showCancelButton: true,
      confirmButtonText: "Reject",
      confirmButtonColor: "#e23744",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await api.put(`/admin/delivery-request/${id}/reject`, {}, config);
      if (res.data.success) {
        Swal.fire("Rejected!", res.data.message, "info");
        setDeliveryRequests((prev) => prev.filter((d) => d._id !== id));
      }
    } catch (err) {
      Swal.fire("Error", "Failed to reject delivery request.", "error");
    }
  };

  // 🚪 Logout
  const handleLogoutClick = () => setShowLogoutPopup(true);
  const handleConfirmLogout = () => {
    logout();
    setShowLogoutPopup(false);
  };

  // 📊 Stable 7-day trend (no moving/animation)
  const trendData = useMemo(() => {
    const days = [];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split("T")[0];
      days.push({
        label: `${months[d.getMonth()]} ${d.getDate()}`,
        isoDate,
      });
    }

    return days.map((day) => {
      const match = trends.find((t) =>
        new Date(t._id).toISOString().split("T")[0] === day.isoDate
      );
      return {
        _id: day.label,
        totalRevenue: match ? match.totalRevenue : 0,
      };
    });
  }, [trends]);

  if (loading)
    return (
      <div className="admin-loading-screen">
        <div className="spinner"></div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-left">
          <h1>📊 MessMate Admin Dashboard</h1>
        </div>
        <div className="header-center">
          <button className="home-btn" onClick={() => navigate("/")}>
            🏠 Home
          </button>
          <span className="datetime">{currentTime}</span>
        </div>
        <div className="header-right">
          <span className="admin-name">{user?.name || "Admin"}</span>
          <button className="logout-btn" onClick={handleLogoutClick}>
            Logout
          </button>
        </div>
      </header>

      {showLogoutPopup && (
        <LogoutPopup
          onConfirm={handleConfirmLogout}
          onCancel={() => setShowLogoutPopup(false)}
        />
      )}

      {/* 🧾 SUMMARY SECTION */}
<section className="summary-section">
  {/* Orders */}
  <div className="summary-card">
    <h3>🛒 Orders (Today)</h3>
    <p>{summary?.totalOrders ?? 0}</p>
  </div>

  {/* Owner Revenue */}
  <div className="summary-card">
    <h3>🏦 Owner Revenue (₹)</h3>
    <p>{summary?.totalRevenue ?? 0}</p>
  </div>

  {/* Admin Commission */}
<div className="summary-card">
  <h3>💼 Platform Fees (₹)</h3>
  <p>{summary?.totalCommission ?? 0}</p>
</div>


  {/* Mess Owners */}
  <div
    className="summary-card clickable"
    onClick={() => navigate("/admin/owners")}
  >
    <h3>👨‍🍳 Mess Owners</h3>
    <p>{summary?.totalOwners ?? 0}</p>
  </div>

  {/* Students */}
  <div
    className="summary-card clickable"
    onClick={() => navigate("/admin/students")}
  >
    <h3>🎓 Students</h3>
    <p>{summary?.totalStudents ?? 0}</p>
  </div>

  {/* Delivery Agents */}
  <div
    className="summary-card clickable"
    onClick={() => navigate("/admin/delivery-agents")}
  >
    <h3>🚴‍♂️ Delivery Agents</h3>
    <p>{summary?.totalDeliveryAgents ?? 0}</p>
  </div>
</section>

      {/* 📈 STABLE REVENUE TREND */}
      <section className="chart-section">
        <h2>📈 Revenue Trend (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
            <XAxis dataKey="_id" tick={{ fontSize: 12, fill: "#555" }} />
            <YAxis tick={{ fontSize: 12, fill: "#555" }} />
            <Tooltip formatter={(v) => [`₹${v}`, "Revenue"]} />
            <Line
              type="linear"
              dataKey="totalRevenue"
              stroke="#007bff"
              strokeWidth={2.5}
              dot={{ r: 5, fill: "#007bff", strokeWidth: 1, stroke: "#fff" }}
              activeDot={{ r: 7 }}
              isAnimationActive={false}
              animateNewValues={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* 🏆 Top Messes */}
      <section className="table-section">
        <h2>🏆 Top Performing Messes</h2>
        <table className="earnings-table">
          <thead>
            <tr>
              <th>Mess Name</th>
              <th>Location</th>
              <th>Orders</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topMesses.length > 0 ? (
              topMesses.map((m) => (
                <tr key={m.messId ?? m._id}>
                  <td>{m.name}</td>
                  <td>{m.location}</td>
                  <td>{m.orderCount}</td>
                  <td>{m.totalRevenue}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="no-data">No top messes yet</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* ⭐ User Reviews */}
      <section className="table-section">
        <h2>⭐ User Reviews</h2>
        <table className="earnings-table">
          <thead>
            <tr><th>User</th><th>Mess</th><th>Rating</th><th>Comment</th><th>Action</th></tr>
          </thead>
          <tbody>
            {reviews.length > 0 ? (
              reviews.map((r) => (
                <tr key={r._id}>
                  <td>{r.user_id?.name || "N/A"}</td>
                  <td>{r.mess_id?.name || "N/A"}</td>
                  <td>{r.rating ?? "—"}</td>
                  <td>{r.comment || "—"}</td>
                  <td><button className="btn-reject" onClick={() => deleteReview(r._id)}>🗑 Delete</button></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="no-data">No reviews found</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* 🚴 Delivery Requests */}
      <section className="table-section">
        <h2>🚴 Delivery Partner Requests</h2>
        <table className="earnings-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>City</th><th>Vehicle</th><th>Action</th></tr>
          </thead>
          <tbody>
            {deliveryRequests.length > 0 ? (
              deliveryRequests.map((d) => (
                <tr key={d._id}>
                  <td>{d.name}</td>
                  <td>{d.email}</td>
                  <td>{d.city}</td>
                  <td>{d.vehicleType}</td>
                  <td>
                    <button className="btn-approve" onClick={() => handleApproveDelivery(d._id)}>✅ Approve</button>
                    <button className="btn-reject" onClick={() => handleRejectDelivery(d._id)}>❌ Reject</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="no-data">No pending delivery requests</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* 📬 Pending Mess Requests */}
      <section className="table-section">
        <h2>📬 Pending Mess Requests</h2>
        <table className="earnings-table">
          <thead>
            <tr><th>Mess</th><th>Location</th><th>Owner</th><th>Email</th><th>Status</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {requests.length > 0 ? (
              requests.map((r) => (
                <tr key={r._id}>
                  <td>{r.name}</td>
                  <td>{r.location}</td>
                  <td>{r.owner_id?.name}</td>
                  <td>{r.owner_id?.email}</td>
                  <td>{r.status}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-approve" onClick={() => handleApprove(r._id)}>✅ Approve</button>
                    <button className="btn-reject" onClick={() => handleReject(r._id)}>❌ Reject</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" className="no-data">No pending requests</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* 💸 Owner Payouts */}
      <section className="table-section">
        <h2>💸 Owner Payouts (This Month)</h2>
        <table className="earnings-table">
          <thead>
            <tr><th>Mess</th><th>Owner</th><th>Email</th><th>Total</th><th>Commission</th><th>Payable</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {payouts.length > 0 ? (
              payouts.map((p) => (
                <tr key={p.messId ?? p.messName}>
                  <td>{p.messName}</td>
                  <td>{p.ownerName}</td>
                  <td>{p.ownerEmail}</td>
                  <td>{p.totalRevenue}</td>
                  <td>{p.commission}</td>
                  <td>{p.payable}</td>
                  <td>
                    <span className={`status-badge ${p.payoutStatus === "Paid" ? "paid" : "pending"}`}>{p.payoutStatus}</span>
                  </td>
                  <td>
                    <button
                      className="approve-btn"
                      onClick={() =>
                        updatePayoutStatus(
                          p.messName,
                          p.payoutStatus === "Paid" ? "Pending" : "Paid"
                        )
                      }
                    >
                      {p.payoutStatus === "Paid"
                        ? "⏳ Mark Pending"
                        : "💰 Mark Paid"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" className="no-data">No payouts found</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminDashboard;
