import React, { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/AdminDataPage.css";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const AdminRevenueReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const query = new URLSearchParams(window.location.search);
  const startDate = query.get("startDate");
  const endDate = query.get("endDate");
  const messName = query.get("messName");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.post(
          "/admin-extra/revenue-range",
          { startDate, endDate, messName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReport(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch revenue report:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [startDate, endDate, messName]);

  if (loading) return <div className="admin-loading-screen">Loading Revenue Report...</div>;

  const isAllMesses = messName === "all";
  const trendData = isAllMesses ? report || [] : report?.trend || [];

  const totalOrders = isAllMesses
    ? trendData.reduce((sum, d) => sum + (d.totalOrders || 0), 0)
    : report?.totalOrders || 0;

  const totalRevenue = isAllMesses
    ? trendData.reduce((sum, d) => sum + (d.totalEarnings || 0), 0)
    : report?.totalRevenue || 0;

  const avgRating = report?.avgRating || "N/A";
  const reviews = report?.reviews || [];

  return (
    <div className="admin-data-page">
      {/* HEADER */}
      <header className="revenue-header">
        <h1>📊 Revenue Report</h1>
        <button className="back-btn" onClick={() => window.history.back()}>
          ← Back to Dashboard
        </button>
      </header>

      {/* INFO TEXT */}
      <p className="report-subtext">
        Showing revenue for{" "}
        <strong>{isAllMesses ? "All Messes" : messName}</strong> from{" "}
        <strong>{startDate}</strong> to <strong>{endDate}</strong>.
      </p>

      {/* ===== Summary Metrics ===== */}
      <div className="metrics-container">
        <div className="metric-card">
          <h3>Total Orders</h3>
          <p>{totalOrders}</p>
        </div>
        <div className="metric-card">
          <h3>Total Revenue (₹)</h3>
          <p>{totalRevenue}</p>
        </div>
        {!isAllMesses && (
          <div className="metric-card">
            <h3>Average Rating ⭐</h3>
            <p>{avgRating}</p>
          </div>
        )}
      </div>

      {/* ===== Chart Section ===== */}
      <section className="chart-section">
        <h2>
          {isAllMesses
            ? "📈 Revenue Comparison (All Messes)"
            : `📈 Daily Revenue Trend (${messName})`}
        </h2>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2b3a67" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2b3a67" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey={isAllMesses ? "totalEarnings" : "totalEarnings"}
                stroke="#2b3a67"
                fillOpacity={1}
                fill="url(#colorRev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ===== Reviews Section ===== */}
      {!isAllMesses && (
        <section className="reviews-section">
          <h2>🗒️ Customer Feedback for {messName}</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Rating</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length > 0 ? (
                reviews.map((r, i) => (
                  <tr key={i}>
                    <td>{r.user_id?.name}</td>
                    <td>{r.user_id?.email}</td>
                    <td>{r.rating}</td>
                    <td>{r.comment || "No comment"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">
                    No reviews found for this mess.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
};

export default AdminRevenueReport;
