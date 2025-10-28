import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        duration: 2500,
        style: {
          background: "#333",
          color: "#fff",
          borderRadius: "10px",
          fontSize: "15px",
        },
      }}
    />
  </BrowserRouter>
);
