import React, { useEffect, useState, useContext } from "react";
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
  const [topMesses, setTopMesses] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [requests, setRequests] = useState([]);
  const [messList, setMessList] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMess, setSelectedMess] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const [deliveryRequests, setDeliveryRequests] = useState([]);


  /* ============================================================
     🕒 Live Date & Time Update
  ============================================================ */
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

  /* ============================================================
     🚀 Fetch all dashboard data
  ============================================================ */
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        summaryRes,
        trendsRes,
        topRes,
        payoutsRes,
        reviewsRes,
        requestsRes,
        messListRes,
      ] = await Promise.all([
        api.get("/admin-extra/daily-summary", config),
        api.get("/admin-extra/revenue-trends", config),
        api.get("/admin-extra/top-messes", config),
        api.get("/admin-extra/owner-payouts", config),
        api.get("/admin-extra/recent-reviews", config),
        api.get("/admin-extra/mess-requests/pending", config),
        api.get("/admin-extra/mess-list", config),
      ]);

      setSummary(summaryRes.data);
      setTrends(trendsRes.data);
      setTopMesses(topRes.data);
      setPayouts(payoutsRes.data);
      setReviews(reviewsRes.data);
      setRequests(requestsRes.data);
      setMessList(messListRes.data || []);
    } catch (err) {
      console.error("❌ Dashboard fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ============================================================
// 🚴 Fetch Pending Delivery Requests
// ============================================================
useEffect(() => {
  const fetchDeliveryRequests = async () => {
    try {
      const res = await api.get("/admin/delivery-requests", config);
      setDeliveryRequests(res.data);
    } catch (err) {
      console.error("❌ Error fetching delivery requests:", err);
    }
  };
  fetchDeliveryRequests();
}, []);


  /* ============================================================
   💸 Update payout status
  ============================================================ */
const updatePayoutStatus = async (messName, payoutStatus) => {
  try {
    const response = await api.put(
      "/admin-extra/payout-status",
      { messName, payoutStatus },
      {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      }
    );
    

    if (response.data.success) {
      alert(`✅ ${response.data.message}`);
      setPayouts((prev) =>
        prev.map((p) =>
          p.messName === messName ? { ...p, payoutStatus } : p
        )
      );
    } else {
      alert("Failed to update payout status");
    }
  } catch (err) {
    console.error("❌ Error updating payout:", err);
    alert("Failed to update payout status");
  }
};


  /* ============================================================
     ✅ Approve / Reject Mess Request
  ============================================================ */
  const handleRequestAction = async (id, action) => {
    try {
      await api.put(`/mess-requests/${id}/${action}`, {}, config);
      alert(`✅ Request ${action}ed successfully!`);
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error(`Failed to ${action} request:`, err);
      alert(`❌ Failed to ${action} request.`);
    }
  };
  /* ============================================================
   ✅ Approve / Reject Mess Request (SweetAlert2 Version)
   ============================================================ */
const handleApprove = async (id) => {
  const confirm = await Swal.fire({
    icon: "question",
    title: "Approve Mess Request?",
    text: "This will move it to active Messes.",
    showCancelButton: true,
    confirmButtonText: "Yes, Approve",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#28a745",
  });

  if (!confirm.isConfirmed) return;

  try {
    const res = await api.put(`/admin-extra/mess-request/${id}/approve`, {}, config);
    if (res.data.success) {
      Swal.fire({
        icon: "success",
        title: "Approved!",
        text: "Mess added successfully.",
      });
      setRequests((prev) => prev.filter((r) => r._id !== id));
      setMessList((prev) => [...prev, res.data.mess]);
    }
  } catch (err) {
    console.error("Approval error:", err);
    Swal.fire("Error", "Failed to approve mess.", "error");
  }
};

const handleReject = async (id) => {
  const confirm = await Swal.fire({
    icon: "warning",
    title: "Reject Mess Request?",
    text: "This will permanently delete the request.",
    showCancelButton: true,
    confirmButtonText: "Yes, Reject",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#e23744",
  });

  if (!confirm.isConfirmed) return;

  try {
    const res = await api.put(`/admin-extra/mess-request/${id}/reject`, {}, config);
    if (res.data.success) {
      Swal.fire({
        icon: "info",
        title: "Rejected!",
        text: "Mess request removed successfully.",
      });
      setRequests((prev) => prev.filter((r) => r._id !== id));
    }
  } catch (err) {
    console.error("Rejection error:", err);
    Swal.fire("Error", "Failed to reject mess.", "error");
  }
};

  /* ============================================================
     📊 Handle revenue report navigation
  ============================================================ */
  const handleViewReport = () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    navigate(
      `/admin/revenue-report?startDate=${startDate}&endDate=${endDate}&messName=${selectedMess}`
    );
  };

  /* ============================================================
     🚪 Handle Logout Confirmation
  ============================================================ */
  const handleLogoutClick = () => setShowLogoutPopup(true);
  const handleConfirmLogout = () => {
    logout();
    setShowLogoutPopup(false);
  };
  const handleCancelLogout = () => setShowLogoutPopup(false);

  if (loading || !summary)
    return <div className="admin-loading-screen">Loading Admin Dashboard...</div>;

  /* ============================================================
     🧭 Render Component
  ============================================================ */
  return (
    <div className="admin-dashboard">
      {/* ===== HEADER / NAVBAR ===== */}
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
          <div className="admin-info">
            <span className="admin-name">{user?.name || "Admin"}</span>
          </div>
          <button className="logout-btn" onClick={handleLogoutClick}>
            Logout
          </button>
        </div>
      </header>

      {/* ===== LOGOUT POPUP ===== */}
      {showLogoutPopup && (
        <LogoutPopup
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
        />
      )}

      {/* ===== SUMMARY CARDS ===== */}
      <section className="summary-section">
        <div className="summary-card">
          <h3>🛒 Total Orders (Today)</h3>
          <p>{summary.totalOrders}</p>
        </div>

        <div className="summary-card">
          <h3>💰 Total Revenue (₹)</h3>
          <p>{summary.totalRevenue}</p>
        </div>

        <div
          className="summary-card clickable"
          onClick={() => navigate("/admin/owners")}
        >
          <h3>👨‍🍳 Total Mess Owners</h3>
          <p>{summary.totalOwners}</p>
        </div>

        <div
          className="summary-card clickable"
          onClick={() => navigate("/admin/students")}
        >
          <h3>🎓 Total Students</h3>
          <p>{summary.totalStudents}</p>
        </div>
          <div
    className="summary-card clickable"
    onClick={() => navigate("/admin/delivery-agents")}
  >
    <h3>🚴‍♂️ Total Delivery Agents</h3>
    <p>{summary.totalDeliveryAgents || 0}</p>
  </div>

      </section>

      {/* ===== DATE FILTER ===== */}
      <section className="date-filter">
        <h3>📅 Check Revenue Between Dates</h3>
        <div className="date-inputs">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <select
            value={selectedMess}
            onChange={(e) => setSelectedMess(e.target.value)}
          >
            <option value="all">All Messes</option>
            {messList.map((m) => (
              <option key={m._id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
          <button onClick={handleViewReport}>View</button>
        </div>
      </section>

      {/* ===== REVENUE TREND ===== */}
      <section className="chart-section">
        <h2>📊 Revenue Trend (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="totalRevenue"
              stroke="#0077ff"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>
      {/* ===== TOP MESSES ===== */}
      <section className="table-section">
        <h2>🏆 Top Performing Messes (Today)</h2>
        <table className="earnings-table">
          <thead>
            <tr>
              <th>Mess Name</th>
              <th>Orders</th>
              <th>Earnings (₹)</th>
            </tr>
          </thead>
          <tbody>
            {topMesses.length > 0 ? (
              topMesses.map((m, i) => (
                <tr key={i}>
                  <td>{m._id}</td>
                  <td>{m.totalOrders}</td>
                  <td>{m.totalEarnings}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="no-data">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* ===== PENDING REQUESTS ===== */}
<section className="table-section">
  <h2>📬 Pending Mess Requests</h2>
  <table className="earnings-table">
    <thead>
      <tr>
        <th>Mess Name</th>
        <th>Location</th>
        <th>Owner</th>
        <th>Email</th>
        <th>Status</th>
        <th>Date</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {requests.length > 0 ? (
        requests.map((r, i) => (
          <tr key={i}>
            <td>{r.name || "N/A"}</td>
            <td>{r.location || "N/A"}</td>
            <td>{r.owner_id?.name || "N/A"}</td>
            <td>{r.owner_id?.email || "N/A"}</td>
            <td>
              <span
                className={`status-badge ${
                  r.status === "pending"
                    ? "pending"
                    : r.status === "approved"
                    ? "approved"
                    : "rejected"
                }`}
              >
                {r.status}
              </span>
            </td>
            <td>{new Date(r.createdAt).toLocaleDateString()}</td>
            <td>
              <div className="action-btns">
           <button
  className="btn-approve"
  onClick={() => handleApprove(r._id)}
>
  ✅ Approve
</button>


                <button
  className="btn-reject"
  onClick={() => handleReject(r._id)}
>
  ❌ Reject
</button>

              </div>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="7" className="no-data">
            No pending requests
          </td>
        </tr>
      )}
    </tbody>
  </table>
</section>
{/* ===== PENDING DELIVERY REQUESTS ===== */}
<section className="table-section">
  <h2>🚴 Pending Delivery Agent Requests</h2>
  <table className="earnings-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Phone</th>
        <th>Email</th>
        <th>City</th>
        <th>Vehicle</th>
        <th>Date</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {deliveryRequests.length > 0 ? (
        deliveryRequests.map((r, i) => (
          <tr key={i}>
            <td>{r.name}</td>
            <td>{r.phone}</td>
            <td>{r.email}</td>
            <td>{r.city || "N/A"}</td>
            <td>{r.vehicleType} ({r.vehicleNumber})</td>
            <td>{r.date}</td>
            <td>
              <span className="status-badge pending">{r.status}</span>
            </td>
            <td>
              <div className="action-btns">
                <button
                  className="btn-approve"
                  onClick={() => handleApproveDelivery(r._id)}
                >
                  ✅ Approve
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleRejectDelivery(r._id)}
                >
                  ❌ Reject
                </button>
              </div>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="8" className="no-data">
            No pending delivery requests
          </td>
        </tr>
      )}
    </tbody>
  </table>
</section>


      {/* ===== OWNER PAYOUTS (This Month) ===== */}
<section className="table-section">
  <h2>💸 Owner Payouts (This Month)</h2>
  <table className="earnings-table">
    <thead>
      <tr>
        <th>Mess</th>
        <th>Owner</th>
        <th>Email</th>
        <th>Total</th>
        <th>Commission</th>
        <th>Payable</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {payouts.map((p, i) => (
        <tr key={i}>
          <td>{p.messName}</td>
          <td>{p.ownerName}</td>
          <td>{p.ownerEmail}</td>
          <td>{p.totalRevenue}</td>
          <td>{p.commission}</td>
          <td>{p.payable}</td>
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
                onClick={() => updatePayoutStatus(p.messName, "Paid")}
              >
                💰 Mark as Paid
              </button>
            ) : (
              <button
                className="reject-btn"
                onClick={() => updatePayoutStatus(p.messName, "Pending")}
              >
                ⏳ Mark as Pending
              </button>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</section>


      {/* ===== REVIEWS ===== */}
      <section className="table-section">
        <h2>⭐ Recent Reviews</h2>
        <table className="earnings-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Review</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length > 0 ? (
              reviews.map((r, i) => (
                <tr key={i}>
                  <td>{r.user_id?.name}</td>
                  <td>{r.user_id?.email}</td>
                  <td>{r.comment || "No comment"}</td>
                  <td>{r.rating}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-data">
                  No recent reviews
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminDashboard;
