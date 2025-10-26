import React, { useState } from "react";
import "../styles/AddMessOnboarding.css";

export default function AddMessOnboarding() {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const nextStep = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="onboarding-container">
      {/* LEFT SIDEBAR */}
      <aside className="onboarding-sidebar">
        <h3 className="sidebar-title">Complete your registration</h3>
        <ul className="onboarding-steps">
          <li className={step === 1 ? "active" : step > 1 ? "done" : ""}>
            <span>Restaurant information</span>
            <button onClick={() => setStep(1)}>Edit</button>
          </li>
          <li className={step === 2 ? "active" : step > 2 ? "done" : ""}>
            <span>Menu & operational details</span>
            <button onClick={() => setStep(2)}>Edit</button>
          </li>
          <li className={step === 3 ? "active" : step > 3 ? "done" : ""}>
            <span>Restaurant documents</span>
            <button onClick={() => setStep(3)}>Edit</button>
          </li>
          <li className={step === 4 ? "active" : ""}>
            <span>Partner contract</span>
            <button onClick={() => setStep(4)}>Edit</button>
          </li>
        </ul>
      </aside>

      {/* MAIN CONTENT */}
      <main className="onboarding-main">
        {step === 1 && (
          <div className="onboarding-section">
            <h2>Mess Information</h2>
            <div className="card">
              <h4>Mess name</h4>
              <input type="text" placeholder="Enter your mess name" />
              <h4>Owner details</h4>
              <div className="form-row">
                <input type="text" placeholder="Full name" />
                <input type="email" placeholder="Email address" />
                <input type="text" placeholder="Phone number" />
              </div>
              <button className="next-btn" onClick={nextStep}>
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-section">
            <h2>Menu and Operational Details</h2>
            <div className="card">
              <h4>Upload Menu Photo</h4>
              <input type="file" accept="image/*" />
              <h4>Average Price Range</h4>
              <input type="text" placeholder="₹100 - ₹200" />
              <h4>Special Offers</h4>
              <input type="text" placeholder="10% off for students" />
              <div className="nav-buttons">
                <button onClick={prevStep}>← Back</button>
                <button onClick={nextStep}>Next →</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-section">
            <h2>Mess Documents</h2>
            <div className="card">
              <h4>Upload PAN Card</h4>
              <input type="file" accept="image/*" />
              <h4>FSSAI / License Document</h4>
              <input type="file" />
              <div className="nav-buttons">
                <button onClick={prevStep}>← Back</button>
                <button onClick={nextStep}>Next →</button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="onboarding-section">
            <h2>Partner Contract</h2>
            <div className="card">
              <p>
                By submitting, you agree to MessMate’s terms and conditions and confirm that all
                provided information is valid.
              </p>
              <div className="nav-buttons">
                <button onClick={prevStep}>← Back</button>
                <button className="submit-btn">Submit Registration</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
