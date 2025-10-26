import React, { useState } from "react";
import "../styles/PartnerWithUs.css";

export default function PartnerWithUs() {
  const [step, setStep] = useState(1);

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="partner-container">
      {/* LEFT SIDEBAR */}
      <aside className="partner-sidebar">
        <h3 className="sidebar-heading">Complete your registration</h3>
        <ul className="partner-steps">
          <li className={step >= 1 ? "active" : ""}>
            <span>Mess information</span>
          </li>
          <li className={step >= 2 ? "active" : ""}>
            <span>Menu and details</span>
          </li>
          <li className={step >= 3 ? "active" : ""}>
            <span>Documents upload</span>
          </li>
          <li className={step >= 4 ? "active" : ""}>
            <span>Partner agreement</span>
          </li>
        </ul>
      </aside>

      {/* MAIN CONTENT */}
      <main className="partner-main">
        {/* Step 1 */}
        {step === 1 && (
          <div className="partner-card">
            <h2>Mess Information</h2>
            <div className="form-group">
              <label>Mess Name</label>
              <input type="text" placeholder="e.g. Green Garden Mess" />
            </div>
            <div className="form-group">
              <label>Owner Full Name</label>
              <input type="text" placeholder="e.g. Talha Ahmad Khan" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="e.g. khantalhaahmad@gmail.com" />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" placeholder="e.g. 8102195503" />
            </div>
            <div className="form-actions">
              <button className="next-btn" onClick={nextStep}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="partner-card">
            <h2>Menu and Operational Details</h2>
            <div className="form-group">
              <label>Average Price Range</label>
              <input type="text" placeholder="₹100 - ₹200" />
            </div>
            <div className="form-group">
              <label>Upload Menu Image</label>
              <input type="file" accept="image/*" />
            </div>
            <div className="form-group">
              <label>Special Offers</label>
              <input type="text" placeholder="e.g. 10% off for students" />
            </div>
            <div className="form-actions">
              <button onClick={prevStep}>← Back</button>
              <button className="next-btn" onClick={nextStep}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="partner-card">
            <h2>Documents Upload</h2>
            <div className="form-group">
              <label>PAN Card Photo</label>
              <input type="file" accept="image/*" />
            </div>
            <div className="form-group">
              <label>Mess License / Registration Document</label>
              <input type="file" />
            </div>
            <div className="form-actions">
              <button onClick={prevStep}>← Back</button>
              <button className="next-btn" onClick={nextStep}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="partner-card">
            <h2>Partner Agreement</h2>
            <p>
              By submitting, you agree to the MessMate Partner Terms and confirm
              all details provided are true and correct.
            </p>
            <div className="form-actions">
              <button onClick={prevStep}>← Back</button>
              <button className="submit-btn">Submit Registration</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
