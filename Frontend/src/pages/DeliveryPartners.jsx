import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DeliveryPartners.css";

const DeliveryPartners = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    city: "",
    consent: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const isFormValid =
    formData.fullName.trim() !== "" &&
    formData.phone.trim() !== "" &&
    formData.city.trim() !== "" &&
    formData.consent;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    navigate("/delivery-join", { state: { ...formData } });
  };

  return (
    <div className="delivery-partners-page">
      {/* 🚴 HERO SECTION */}
      <section className="hero-section">
        <div className="hero-left">
          <div className="image-wrapper">
            {/* ✅ Use your local image from public/assets (no import needed) */}
            <img
              src="../assets/partner.png"
              alt="MessMate Delivery Partner Team"
              className="hero-image"
            />
            <div className="overlay"></div>
          </div>

          <div className="hero-text">
            <h1>Deliver food with MessMate.</h1>
            <p>
              Flexible working hours, weekly payments and full insurance
              coverage. Start earning with MessMate today!
            </p>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-form">
            <h2>Become a MessMate Rider</h2>
            <p>Download our app and start earning weekly.</p>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
              />
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
              />

              <div className="checkbox">
                <input
                  type="checkbox"
                  id="consent"
                  name="consent"
                  checked={formData.consent}
                  onChange={handleChange}
                />
                <label htmlFor="consent">
                  I consent to receive communications from MessMate.
                </label>
              </div>

              <button
                type="submit"
                className={`apply-btn ${!isFormValid ? "disabled" : ""}`}
                disabled={!isFormValid}
              >
                Apply Now
              </button>
            </form>

            <div className="store-links">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                alt="WhatsApp"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Play Store"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 💼 WHY JOIN SECTION */}
      <section className="why-join">
        <h2>Why join MessMate?</h2>
        <p>
          We value your time and effort. Here’s why our delivery partners love
          working with us.
        </p>

        <div className="benefits">
          <div className="benefit-card">
            <img
              src="https://cdn-icons-png.flaticon.com/512/2331/2331970.png"
              alt="Weekly Pay"
            />
            <h3>Get Paid Weekly</h3>
            <p>Receive weekly payouts directly to your bank account.</p>
          </div>

          <div className="benefit-card">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3063/3063823.png"
              alt="Flexible Hours"
            />
            <h3>Flexible Working Hours</h3>
            <p>Work whenever you want — full-time or part-time.</p>
          </div>

          <div className="benefit-card">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3081/3081877.png"
              alt="Insurance"
            />
            <h3>Insurance Coverage</h3>
            <p>
              We care about your safety with medical & accidental insurance.
            </p>
          </div>

          <div className="benefit-card">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              alt="Safety Kit"
            />
            <h3>Safety Kit</h3>
            <p>We provide safety equipment including jackets & helmets.</p>
          </div>
        </div>
      </section>

      {/* 🪜 STEPS SECTION */}
      <section className="steps-section">
        <h2>Join MessMate in 3 Easy Steps</h2>
        <div className="steps">
          <div className="step-card">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3523/3523063.png"
              alt="Step 1"
            />
            <h3>Step 1</h3>
            <p>Submit your application online.</p>
          </div>
          <div className="step-card">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4299/4299954.png"
              alt="Step 2"
            />
            <h3>Step 2</h3>
            <p>Complete quick onboarding & training.</p>
          </div>
          <div className="step-card">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4329/4329324.png"
              alt="Step 3"
            />
            <h3>Step 3</h3>
            <p>Start delivering and earning weekly!</p>
          </div>
        </div>
      </section>

      {/* 😊 TESTIMONIALS */}
      <section className="testimonials">
        <h2>Our Happy Partners</h2>
        <div className="testimonial-card">
          <img
            src="https://images.pexels.com/photos/4393661/pexels-photo-4393661.jpeg?auto=compress&cs=tinysrgb&w=800"
            alt="Rider"
          />
          <div>
            <p>
              “Thanks to MessMate, I’m financially independent. I can choose my
              hours and earn easily.”
            </p>
            <strong>— Ayesha, MessMate Delivery Partner</strong>
          </div>
        </div>
      </section>

      {/* 🎥 KNOW MORE SECTION */}
      <section className="know-more">
        <div className="video-section">
          <img
            src="https://images.pexels.com/photos/4393444/pexels-photo-4393444.jpeg?auto=compress&cs=tinysrgb&w=800"
            alt="Delivery Partner Video"
          />
          <div className="play-button">▶</div>
        </div>

        <div className="text-section">
          <h2>Want to know more?</h2>
          <p>
            Watch this video to learn about the benefits of joining MessMate.
            Still have questions? We’re happy to help.
          </p>
          <div className="action-buttons">
            <button className="faq-btn">Check FAQs</button>
            <button className="contact-btn">Contact Us</button>
          </div>
        </div>
      </section>

      {/* ⚙️ FOOTER SECTION */}
      <footer className="partner-footer">
        <div className="footer-content">
          <div className="footer-column">
            <h3>Company</h3>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>For You</h3>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Social Links</h3>
            <div className="social-icons">
              <a href="https://facebook.com" target="_blank" rel="noreferrer">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/5968/5968764.png"
                  alt="Facebook"
                />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
                  alt="YouTube"
                />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            By continuing past this page, you agree to our{" "}
            <a href="#">Terms of Service</a>, <a href="#">Cookie Policy</a>,{" "}
            <a href="#">Privacy Policy</a> and <a href="#">Content Policies</a>.
          </p>
          <p>© 2025 MessMate™ Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default DeliveryPartners;
