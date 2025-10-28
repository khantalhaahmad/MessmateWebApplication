// ✅ src/components/AddMessForm.jsx — Market-Launch Final Version (FIXED)
import React, { useState, useContext } from "react";
import "../styles/AddMessForm.css";
import api from "../services/api";
import { AuthContext } from "../Context/AuthContext";
import Swal from "sweetalert2";

const AddMessForm = () => {
  const { user } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    email: "",
    mobile: "",
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

  // Handle input
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

  // Step validation
  const validateStep = () => {
    if (step === 1) {
      const { name, location, email, mobile, price_range } = formData;
      return name && location && email && mobile && price_range;
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
    if (validateStep()) setStep((s) => s + 1);
    else Swal.fire("Incomplete Details", "Please fill all required fields.", "warning");
  };

  const prevStep = () => setStep((s) => s - 1);

  // ✅ Submit Handler (sends to /mess-request)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();

      // Append all text fields
      data.append("name", formData.name);
      data.append("location", formData.location);
      data.append("email", formData.email);
      data.append("mobile", formData.mobile);
      data.append("price_range", formData.price_range);
      data.append("offer", formData.offer || "");

      // Append menu JSON
      data.append("menu", JSON.stringify(menuItems));

      // Append document files
      if (formData.pancard) data.append("pancard", formData.pancard);
      if (formData.fssai) data.append("fssai", formData.fssai);
      if (formData.menuPhoto) data.append("menuPhoto", formData.menuPhoto);
      if (formData.bankDetails) data.append("bankDetails", formData.bankDetails);

      // ✅ Debug log (optional)
      for (let [key, val] of data.entries()) console.log(key, val);

      // API CALL
      const res = await api.post("/mess-request", data, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.status === 201 || res.data.success) {
        Swal.fire(
          "Request Submitted 🎉",
          "Your mess request has been sent for admin approval.",
          "success"
        );

        // Reset
        setFormData({
          name: "",
          location: "",
          email: "",
          mobile: "",
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
        Swal.fire("Error", "Something went wrong while submitting.", "error");
      }
    } catch (err) {
      console.error("❌ Error submitting request:", err);
      const message =
        err.response?.data?.errors?.map((e) => e.msg).join(", ") ||
        err.response?.data?.message ||
        "Server error. Try again.";
      Swal.fire("Error", message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ UI Steps
  return (
    <div className="addmess-page">
      <div className="addmess-container">
        {/* Sidebar */}
        <aside className="onboarding-sidebar">
          <h3>Complete your registration</h3>
          <ul>
            <li className={step === 1 ? "active" : step > 1 ? "done" : ""}>🏠 Mess Info</li>
            <li className={step === 2 ? "active" : step > 2 ? "done" : ""}>🍱 Menu</li>
            <li className={step === 3 ? "active" : step > 3 ? "done" : ""}>📄 Documents</li>
            <li className={step === 4 ? "active" : ""}>✅ Submit</li>
          </ul>
        </aside>

        {/* Form */}
        <form className="onboarding-form" onSubmit={handleSubmit}>
          {/* Step 1 - Basic Info */}
          {step === 1 && (
            <div className="form-step">
              <h2>Mess Information</h2>
              <div className="form-grid">
                <input name="name" placeholder="Mess / Restaurant Name" value={formData.name} onChange={handleChange} />
                <input name="location" placeholder="Area / Locality" value={formData.location} onChange={handleChange} />
                <input name="email" type="email" placeholder="Owner Email" value={formData.email} onChange={handleChange} />
                <input name="mobile" type="tel" placeholder="Owner Mobile Number" value={formData.mobile} onChange={handleChange} />
                <input name="price_range" placeholder="Average Price Range (₹100 - ₹200)" value={formData.price_range} onChange={handleChange} />
                <input name="offer" placeholder="Special Offer (optional)" value={formData.offer} onChange={handleChange} />
              </div>
              <button type="button" className="next-btn" onClick={nextStep}>Continue →</button>
            </div>
          )}

          {/* Step 2 - Menu */}
          {step === 2 && (
            <div className="form-step">
              <h2>Menu Details</h2>
              {menuItems.map((item, i) => (
                <div key={i} className="menu-item-row">
                  <input type="text" placeholder="Dish Name" value={item.name} onChange={(e) => handleMenuChange(i, "name", e.target.value)} />
                  <input type="number" placeholder="Price (₹)" value={item.price} onChange={(e) => handleMenuChange(i, "price", e.target.value)} />
                  <input type="text" placeholder="Description" value={item.description} onChange={(e) => handleMenuChange(i, "description", e.target.value)} />
                  <select value={item.isVeg ? "veg" : "non-veg"} onChange={(e) => handleMenuChange(i, "isVeg", e.target.value === "veg")}>
                    <option value="veg">Veg</option>
                    <option value="non-veg">Non-Veg</option>
                  </select>
                </div>
              ))}
              <button type="button" className="add-dish-btn" onClick={addMenuItem}>+ Add Another Dish</button>
              <div className="nav-buttons">
                <button type="button" onClick={prevStep} className="back-btn">← Back</button>
                <button type="button" onClick={nextStep} className="next-btn">Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3 - Documents */}
          {step === 3 && (
            <div className="form-step">
              <h2>Upload Documents</h2>
              <div className="upload-grid">
                {[
                  { id: "pancard", label: "📄 PAN Card", name: "pancard" },
                  { id: "fssai", label: "📎 FSSAI License", name: "fssai" },
                  { id: "menuPhoto", label: "🍽️ Menu Photo", name: "menuPhoto" },
                  { id: "bankDetails", label: "🏦 Bank Details", name: "bankDetails" },
                ].map((file) => (
                  <div key={file.id} className="upload-box">
                    <input type="file" id={file.id} name={file.name} onChange={handleChange} />
                    <label htmlFor={file.id} className="upload-label">{file.label}</label>
                  </div>
                ))}
              </div>
              <div className="nav-buttons">
                <button type="button" onClick={prevStep} className="back-btn">← Back</button>
                <button type="button" onClick={nextStep} className="next-btn">Continue →</button>
              </div>
            </div>
          )}

          {/* Step 4 - Submit */}
          {step === 4 && (
            <div className="form-step">
              <h2>Review & Submit</h2>
              <p>Please review your details before submitting. Once approved by admin, your mess will appear in MessMate.</p>
              <div className="review-buttons">
                <button type="button" onClick={prevStep} className="back-btn">← Back</button>
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
