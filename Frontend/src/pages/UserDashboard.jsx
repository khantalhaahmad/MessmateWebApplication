import React, { useState, useEffect, useContext } from "react";
import "../styles/UserDashboard.css";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Home,
  ShoppingBag,
  Star,
  Settings,
  LogOut,
  MapPin,
  Bell,
  BarChart3,
  Wallet,
} from "lucide-react";
import LogoutPopup from "../components/LogoutPopup";
import api from "../services/api";
import { AuthContext } from "../Context/AuthContext";
import Swal from "sweetalert2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const UserDashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [orders, setOrders] = useState([]);
  const [recommendedMesses, setRecommendedMesses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    avgOrderValue: 0,
  });

  /* ============================================================
     🚀 Fetch Dashboard Data
  ============================================================ */
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (authLoading || !user?._id) return;
        setLoading(true);

        const token = localStorage.getItem("token");
        if (!token) {
          Swal.fire("Session expired", "Please log in again.", "warning");
          navigate("/login", { replace: true });
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        };

        console.log("📡 Fetching dashboard for:", user?.name, "| ID:", user?._id);

        // ✅ Fixed endpoint here (removed /user/)
        const [ordersRes, recRes, reviewsRes] = await Promise.allSettled([
          api.get("/orders/my-orders", config),
          api.get(`/recommendations/${user._id}`, config),
          api.get(`/reviews/user/${user._id}`, config),
        ]);

        const safeOrders = Array.isArray(ordersRes.value?.data)
          ? ordersRes.value.data
          : [];
        const safeRecs = Array.isArray(recRes.value?.data?.data)
          ? recRes.value.data.data
          : [];
        const safeReviews = Array.isArray(reviewsRes.value?.data)
          ? reviewsRes.value.data
          : [];

        console.log("🍱 Recommended data:", safeRecs);

        setOrders(safeOrders);
        setRecommendedMesses(safeRecs);
        setReviews(safeReviews);

        const totalOrders = safeOrders.length;
        const totalSpent = safeOrders.reduce(
          (sum, o) => sum + (Number(o.total_price) || 0),
          0
        );
        const avgOrderValue = totalOrders ? totalSpent / totalOrders : 0;

        setStats({ totalOrders, totalSpent, avgOrderValue });
        console.log("✅ Dashboard Data Loaded:", { totalOrders, totalSpent, avgOrderValue });
      } catch (err) {
        console.error("❌ Dashboard Fetch Failed:", err);
        Swal.fire({
          icon: "error",
          title: "Dashboard Load Failed",
          text:
            err.response?.data?.message ||
            "Something went wrong while loading your dashboard.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user, navigate]);

  /* ============================================================
     🚪 Logout Handling
  ============================================================ */
  const handleLogoutClick = () => setShowLogoutPopup(true);
  const handleCancelLogout = () => setShowLogoutPopup(false);
  const handleConfirmLogout = () => {
    localStorage.clear();
    navigate("/");
    window.location.reload();
  };

  const handleGoHome = () => navigate("/");
  const handleMessClick = (id) => navigate(`/messes/id/${id}`);

  /* ============================================================
     🕓 Loading & Auth States
  ============================================================ */
  if (authLoading || loading)
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "30vh",
          fontSize: "1.3rem",
          color: "#444",
        }}
      >
        Loading your dashboard...
      </div>
    );

  if (!user) {
    console.warn("🚫 No user found in context. Redirecting...");
    navigate("/login");
    return null;
  }

  /* ============================================================
     🧭 Render Dashboard UI
  ============================================================ */
  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <h1 className="logo">MessMate 🍽️</h1>

        <nav className="menu">
          <a href="#home" className="menu-item active">
            <Home size={18} /> <span>Dashboard</span>
          </a>
          <a href="#orders" className="menu-item">
            <ShoppingBag size={18} /> <span>My Orders</span>
          </a>
          <a href="#reviews" className="menu-item">
            <Star size={18} /> <span>Reviews</span>
          </a>
          <a href="#settings" className="menu-item">
            <Settings size={18} /> <span>Settings</span>
          </a>
        </nav>

        <button className="menu-item go-home-btn" onClick={handleGoHome}>
          <Home size={18} /> <span>Go to Home</span>
        </button>

        <button className="logout-btn" onClick={handleLogoutClick}>
          <LogOut size={18} /> <span>Logout</span>
        </button>
      </aside>

      {/* Main Section */}
      <main className="main">
        <div className="header">
          <div className="user-info">
            <img
              src="https://source.unsplash.com/100x100/?student,profile"
              alt="User"
              className="profile-img"
            />
            <div>
              <h2>Welcome, {user?.name || "User"} 👋</h2>
              <p>Role: {user?.role?.toUpperCase()}</p>
            </div>
          </div>
          <div className="notifications">
            <Bell size={22} />
            <span className="badge">{orders.length}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="stats">
          <div className="card">
            <BarChart3 className="icon orange" />
            <h3>Orders Placed</h3>
            <p>{stats.totalOrders}</p>
          </div>
          <div className="card">
            <Wallet className="icon green" />
            <h3>Total Spent</h3>
            <p>₹{stats.totalSpent}</p>
          </div>
          <div className="card">
            <Star className="icon yellow" />
            <h3>Avg Order Value</h3>
            <p>₹{(stats.avgOrderValue || 0).toFixed(0)}</p>
          </div>
        </div>

        {/* Weekly Chart */}
        <section className="chart-section">
          <h3>Your Weekly Orders 📊</h3>
          {orders.length > 0 ? (
            <Bar
              data={{
                labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                datasets: [
                  {
                    label: "Orders",
                    data: Array(7)
                      .fill(0)
                      .map((_, i) =>
                        orders.filter(
                          (o) => new Date(o.createdAt).getDay() === i
                        ).length
                      ),
                    backgroundColor: "#FF5722",
                    borderRadius: 6,
                  },
                ],
              }}
              options={{
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
              }}
            />
          ) : (
            <p style={{ textAlign: "center", color: "#999" }}>
              No orders yet — start ordering to see insights!
            </p>
          )}
        </section>

        {/* Orders Table */}
        <section id="orders" className="recent-orders">
          <h3>Past Orders 🧾</h3>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Mess</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((o) => (
                  <tr key={o._id}>
                    <td>{o._id?.slice(-6)?.toUpperCase()}</td>
                    <td>{o.mess_name || "Unknown Mess"}</td>
                    <td>
                      {Array.isArray(o.items) && o.items.length > 0
                        ? o.items.map((item, i) => (
                            <div key={i}>
                              {item.name} × {item.quantity}
                            </div>
                          ))
                        : "-"}
                    </td>
                    <td>₹{o.total_price || 0}</td>
                    <td className={`status ${o.status?.toLowerCase() || ""}`}>
                      {o.status || "Pending"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", color: "#888" }}>
                    No orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Reviews */}
        <section id="reviews" className="reviews-section">
          <h3>Your Reviews ⭐</h3>
          <div className="reviews-list">
            {reviews.length > 0 ? (
              reviews.map((r) => (
                <div key={r._id} className="review-card">
                  <h4>{r.mess_name || "Mess"}</h4>
                  <p>"{r.comment || "No comment"}"</p>
                  <span>{"⭐".repeat(r.rating || 0)}</span>
                </div>
              ))
            ) : (
              <p style={{ color: "#888" }}>No reviews yet.</p>
            )}
          </div>
        </section>

        {/* ✅ Recommended Messes */}
        <section id="recommended" className="recommended">
          <h3>Recommended Messes 🍱</h3>
          <div className="mess-grid">
            {recommendedMesses.length === 0 ? (
              <p style={{ color: "#999" }}>No recommendations yet.</p>
            ) : (
              recommendedMesses.map((mess, index) => (
                <div
                  key={index}
                  className="mess-card"
                  onClick={() => handleMessClick(mess.mess_id)}
                >
                  <img
                    src={
                      mess.image?.startsWith("http")
                        ? mess.image
                        : "/assets/default-mess.png"
                    }
                    alt={mess.name || mess.mess_name || "Mess"}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/assets/default-mess.png";
                    }}
                  />
                  <h4>{mess.name || mess.mess_name || "Unknown Mess"}</h4>
                  <div className="mess-info">
                    <span className="rating">
                      <Star size={14} className="yellow" />{" "}
                      {mess.rating?.toFixed(1) || "4.5"}
                    </span>
                    <span className="distance">
                      <MapPin size={14} /> {mess.category || "N/A"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {showLogoutPopup && (
        <LogoutPopup
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
        />
      )}
    </div>
  );
};

export default UserDashboard;
