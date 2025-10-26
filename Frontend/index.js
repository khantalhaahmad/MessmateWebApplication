// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
import "./index.css"; // optional if you have global CSS

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
