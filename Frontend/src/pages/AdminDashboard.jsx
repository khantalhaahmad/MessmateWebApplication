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
  const [summary, setSummary] = useState({});
  const [trend, setTrend] = useState([]);
  const [requests, setRequests] = useState([]);
  const [topMesses, setTopMesses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [deliveryRequests, setDeliveryRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  // 💰 Payout states
const [payouts, setPayouts] = useState([]);
const [loadingPayouts, setLoadingPayouts] = useState(false);
// 💰 Settlement Cycle states
const [selectedCycle, setSelectedCycle] = useState("");
const [currentCycle, setCurrentCycle] = useState("");

// 🧮 Helper: detect current 10-day settlement cycle
function getSettlementCycle(date = new Date()) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const cycle = day <= 10 ? 1 : day <= 20 ? 2 : 3;
  return `${year}-${month.toString().padStart(2, "0")}-C${cycle}`;
}



  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // ✅ Token Handling (Admin + User fallback)
  const adminToken = localStorage.getItem("adminToken");
  const userToken = localStorage.getItem("token");
  const token = adminToken || userToken;

  // 🔐 Auth check
  useEffect(() => {
    if (!token) {
      Swal.fire("Session Expired", "Please log in again.", "warning");
      navigate("/login");
    }
  }, [token, navigate]);

  // 🕒 Real-time clock
  useEffect(() => {
    const update = () => {
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
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  // 📦 Fetch Admin Dashboard Data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, requestsRes, topRes, reviewsRes, deliveryRes] =
        await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/mess-requests/pending"),
          api.get("/admin/top-messes"),
          api.get("/admin/reviews"),
          api.get("/admin/delivery-requests/pending"),
        ]);

      const dashboard = dashboardRes.data || {};
      setSummary(dashboard.stats || {});
      setTrend(dashboard.trend || []);
      setRequests(requestsRes?.data || []);
      setTopMesses(topRes?.data || []);
      setReviews(reviewsRes?.data || []);
      setDeliveryRequests(deliveryRes?.data || []);
    } catch (err) {
      console.error("❌ Dashboard Fetch Error:", err);
      Swal.fire("Error", "Failed to load admin dashboard.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const cycle = getSettlementCycle();
  setCurrentCycle(cycle);
  setSelectedCycle(cycle);

  fetchDashboardData();
  if (user?.role === "admin") fetchPayouts(cycle);
}, [user]);

  // =============================
// 💰 FETCH PAYOUT DATA
// =============================
const fetchPayouts = async (cycle = "") => {
  setLoadingPayouts(true);
  try {
    const res = await api.get(`/admin/owner-payouts?cycle=${cycle}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setPayouts(res.data || []);
  } catch (err) {
    console.error("❌ Error fetching payouts:", err);
    Swal.fire("Error", "Failed to fetch payouts data.", "error");
  } finally {
    setLoadingPayouts(false);
  }
};

// =============================
// 💵 MARK AS PAID HANDLER (UPDATED)
// =============================
const markAsPaid = async (messId) => {
  try {
    const confirm = await Swal.fire({
      title: "Mark as Paid?",
      text: "Do you want to mark this payout as paid?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, mark as paid",
    });

    if (!confirm.isConfirmed) return;

    await api.put(
      "/admin/payout-status",
      { messId, payoutStatus: "Paid" },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    Swal.fire("✅ Success", "Payout marked as paid!", "success");
    fetchPayouts(); // refresh payout list
  } catch (err) {
    console.error("❌ Error updating payout status:", err);
    Swal.fire("Error", "Could not update payout status.", "error");
  }
};

  // ✅ Approve Mess Request (with password prompt)
// ✅ Secure Mess Request Approval — Ask Admin Password
const handleApprove = async (id) => {
  try {
    const { value: adminPassword } = await Swal.fire({
      title: "🔐 Enter Admin Password",
      input: "password",
      inputPlaceholder: "Enter your admin password to approve",
      inputAttributes: { autocapitalize: "off", autocorrect: "off" },
      showCancelButton: true,
      confirmButtonText: "Approve ✅",
      confirmButtonColor: "#28a745",
      cancelButtonText: "Cancel",
      inputValidator: (v) => (!v ? "Password is required!" : undefined),
    });

    if (!adminPassword) return;

    const res = await api.put(`/admin/mess-request/${id}/approve`, { adminPassword });

    if (res.data.success) {
      Swal.fire("✅ Approved!", res.data.message, "success");
      setRequests((prev) => prev.filter((r) => r._id !== id));
      fetchDashboardData();
    } else {
      Swal.fire("❌ Failed", res.data.message || "Wrong password", "error");
    }
  } catch (error) {
    console.error("❌ Approve Error:", error);
    Swal.fire("Error", error.response?.data?.message || "Failed to approve mess", "error");
  }
};

  // ❌ Reject Mess Request
  const handleReject = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Reject this Mess?",
        text: "This will permanently delete the request.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Reject ❌",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;

      const res = await api.put(`/admin/mess-request/${id}/reject`);
      Swal.fire("Rejected", res.data.message || "Mess request rejected", "info");

      // 🧹 Remove from UI instantly
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (error) {
      console.error("❌ Reject Error:", error);
      Swal.fire("Error", "Failed to reject mess request.", "error");
    }
  };

  // 📈 Format trend data (7-day)
  const trendData = useMemo(() => {
    return (trend || []).map((d) => ({
      _id: new Date(d.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      totalRevenue: d.revenue || d.totalRevenue || 0,
    }));
  }, [trend]);

  // 🚪 Logout handlers
  const handleLogoutClick = () => setShowLogoutPopup(true);
  const handleConfirmLogout = () => {
    logout();
    setShowLogoutPopup(false);
  };

  // 🌀 Loading Screen
  if (loading)
    return (
      <div className="admin-loading-screen">
        <div className="spinner"></div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );

  return (
    <div className="admin-dashboard">
      {/* HEADER */}
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

      <section className="summary-section">
  <div className="summary-card">
    <h3>🛒 Orders (Today)</h3>
    <p>{summary?.totalOrders ?? 0}</p>
  </div>

  <div className="summary-card">
    <h3>🏦 Owner Revenue (₹)</h3>
    <p>{summary?.totalRevenue ?? 0}</p>
  </div>

  <div className="summary-card">
    <h3>💼 Platform Fees (₹)</h3>
    <p>{summary?.totalCommission ?? 0}</p>
  </div>

  <div
    className="summary-card clickable"
    onClick={() => navigate("/admin/owners")}
  >
    <h3>👨‍🍳 Mess Owners</h3>
    <p>{summary?.totalOwners ?? 0}</p>
  </div>

  <div
    className="summary-card clickable"
    onClick={() => navigate("/admin/students")}
  >
    <h3>🎓 Students</h3>
    <p>{summary?.totalStudents ?? 0}</p>
  </div>

  <div
    className="summary-card clickable"
    onClick={() => navigate("/admin/delivery-agents")}
  >
    <h3>🚴‍♂️ Delivery Agents</h3>
    <p>{summary?.totalDeliveryAgents ?? 0}</p>
  </div>
</section>


      {/* REVENUE TREND */}
      <section className="chart-section">
        <h2>📈 Revenue Trend (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip formatter={(v) => [`₹${v}`, "Revenue"]} />
            <Line
              type="linear"
              dataKey="totalRevenue"
              stroke="#007bff"
              strokeWidth={2.5}
              dot={{ r: 5 }}
              activeDot={{ r: 8 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>
      {/* 💰 PAYOUTS SECTION */}
<section className="table-section">
  <div className="payout-header">
    <h2>💰 Mess Owner Payouts</h2>

    {/* 🔽 Settlement Cycle Filter */}
    <div className="cycle-filter">
      <label>📅 Select Cycle:</label>
      <select
        value={selectedCycle}
        onChange={(e) => {
          setSelectedCycle(e.target.value);
          fetchPayouts(e.target.value);
        }}
      >
        <option value="">All Cycles</option>
        <option
          value={`${new Date().getFullYear()}-${String(
            new Date().getMonth() + 1
          ).padStart(2, "0")}-C1`}
        >
          1 – 10 {new Date().toLocaleString("default", { month: "short" })}
        </option>
        <option
          value={`${new Date().getFullYear()}-${String(
            new Date().getMonth() + 1
          ).padStart(2, "0")}-C2`}
        >
          11 – 20 {new Date().toLocaleString("default", { month: "short" })}
        </option>
        <option
          value={`${new Date().getFullYear()}-${String(
            new Date().getMonth() + 1
          ).padStart(2, "0")}-C3`}
        >
          21 – 30 {new Date().toLocaleString("default", { month: "short" })}
        </option>
      </select>
    </div>
  </div>

  <p className="cycle-info">
    Showing records for:{" "}
    <b>{selectedCycle || "All Current Cycles (This Month)"}</b>
  </p>

  {/* 💸 Payout Table */}
  {loadingPayouts ? (
    <p>Loading payouts...</p>
  ) : payouts.length === 0 ? (
    <p>No payout data available.</p>
  ) : (
    <div className="payout-table-wrapper">
      <table className="earnings-table">
        <thead>
          <tr>
            <th>Mess</th>
            <th>Owner</th>
            <th>Email</th>
            <th>Orders</th>
            <th>Revenue</th>
            <th>Commission</th>
            <th>Payable</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((p, idx) => (
            <tr key={idx}>
              <td>{p.messName}</td>
              <td>{p.ownerName}</td>
              <td>{p.ownerEmail}</td>
              <td>{p.totalOrders}</td>
              <td>₹{p.totalRevenue}</td>
              <td>₹{p.commission}</td>
              <td>₹{p.payable}</td>
              <td>
                <span
                  className={`status-badge ${
                    p.payoutStatus === "Paid" ? "paid" : "pending"
                  }`}
                >
                  {p.payoutStatus}
                </span>
              </td>
              <td>
                {p.payoutStatus === "Pending" ? (
                  <button
                    className="approve-btn"
                    onClick={() => markAsPaid(p.messId)}
                  >
                    Mark as Paid
                  </button>
                ) : (
                  <button className="paid-btn" disabled>
                    ✓ Paid
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>


      {/* TOP MESSES */}
      <section className="table-section">
        <h2>🏆 Top Performing Messes</h2>
        <table className="earnings-table">
          <thead>
            <tr><th>Mess</th><th>Orders</th><th>Revenue</th></tr>
          </thead>
          <tbody>
            {topMesses.length ? (
              topMesses.map((m) => (
                <tr key={m._id}>
                  <td>{m.name || m.messName || "Unnamed Mess"}</td>
                  <td>{m.orderCount}</td>
                  <td>₹{m.totalRevenue}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" className="no-data">No data yet</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* PENDING MESS REQUESTS */}
      <section className="table-section">
        <h2>📬 Pending Mess Requests</h2>
        <table className="earnings-table">
          <thead>
            <tr>
              <th>Mess</th>
              <th>Owner</th>
              <th>Email</th>
              <th>Location</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length ? (
              requests.map((r) => (
                <tr key={r._id}>
                  <td>{r.name}</td>
                  <td>{r.owner_id?.name}</td>
                  <td>{r.owner_id?.email}</td>
                  <td>{r.location}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="approve-btn" onClick={() => handleApprove(r._id)}>
                      ✅ Approve
                    </button>
                    <button className="reject-btn" onClick={() => handleReject(r._id)}>
                      ❌ Reject
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="no-data">No pending requests</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* DELIVERY PARTNER REQUESTS */}
<section className="table-section">
  <h2>🚴 Delivery Partner Requests</h2>
  <table className="earnings-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>City</th>
        <th>Vehicle</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {deliveryRequests.length ? (
        deliveryRequests.map((d) => (
          <tr key={d._id}>
            <td>{d.name}</td>
            <td>{d.email}</td>
            <td>{d.city}</td>
            <td>{d.vehicleType}</td>
            <td>
              {/* ✅ APPROVE BUTTON */}
              <button
                className="approve-btn"
                onClick={async () => {
                  const { value: password } = await Swal.fire({
                    title: "🔐 Set Password for Delivery Agent",
                    input: "text",
                    inputPlaceholder: "Enter password",
                    showCancelButton: true,
                    confirmButtonText: "Approve ✅",
                    confirmButtonColor: "#28a745",
                    cancelButtonText: "Cancel",
                    inputValidator: (v) =>
                      !v ? "Password is required!" : undefined,
                  });

                  if (!password) return;

                  try {
                    await api.post(`/delivery/approve-delivery/${d._id}`, {
                      generatedPassword: password,
                    });

                    Swal.fire(
                      "✅ Approved!",
                      `${d.name} has been added as Delivery Agent.`,
                      "success"
                    );

                    // 🔄 Remove approved request from table instantly
                    setDeliveryRequests((prev) =>
                      prev.filter((r) => r._id !== d._id)
                    );
                  } catch (err) {
                    console.error("❌ Approve error:", err);
                    Swal.fire("Error", "Failed to approve request.", "error");
                  }
                }}
              >
                ✅ Approve
              </button>

              {/* ❌ REJECT BUTTON */}
              <button
                className="reject-btn"
                onClick={async () => {
                  const confirm = await Swal.fire({
                    title: "Reject Request?",
                    text: `Do you want to reject ${d.name}?`,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Reject ❌",
                    confirmButtonColor: "#d33",
                    cancelButtonText: "Cancel",
                  });

                  if (!confirm.isConfirmed) return;

                  try {
                    await api.delete(`/delivery/reject-delivery/${d._id}`);
                    Swal.fire(
                      "❌ Rejected",
                      `${d.name}'s request has been removed.`,
                      "info"
                    );

                    // 🔄 Remove rejected request from table instantly
                    setDeliveryRequests((prev) =>
                      prev.filter((r) => r._id !== d._id)
                    );
                  } catch (err) {
                    console.error("❌ Reject error:", err);
                    Swal.fire("Error", "Failed to reject request.", "error");
                  }
                }}
              >
                ❌ Reject
              </button>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="5" className="no-data">
            No pending delivery requests
          </td>
        </tr>
      )}
    </tbody>
  </table>
</section>


      {/* REVIEWS */}
      <section className="table-section">
        <h2>⭐ User Reviews</h2>
        <table className="earnings-table">
          <thead><tr><th>User</th><th>Mess</th><th>Rating</th><th>Comment</th></tr></thead>
          <tbody>
            {reviews.length ? (
              reviews.map((r) => (
                <tr key={r._id}>
                  <td>{r.user_id?.name}</td>
                  <td>{r.mess_id?.name}</td>
                  <td>{r.rating}</td>
                  <td>{r.comment}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="no-data">No reviews found</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminDashboard;
