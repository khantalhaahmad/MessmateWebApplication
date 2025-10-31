// src/components/MessDetails.jsx
import React, { useEffect, useState, memo } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import "../styles/MessDetails.css";

const isHttp = (u) => /^https?:\/\//i.test(u);
const withCld = (url, t = "f_auto,q_auto,w_600") =>
  url && url.includes("/upload/")
    ? url.replace("/upload/", `/upload/${t}/`)
    : url;

const MessDetails = memo(() => {
  const { mess_id } = useParams();
  const [mess, setMess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErrMsg("");
        // 🔁 Keep endpoint consistent with MessMenu
        const res = await api.get(`/messes/${mess_id}`, { signal: ac.signal });
        setMess(res.data);
      } catch (err) {
        console.error("❌ Error fetching mess:", err);
        setErrMsg(err?.response?.data?.message || "Failed to load mess");
        setMess(null);
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [mess_id]);

  if (loading) return <p className="md-loading">Loading mess...</p>;
  if (errMsg) return <p className="md-error">{errMsg}</p>;
  if (!mess) return <p className="md-error">Mess not found</p>;

  const banner = withCld(mess.messCard?.url || mess.banner || "");
  const items = mess.menu?.items || mess.menu || mess.dishes || [];

  return (
    <div className="mess-details">
      <Link to="/" className="back-btn">← Back</Link>

      <div className="md-header">
        {isHttp(banner) && (
          <img src={banner} alt={mess.name || mess.messName || "Mess"} className="md-banner" loading="lazy" />
        )}
        <div className="md-title">
          <h1>{mess.name || mess.messName}</h1>
          <p className="mess-meta">
            📍 {mess.location || "—"} &nbsp; ⏱ {mess.delivery_time || "25–30 mins"} &nbsp; ⭐ {mess.rating || "4.3"}
          </p>
          {mess.offer && <p className="mess-offer">{mess.offer}</p>}
        </div>
      </div>

      <h3>Menu Items</h3>
      {items?.length ? (
        <div className="menu-grid">
          {items.map((it, idx) => {
            const raw = it.imageUrl || it.image || it.url || "";
            const src = isHttp(raw) ? withCld(raw) : "/assets/default-food.png";
            return (
              <div key={it._id || idx} className="menu-card">
                <img
                  src={src}
                  alt={it.name || `item-${idx}`}
                  className="menu-img"
                  loading="lazy"
                  onError={(e) => (e.currentTarget.src = "/assets/default-food.png")}
                />
                <h4>{it.name}</h4>
                <p>₹{it.price ?? "-"}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p>No menu items available.</p>
      )}
    </div>
  );
});

export default MessDetails;
