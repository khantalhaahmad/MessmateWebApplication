import React from "react";
import "../styles/InfoPages.css";

const HelpSupport = () => (
  <div className="info-page">
    <h1>Help & Support</h1>
    <p>Need help? Contact our support team for any issue.</p>

    <h2>Contact Options</h2>
    <ul>
      <li>Email: <strong>support@messmate.com</strong></li>
      <li>Phone: <strong>+91 98765 43210</strong></li>
    </ul>

    <h2>Common Issues</h2>
    <ul>
      <li>Order not delivered? Contact within 30 mins.</li>
      <li>Payment issue? Refunds in 3–5 days.</li>
      <li>Wrong item? Report under “Report a Fraud”.</li>
    </ul>
  </div>
);

export default HelpSupport;
