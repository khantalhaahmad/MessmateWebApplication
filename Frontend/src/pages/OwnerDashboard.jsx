import React, { useState, useEffect, useContext } from "react";
import "../styles/OwnerDashboard.css";
import LogoutPopup from "../components/LogoutPopup";
import {
  Utensils,
  Users,
  Star,
  LogOut,
  Plus,
  Settings,
  TrendingUp,
  Bell,
  IndianRupee,
  Trash2,
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
  const [showAddDishForm, setShowAddDishForm] = useState(false);
  const [newDish, setNewDish] = useState({ name: "", price: "", image: "" });

  // ✅ Fetch data
  useEffect(() => {
    if (!user?._id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [menuRes, orderRes, reviewRes, statRes] = await Promise.all([
          api.get(`/owner/${user._id}/menu`),
          api.get(`/owner/${user._id}/orders`),
          api.get(`/owner/${user._id}/reviews`),
          api.get(`/owner/${user._id}/stats`),
        ]);

        setMenu(menuRes.data.data || menuRes.data || []);
        setOrders(orderRes.data.data || orderRes.data || []);
        setReviews(reviewRes.data.data || reviewRes.data || []);
        setStats(statRes.data || {});
      } catch (err) {
        console.error("❌ Error fetching owner dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // ✅ Add dish
  const handleAddDish = async (e) => {
    e.preventDefault();
    try {
      const messRes = await api.get(`/messes?owner_id=${user._id}`);
      const mess = messRes.data[0];
      if (!mess) return alert("You don’t have a mess yet.");

      const res = await api.post(`/messes/${mess.mess_id}/menu`, newDish);
      setMenu(res.data.menu.items);
      setNewDish({ name: "", price: "", image: "" });
      setShowAddDishForm(false);
    } catch (err) {
      console.error("❌ Error adding dish:", err);
    }
  };

  // ✅ Delete dish
  const handleDeleteDish = async (index) => {
    try {
      const messRes = await api.get(`/messes?owner_id=${user._id}`);
      const mess = messRes.data[0];
      if (!mess) return alert("You don’t have a mess yet.");

      await api.delete(`/messes/${mess.mess_id}/menu/${index}`);
      setMenu(menu.filter((_, i) => i !== index));
    } catch (err) {
      console.error("❌ Error deleting dish:", err);
    }
  };

  const handleLogoutClick = () => setShowLogoutPopup(true);
  const handleCancelLogout = () => setShowLogoutPopup(false);
  const handleConfirmLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };
  const handleGoHome = () => navigate("/");

  // ✅ Chart Data
  const weeklyData = {
    labels: stats.weeklyLabels || [],
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
    labels: stats.monthlyLabels || [],
    datasets: [
      {
        label: "Revenue (₹)",
        data: stats.monthlyRevenue || [0, 0, 0, 0],
        backgroundColor: "#4caf50",
        borderRadius: 6,
      },
    ],
  };

  if (loading) return <p className="loading-text">Loading Dashboard...</p>;

  return (
    <div className="owner-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <h1 className="logo">MessMate 🍽️</h1>
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

      {/* Main Section */}
      <main className="main">
        <div className="header">
          <div>
            <h2>Welcome, {user?.name || "Owner"} 👋</h2>
            <p>Track and manage your mess efficiently</p>
          </div>
          <div className="notifications">
            <Bell size={24} />
          </div>
        </div>

        {/* Overview */}
        <section id="overview" className="owner-stats">
          <div className="card">
            <Utensils className="icon orange" />
            <h3>Total Orders</h3>
            <p>{stats.totalOrders || 0}</p>
          </div>
          <div className="card">
            <IndianRupee className="icon green" />
            <h3>Total Revenue</h3>
            <p>₹{stats.totalRevenue || 0}</p>
          </div>
          <div className="card">
            <Users className="icon blue" />
            <h3>Active Customers</h3>
            <p>{stats.activeCustomers || 0}</p>
          </div>
          <div className="card">
            <Star className="icon yellow" />
            <h3>Average Rating</h3>
            <p>{(stats.avgRating || 0).toFixed(1)}/5</p>
          </div>
        </section>

        {/* Charts */}
        <section className="charts">
          <div className="chart-box">
            <h3>Weekly Orders 📦</h3>
            <Bar data={weeklyData} />
          </div>
          <div className="chart-box">
            <h3>Monthly Revenue 💰</h3>
            <Bar data={revenueData} />
          </div>
        </section>

        {/* Orders */}
        <section id="orders" className="recent-orders">
          <h3>Recent Orders 🧾</h3>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Mess</th>
                <th>Items</th>
                <th>Total Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((o) => (
                  <tr key={o._id}>
                    <td>{o._id.slice(-6).toUpperCase()}</td>
                    <td>{o.mess_name}</td>
                    <td>
                      {o.items.map((item, i) => (
                        <div key={i}>
                          {item.name} × {item.quantity}
                        </div>
                      ))}
                    </td>
                    <td>₹{o.total_price}</td>
                    <td>{o.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", color: "#888" }}>
                    No orders yet.
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
                  <h4>{r.user_name || "Anonymous"}</h4>
                  <p>"{r.comment}"</p>
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
