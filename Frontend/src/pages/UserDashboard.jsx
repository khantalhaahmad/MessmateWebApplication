// ✅ src/pages/UserDashboard.jsx
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

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // ✅ States
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

  // ✅ Fetch user data, orders, recommendations, reviews
  useEffect(() => {
    if (!user?._id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [orderRes, recRes, reviewRes] = await Promise.all([
          api.get(`/orders/my-orders`),
          api.get(`/recommendations/${user._id}`),
          api.get(`/reviews/${user._id}`),
        ]);

        const ordersData = orderRes.data || [];
        const recommendations = recRes.data?.data || [];
        const reviewsData = reviewRes.data || [];

        // 🧮 Compute stats
        const totalOrders = ordersData.length;
        const totalSpent = ordersData.reduce(
          (sum, o) => sum + (o.total_price || 0),
          0
        );
        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

        setOrders(ordersData);
        setRecommendedMesses(recommendations);
        setReviews(reviewsData);
        setStats({ totalOrders, totalSpent, avgOrderValue });
      } catch (err) {
        console.error("❌ Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // ✅ Handlers
  const handleLogoutClick = () => setShowLogoutPopup(true);
  const handleCancelLogout = () => setShowLogoutPopup(false);
  const handleConfirmLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };
  const handleGoHome = () => navigate("/");
  const handleMessClick = (id) => navigate(`/messes/id/${id}`);

  // ✅ Weekly orders chart
  const weeklyCounts = Array(7).fill(0);
  orders.forEach((o) => {
    const day = new Date(o.createdAt).getDay();
    weeklyCounts[day]++;
  });

  const data = {
    labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      {
        label: "Orders",
        data: weeklyCounts,
        backgroundColor: "#FF5722",
        borderRadius: 6,
      },
    ],
  };
  const options = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  if (loading) return <p className="loading-text">Loading Dashboard...</p>;

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

        {/* 🏠 Go Home Button (matching Owner Dashboard) */}
        <button className="menu-item go-home-btn" onClick={handleGoHome}>
          <Home size={18} /> <span>Go to Home</span>
        </button>

        {/* 🚪 Logout */}
        <button className="logout-btn" onClick={handleLogoutClick}>
          <LogOut size={18} /> <span>Logout</span>
        </button>
      </aside>

      {/* Main Section */}
      <main className="main">
        {/* Header */}
        <div className="header">
          <div className="user-info">
            <img
              src="https://source.unsplash.com/100x100/?student,profile"
              alt="User"
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

        {/* Overview Cards */}
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
          <Bar data={data} options={options} />
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
                    <td className="status">{o.status}</td>
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

        {/* Reviews Section */}
        <section id="reviews" className="reviews-section">
          <h3>Your Reviews ⭐</h3>
          <div className="reviews-list">
            {reviews.length > 0 ? (
              reviews.map((r) => (
                <div key={r._id} className="review-card">
                  <h4>{r.mess_name}</h4>
                  <p>"{r.comment}"</p>
                  <span>{"⭐".repeat(r.rating || 0)}</span>
                </div>
              ))
            ) : (
              <p style={{ color: "#888" }}>No reviews yet.</p>
            )}
          </div>
        </section>

        {/* Recommendations */}
        <section id="recommended" className="recommended">
          <h3>Recommended Messes 🍱</h3>
          <div className="mess-grid">
            {recommendedMesses.length === 0 ? (
              <p style={{ color: "#999" }}>No recommendations available yet.</p>
            ) : (
              recommendedMesses.map((mess, index) => {
                const imageUrl = mess.image
                  ? mess.image.startsWith("http")
                    ? mess.image
                    : `/assets/${mess.image.trim()}`
                  : `/assets/${mess.mess_name
                      ?.replace(/\s+/g, "")
                      .toLowerCase()}.png`;

                const fallbackImage = "/assets/default-mess.png";

                return (
                  <div
                    key={index}
                    className="mess-card"
                    onClick={() => handleMessClick(mess.mess_id)}
                  >
                    <img
                      src={imageUrl}
                      alt={mess.mess_name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = fallbackImage;
                      }}
                    />
                    <h4>{mess.mess_name}</h4>
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
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* Logout Popup */}
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
