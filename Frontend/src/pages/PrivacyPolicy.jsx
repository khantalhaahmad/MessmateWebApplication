import React from "react";
import "../styles/InfoPages.css";

const PrivacyPolicy = () => (
  <div className="info-page">
    <h1>Privacy Policy</h1>
    <p>
      MessMate™ values your privacy. We only collect data required to deliver
      smooth service and improve user experience.
    </p>
    <h2>Data We Collect</h2>
    <ul>
      <li>Name, email, phone, and address details</li>
      <li>Order and delivery information</li>
      <li>Device and location data for service optimization</li>
    </ul>
    <h2>Your Rights</h2>
    <p>
      You can request account or data deletion anytime at{" "}
      <strong>support@messmate.com</strong>.
    </p>
  </div>
);

export default PrivacyPolicy;
