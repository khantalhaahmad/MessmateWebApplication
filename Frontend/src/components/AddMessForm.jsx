import React, { useState, useContext } from "react";
import "../styles/AddMessForm.css";
import api from "../services/api";
import { AuthContext } from "../Context/AuthContext";
import Swal from "sweetalert2"; // ✅ Import SweetAlert2

const AddMessForm = () => {
  const { user } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    mobile: "",
    email: "",
    address: "",
    location: "",
    city: "",
    price_range: "",
    offer: "",
    pancard: null,
    fssai: null,
    menuPhoto: null,
    bankDetails: null,
  });

  const [menuItems, setMenuItems] = useState([
    { name: "", price: "", description: "", isVeg: true },
  ]);

  // handle input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({ ...formData, [name]: files ? files[0] : value });
  };

  const handleMenuChange = (i, field, value) => {
    const updated = [...menuItems];
    updated[i][field] = value;
    setMenuItems(updated);
  };

  const addMenuItem = () =>
    setMenuItems([
      ...menuItems,
      { name: "", price: "", description: "", isVeg: true },
    ]);

  const validateStep = () => {
    if (step === 1) {
      const { name, ownerName, mobile, email, address, city } = formData;
      return name && ownerName && mobile && email && address && city;
    }
    if (step === 2) {
      return menuItems.every((item) => item.name && item.price);
    }
    if (step === 3) {
      return formData.pancard && formData.fssai && formData.menuPhoto;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((s) => s + 1);
    } else {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Details",
        text: "Please fill all required fields before continuing.",
        confirmButtonColor: "#e23744",
      });
    }
  };

  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key]) data.append(key, formData[key]);
      });
      data.append("menu", JSON.stringify({ items: menuItems }));

      const res = await api.post("/mess-request", data, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        // ✅ SweetAlert success popup
        Swal.fire({
          icon: "success",
          title: "Mess Requested Successfully 🎉",
          text: "Your mess request has been submitted successfully! Admin will review and approve it shortly.",
          confirmButtonColor: "#e23744",
        });

        // reset form
        setFormData({
          name: "",
          ownerName: "",
          mobile: "",
          email: "",
          address: "",
          location: "",
          city: "",
          price_range: "",
          offer: "",
          pancard: null,
          fssai: null,
          menuPhoto: null,
          bankDetails: null,
        });
        setMenuItems([{ name: "", price: "", description: "", isVeg: true }]);
        setStep(1);
      } else {
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: "Something went wrong while submitting your request.",
          confirmButtonColor: "#e23744",
        });
      }
    } catch (err) {
      console.error("❌ Error submitting request:", err);
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Failed to submit your mess request. Please try again later.",
        confirmButtonColor: "#e23744",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="addmess-page">
      <div className="addmess-container">
        {/* Sidebar */}
        <aside className="onboarding-sidebar">
          <h3>Complete your registration</h3>
          <ul>
            <li className={step === 1 ? "active" : step > 1 ? "done" : ""}>
              🏠 Mess Information
            </li>
            <li className={step === 2 ? "active" : step > 2 ? "done" : ""}>
              🍱 Menu Details
            </li>
            <li className={step === 3 ? "active" : step > 3 ? "done" : ""}>
              📄 Required Documents
            </li>
            <li className={step === 4 ? "active" : ""}>✅ Submit</li>
          </ul>
        </aside>

        {/* Form */}
        <form className="onboarding-form" onSubmit={handleSubmit}>
          {/* Step 1 */}
          {step === 1 && (
            <div className="form-step">
              <h2>Mess Information</h2>
              <div className="form-card">
                <h4>Basic Details</h4>
                <div className="form-grid">
                  <input
                    type="text"
                    name="name"
                    placeholder="Mess / Restaurant Name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="ownerName"
                    placeholder="Owner Full Name"
                    value={formData.ownerName}
                    onChange={handleChange}
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="mobile"
                    placeholder="Mobile Number"
                    value={formData.mobile}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-card">
                <h4>Mess Address</h4>
                <div className="form-grid">
                  <input
                    type="text"
                    name="address"
                    placeholder="Full Address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="location"
                    placeholder="Area / Locality"
                    value={formData.location}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="price_range"
                    placeholder="Average Price Range (₹100 - ₹200)"
                    value={formData.price_range}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button type="button" className="next-btn" onClick={nextStep}>
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="form-step">
              <h2>Menu Details</h2>
              <div className="form-card">
                {menuItems.map((item, i) => (
                  <div key={i} className="menu-item-row">
                    <input
                      type="text"
                      placeholder="Dish Name"
                      value={item.name}
                      onChange={(e) =>
                        handleMenuChange(i, "name", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      placeholder="Price (₹)"
                      value={item.price}
                      onChange={(e) =>
                        handleMenuChange(i, "price", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        handleMenuChange(i, "description", e.target.value)
                      }
                    />
                    <select
                      value={item.isVeg ? "veg" : "non-veg"}
                      onChange={(e) =>
                        handleMenuChange(i, "isVeg", e.target.value === "veg")
                      }
                    >
                      <option value="veg">Veg</option>
                      <option value="non-veg">Non-Veg</option>
                    </select>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-dish-btn"
                  onClick={addMenuItem}
                >
                  + Add Another Dish
                </button>
              </div>

              <div className="nav-buttons">
                <button type="button" onClick={prevStep} className="back-btn">
                  ← Back
                </button>
                <button type="button" onClick={nextStep} className="next-btn">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="form-step">
              <h2>Upload Required Documents</h2>
              <div className="form-card upload-section">
                <div className="upload-grid">
                  {[
                    { id: "pancard", label: "📄 PAN Card", name: "pancard" },
                    { id: "fssai", label: "📎 FSSAI License", name: "fssai" },
                    { id: "menuPhoto", label: "🍽️ Menu Photo", name: "menuPhoto" },
                    { id: "bankDetails", label: "🏦 Bank Details", name: "bankDetails" },
                  ].map((file) => (
                    <div key={file.id} className="upload-box">
                      <input
                        type="file"
                        id={file.id}
                        name={file.name}
                        onChange={handleChange}
                      />
                      <label htmlFor={file.id} className="upload-label">
                        {file.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="nav-buttons">
                <button type="button" onClick={prevStep} className="back-btn">
                  ← Back
                </button>
                <button type="button" onClick={nextStep} className="next-btn">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="form-step">
              <h2>Review and Submit</h2>
              <div className="form-card review-section">
                <p>
                  Please review your mess details before submitting.
                  Once approved, your mess will appear in MessMate.
                </p>
              </div>

              <div className="review-buttons">
                <button type="button" onClick={prevStep} className="back-btn">
                  ← Back
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddMessForm;
