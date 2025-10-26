import React, { useState, useEffect } from "react";
import "./MessSearch.css";

const MessSearch = ({ messes, onSearchResults }) => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  // Filter messes whenever query or location changes
  useEffect(() => {
    setLoading(true);

    // small debounce to avoid too many updates
    const timer = setTimeout(() => {
      let results = messes;

      if (query) {
        results = results.filter((mess) =>
          mess.name.toLowerCase().includes(query.toLowerCase())
        );
      }

      if (location) {
        results = results.filter(
          (mess) => mess.location.toLowerCase() === location.toLowerCase()
        );
      }

      onSearchResults(results);
      setLoading(false);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer); // cleanup timer
  }, [query, location, messes, onSearchResults]);

  return (
    <div className="mess-search-container">
      <input
        type="text"
        className="mess-search-input"
        placeholder="Search by mess name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        className="mess-location-select"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      >
        <option value="">All Locations</option>
        {[...new Set(messes.map((mess) => mess.location))].map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>
      {loading && <div className="spinner"></div>}
    </div>
  );
};

export default MessSearch;
