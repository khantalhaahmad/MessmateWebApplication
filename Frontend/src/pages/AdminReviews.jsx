import React, { useEffect, useState, useContext } from "react";
import api from "../services/api";
import Swal from "sweetalert2";
import { AuthContext } from "../Context/AuthContext";
import "../styles/AdminDataPage.css";

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    api
      .get("/admin/reviews", config)
      .then((res) => setReviews(res.data))
      .catch(() => Swal.fire("Error", "Failed to fetch reviews", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete this review?",
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
      Swal.fire("Error", "Failed to delete review", "error");
    }
  };

  return (
    <div className="admin-data-page">
      <header className="admin-header-bar">
        <h1>⭐ User Reviews</h1>
        <div className="admin-header-right">
          <div className="admin-name-badge">{user?.name || "Admin"}</div>
          <button className="back-btn" onClick={() => window.history.back()}>
            ← Back
          </button>
        </div>
      </header>

      {loading ? (
        <div className="loading">Loading reviews...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Mess</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length > 0 ? (
                reviews.map((r) => (
                  <tr key={r._id}>
                    <td>{r.user_id?.name}</td>
                    <td>{r.user_id?.email}</td>
                    <td>{r.mess_id?.name}</td>
                    <td>{r.rating}</td>
                    <td>{r.comment}</td>
                    <td>
                      <button className="btn-reject" onClick={() => handleDelete(r._id)}>
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    No reviews found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
