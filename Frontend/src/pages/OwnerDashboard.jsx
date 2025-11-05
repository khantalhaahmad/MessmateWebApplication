import React, { useState, useEffect, useContext, useRef } from "react";
import "../styles/OwnerDashboard.css";
import LogoutPopup from "../components/LogoutPopup";
import {
  Utensils,
  Users,
  Star,
  LogOut,
  Settings,
  TrendingUp,
  Bell,
  IndianRupee,
  Home,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import api from "../services/api";
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { io } from "socket.io-client";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../firebase";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const OwnerDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [newOrderSound] = useState(new Audio("/assets/notification.mp3"));
  const socketRef = useRef(null);

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  /* ============================================================
     🚀 Fetch Owner Dashboard Data
  ============================================================ */
  useEffect(() => {
    if (!user?._id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("📡 Fetching owner dashboard data...");

        const [menuRes, orderRes, reviewRes, statRes] = await Promise.allSettled([
          api.get(`/messes?owner_id=${user._id}`, config),
          api.get(`/orders/owner/${user._id}`, config),
          api.get(`/reviews/owner/${user._id}`, config),
          api.get(`/owner/${user._id}/stats`, config),
        ]);

        const safe = (res) => res.value?.data?.data || res.value?.data || [];

        const messData = safe(menuRes);
        const ownerMenu = messData[0]?.menu?.items || [];

        setMenu(ownerMenu);
        setOrders(safe(orderRes).orders || safe(orderRes) || []);
        setReviews(safe(reviewRes).reviews || safe(reviewRes) || []);
        setStats(statRes.value?.data || {});
        console.log("✅ Owner dashboard loaded successfully");
      } catch (err) {
        console.error("❌ Owner dashboard fetch failed:", err);
        Swal.fire("Error", "Unable to load dashboard data. Please refresh.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  /* ============================================================
     🔔 SOCKET.IO + FCM SETUP (Real-time Orders)
  ============================================================ */
  useEffect(() => {
    if (!user?._id) return;

    // Initialize socket
    socketRef.current = io(import.meta.env.VITE_API_URL_PROD || "https://messmate-backend.onrender.com", {
      transports: ["websocket"],
    });

    socketRef.current.emit("join_room", `owner_${user._id}`);
    console.log("✅ Joined Socket Room:", `owner_${user._id}`);

    // Listen for new orders
    socketRef.current.on("new_order", (order) => {
      console.log("📦 New Order Received:", order);
      newOrderSound.play();
      Swal.fire({
        title: "🍱 New Order Received!",
        text: `${order.items.length} items worth ₹${order.total_price}`,
        icon: "info",
        confirmButtonColor: "#ff6b00",
      });
      setOrders((prev) => [order, ...prev]);
    });

    // FCM Setup
    const registerFCM = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const fcmToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID,
          });
          if (fcmToken) {
            await api.post(
              "/users/save-fcm-token",
              { token: fcmToken },
              config
            );
            console.log("📱 FCM token saved successfully!");
          }
        }
      } catch (err) {
        console.warn("⚠️ FCM registration failed:", err.message);
      }
    };

    registerFCM();

    onMessage(messaging, (payload) => {
      console.log("🔔 FCM Message:", payload);
      newOrderSound.play();
      Swal.fire("🍽️ Notification", payload.notification.body, "info");
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user]);

  /* ============================================================
     🚪 Logout
  ============================================================ */
  const handleLogoutClick = () => setShowLogoutPopup(true);
  const handleCancelLogout = () => setShowLogoutPopup(false);
  const handleConfirmLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleGoHome = () => navigate("/");

  /* ============================================================
     📊 Chart Data
  ============================================================ */
  const weeklyData = {
    labels: stats.weeklyLabels || ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      {
        label: "Orders",
        data: stats.weeklyOrders || [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: "#ff5722",
        borderRadius: 6,
      },
    ],
  };

  const revenueData = {
    labels: stats.monthlyLabels || ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Revenue (₹)",
        data: stats.monthlyRevenue || [0, 0, 0, 0],
        backgroundColor: "#4caf50",
        borderRadius: 8,
        barThickness: 40,
      },
    ],
  };

  if (loading) return <p className="loading-text">Loading Owner Dashboard...</p>;

  /* ============================================================
     🧭 Render UI
  ============================================================ */
  return (
    <div className="owner-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <h1 className="logo">
          <img src="/assets/messmate.png" alt="MessMate Logo" className="logo-img" />
          MessMate
        </h1>

        <nav className="menu">
          <a href="#overview" className="menu-item active">
            <TrendingUp size={18} /> <span>Overview</span>
          </a>
          <a href="#menu" className="menu-item">
            <Utensils size={18} /> <span>Menu</span>
          </a>
          <a href="#orders" className="menu-item">
            <Users size={18} /> <span>Orders</span>
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

      {/* Main */}
      <main className="main">
        <div className="header">
          <div>
            <h2>Welcome, {user?.name || "Owner"} 👋</h2>
            <p>Manage your mess smartly with live insights</p>
          </div>
          <Bell size={22} />
        </div>

        {/* Overview Cards */}
        <section id="overview" className="owner-stats">
          <div className="card">
            <Utensils className="icon orange" />
            <h3>Total Orders</h3>
            <p>{orders.length || 0}</p>
          </div>
          <div className="card">
            <IndianRupee className="icon green" />
            <h3>Total Revenue</h3>
            <p>₹{orders.reduce((sum, o) => sum + (o.total_price || 0), 0)}</p>
          </div>
          <div className="card">
            <Users className="icon blue" />
            <h3>Active Customers</h3>
            <p>{stats.activeCustomers || 0}</p>
          </div>
          <div className="card">
            <Star className="icon yellow" />
            <h3>Avg Rating</h3>
            <p>{(stats.avgRating || 0).toFixed(1)}/5</p>
          </div>
        </section>

        {/* Charts */}
        <section className="charts">
          <div className="chart-box">
            <h3>Weekly Orders 📦</h3>
            <Bar
              data={weeklyData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
          <div className="chart-box">
            <h3>Monthly Revenue 💰</h3>
            <Bar
              data={revenueData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </section>

        {/* Orders Table */}
        <section id="orders" className="recent-orders">
          <h3>Recent Orders 🧾</h3>
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
                    <td>{o.mess_name || "N/A"}</td>
                    <td>
                      {Array.isArray(o.items)
                        ? o.items.map((i, idx) => (
                            <div key={idx}>
                              {i.name} × {i.quantity}
                            </div>
                          ))
                        : "-"}
                    </td>
                    <td>₹{o.total_price || 0}</td>
                    <td>{o.status || "Pending"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", color: "#888" }}>
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Reviews */}
        <section id="reviews" className="reviews-section">
          <h3>Customer Reviews ⭐</h3>
          <div className="reviews-list">
            {reviews.length > 0 ? (
              reviews.map((r) => (
                <div key={r._id} className="review-card">
                  <h4>{r.user_id?.name || r.user_name || "Anonymous"}</h4>
                  <p>"{r.comment || "No comment"}"</p>
                  <span>{"⭐".repeat(r.rating || 0)}</span>
                </div>
              ))
            ) : (
              <p style={{ color: "#888" }}>No reviews yet.</p>
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

export default OwnerDashboard;
