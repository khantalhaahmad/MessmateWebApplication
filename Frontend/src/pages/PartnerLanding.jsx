import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PartnerLanding.css";

export default function PartnerLanding() {
  const navigate = useNavigate();

  return (
    <div className="partner-landing">
      {/* 🌅 HERO SECTION */}
      <section
        className="hero-section"
        style={{
          backgroundImage: `url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80")`,
        }}
      >
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>Partner with MessMate and grow your business</h1>

            <div className="offer-badge">
              🎉 0% commission for 1st month!
              <small>Only valid for new mess partners</small>
            </div>

            <div className="hero-buttons">
              <button
                className="btn-primary"
                onClick={() => navigate("/addmess")}
              >
                Register your mess
              </button>
            </div>
          </div>
        </div>
      </section>

    {/* ⚡ MERGED INFO CARD */}
<section className="info-card-section">
  <div className="info-card">
    <div className="info-left">
      <h2>Get started: It only takes 10 minutes</h2>
      <p className="info-subtext">
        Please keep these documents and details ready for a smooth sign-up process.
      </p>

      <div className="docs-grid">
        <div className="doc-item">
          <span className="check">✅</span>
          <div className="doc-text">
            <strong>PAN card</strong>
          </div>
        </div>

        <div className="doc-item">
          <span className="check">✅</span>
          <div className="doc-text">
            <strong>GST number</strong>, if applicable
          </div>
        </div>

        <div className="doc-item">
          <span className="check">✅</span>
          <div className="doc-text">
            <strong>FSSAI license</strong>
            <p className="doc-subtext">
              Don’t have one?{" "}
              <a
                href="https://foscos.fssai.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                Apply here
              </a>
              .
            </p>
          </div>
        </div>

        <div className="doc-item">
          <span className="check">✅</span>
          <div className="doc-text">
            <strong>Menu and food image</strong>
            <p className="doc-subtext">
              What is a profile food image?{" "}
              <a href="#" className="link">
                Refer here
              </a>
              .
            </p>
          </div>
        </div>

        <div className="doc-item">
          <span className="check">✅</span>
          <div className="doc-text">
            <strong>Bank account details</strong>
          </div>
        </div>
      </div>
    </div>

    <div className="info-right">
      <img
        src="/assets/messmate.png"
        alt="MessMate Logo"
        className="messmate-card-img"
      />
    </div>
  </div>
</section>



      
      {/* 💡 WHY PARTNER SECTION */}
<section className="why-partner">
  <h2>Why should you partner with MessMate?</h2>
  <div className="divider"></div>
  <div className="why-grid">
    <div className="why-item">
      <img
        src="https://cdn-icons-png.flaticon.com/512/1077/1077012.png"
        alt="customers"
      />
      <h3>Attract new customers</h3>
      <p>
        Reach hundreds of students, professionals, and hostel residents
        nearby through MessMate.
      </p>
    </div>

    <div className="why-item">
      <img
        src="https://cdn-icons-png.flaticon.com/512/3132/3132693.png"
        alt="delivery"
      />
      <h3>Doorstep delivery convenience</h3>
      <p>
        Let our reliable delivery partners ensure your food reaches
        customers hot and fresh.
      </p>
    </div>

    <div className="why-item">
      <img
        src="https://cdn-icons-png.flaticon.com/512/1256/1256650.png"
        alt="support"
      />
      <h3>Onboarding support</h3>
      <p>
        We guide you through registration, menu setup, and your first
        order — every step of the way.
      </p>
    </div>
  </div>
</section>

{/* ⭐ SUCCESS STORIES SECTION */}
<section className="success-section">
  <h2>Mess Partner Success Stories</h2>
  <div className="stories">
    <div className="story-card">
      <p>
        “MessMate helped us connect with hundreds of nearby students. Our
        orders doubled within a month.”
      </p>
      <div className="story-profile">
        <img
          src="https://randomuser.me/api/portraits/men/32.jpg"
          alt="Arshad"
        />
        <div>
          <h4>Arshad Khan</h4>
          <span>Owner – Khushboo Biryani, Bhubaneswar</span>
        </div>
      </div>
    </div>

    <div className="story-card">
      <p>
        “We started small with just 10 meals a day. Now we serve 80+
        thanks to MessMate’s delivery network.”
      </p>
      <div className="story-profile">
        <img
          src="https://randomuser.me/api/portraits/men/65.jpg"
          alt="Vijay"
        />
        <div>
          <h4>Vijay</h4>
          <span>Owner – Birgo Mess, Cuttack</span>
        </div>
      </div>
    </div>

    <div className="story-card">
      <p>
        “MessMate gave our mess huge online visibility. We’ve grown by
        60% in under three months!”
      </p>
      <div className="story-profile">
        <img
          src="https://randomuser.me/api/portraits/men/48.jpg"
          alt="Sandeep"
        />
        <div>
          <h4>Sandeep K Mohan</h4>
          <span>Owner – Raman Idli Center, Puri</span>
        </div>
      </div>
    </div>
  </div>
</section>

{/* ❓ FAQ SECTION */}
<section className="faq-section">
  <h2>Frequently Asked Questions</h2>
  <div className="faq">
    <details open>
      <summary>
        What are the documents required to partner with MessMate?
      </summary>
      <div className="faq-answer">
        <p>To ensure a smooth onboarding experience, please have the following documents ready:</p>
        <ul>
          <li><strong>PAN card:</strong> Only adult PAN cards are accepted.</li>
          <li><strong>FSSAI license certificate:</strong> Apply or upload your existing license.</li>
          <li><strong>Bank details:</strong> A copy of your cheque or passbook.</li>
          <li><strong>Mess menu:</strong> Your daily or weekly menu details.</li>
          <li><strong>Mess image:</strong> One clear food or mess image for display.</li>
          <li><strong>Optional:</strong> GST certificate if applicable.</li>
        </ul>
      </div>
    </details>

    <details>
      <summary>
        How long does it take for my mess to go live after registration?
      </summary>
      <div className="faq-answer">
        <p>Typically 24–48 hours after document verification.</p>
      </div>
    </details>

    <details>
      <summary>What is the commission after the first month?</summary>
      <div className="faq-answer">
        <p>
          We charge a small commission after your first free month to help
          manage operations and logistics.
        </p>
      </div>
    </details>

    <details>
      <summary>How can I get help if I’m stuck during onboarding?</summary>
      <div className="faq-answer">
        <p>
          Contact us anytime at{" "}
          <a href="mailto:partners@messmate.com">partners@messmate.com</a>.
        </p>
      </div>
    </details>

    <details>
      <summary>How do I receive my payouts?</summary>
      <div className="faq-answer">
        <p>
          Payments are directly credited to your registered bank account weekly.
        </p>
      </div>
    </details>
  </div>
</section>

{/* 🦶 FOOTER */}
<footer className="partner-footer">
  <div className="footer-top">
    <div>
      <img src="/assets/messmate.png" alt="MessMate Logo" />
      <p>Partner with us and grow your local mess business.</p>
    </div>
    <div>
      <h4>For Mess Owners</h4>
      <ul>
        <li>Partner With Us</li>
        <li>Delivery Help</li>
        <li>Payment Support</li>
      </ul>
    </div>
    <div>
      <h4>Learn More</h4>
      <ul>
        <li>Privacy</li>
        <li>Terms</li>
        <li>Support</li>
      </ul>
    </div>
    <div>
      <h4>Contact</h4>
      <p>
        📧 <a href="mailto:partners@messmate.com">partners@messmate.com</a>
      </p>
    </div>
  </div>
  <p className="footer-bottom">
    © {new Date().getFullYear()} MessMate™. All rights reserved.
  </p>
</footer>

    </div>
  );
}
