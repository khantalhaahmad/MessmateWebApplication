import React, { useState, useContext, useRef, useEffect, useMemo } from "react";
import "../styles/AddMessForm.css";
import api from "../services/api";
import { AuthContext } from "../Context/AuthContext";
import Swal from "sweetalert2";

/** ----------------------------
 *  Production constants
 * ---------------------------- */
const MAX_FILE_MB = 5;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const MAX_TOTAL_MB = 60; // safety: client-side soft cap
const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPT_ATTR = ALLOWED_MIME.join(",");
const MIN_DISHES = 1;
const MAX_DISHES = 50;

const LS_KEY = "addMessDraft@v1"; // localStorage key

const AddMessForm = () => {
  const { user } = useContext(AuthContext);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    email: "",
    mobile: "",
    price_range: "",
    offer: "",
    messBanner: null,
    pancard: null,
    fssai: null,
    // 👇 menuPhoto REMOVED
    bankDetails: null,
  });

  const [bannerPreview, setBannerPreview] = useState(null);

  const [menuItems, setMenuItems] = useState([
    { name: "", price: "", description: "", isVeg: true, image: null, preview: null, _id: cryptoRandom() },
  ]);

  // warnings / inline errors
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalErrors, setGlobalErrors] = useState([]);

  // keep track of object URLs to revoke on unmount
  const objectUrlsRef = useRef([]);

  // ---------- helpers ----------
  function cryptoRandom() {
    try { return crypto.getRandomValues(new Uint32Array(1))[0].toString(36); }
    catch { return Math.random().toString(36).slice(2); }
  }
  const bytesToMB = (b) => (b / (1024 * 1024)).toFixed(2);
  const isAllowedFile = (f) => f && ALLOWED_MIME.includes(f.type);

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validateMobile = (v) => /^[0-9]{10}$/.test(v);

  const calcTotalBytes = useMemo(() => {
    let t = 0;
    const add = (f) => { if (f instanceof File) t += f.size || 0; };
    Object.values(formData).forEach(add);
    menuItems.forEach((m) => add(m.image));
    return t;
  }, [formData, menuItems]);

  useEffect(() => {
    // draft restore (textual fields only)
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setFormData((prev) => ({ ...prev, ...saved.formData, messBanner: null }));
        setMenuItems((saved.menuItems || [{ name: "", price: "", description: "", isVeg: true }]).map((m) => ({
          name: m.name || "",
          price: m.price || "",
          description: m.description || "",
          isVeg: !!m.isVeg,
          image: null,
          preview: null,
          _id: cryptoRandom(),
        })));
      }
    } catch {}
    return () => {
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    // warn on close if dirty (simple heuristic)
    const handler = (e) => {
      if (loading) return; // don’t block during upload
      const somethingFilled =
        formData.name || formData.location || formData.email || formData.mobile || formData.price_range ||
        menuItems.some((m) => m.name || m.price || m.description);
      if (somethingFilled) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [formData, menuItems, loading]);

  useEffect(() => {
    // save draft (text/flags only)
    const toSave = {
      formData: {
        name: formData.name,
        location: formData.location,
        email: formData.email,
        mobile: formData.mobile,
        price_range: formData.price_range,
        offer: formData.offer,
      },
      menuItems: menuItems.map(({ name, price, description, isVeg }) => ({
        name, price, description, isVeg,
      })),
    };
    try { localStorage.setItem(LS_KEY, JSON.stringify(toSave)); } catch {}
  }, [formData.name, formData.location, formData.email, formData.mobile, formData.price_range, formData.offer, menuItems]);

  const makePreview = (file) => {
    if (!file) return null;
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    return url;
  };

  const validateFile = (file, label = "Image") => {
    if (!file) return false;
    if (!isAllowedFile(file)) {
      Swal.fire("⚠️ Invalid file type", `${label}: only JPG/PNG/WEBP allowed.`, "warning");
      return false;
    }
    if (file.size > MAX_FILE_BYTES) {
      Swal.fire("⚠️ Too large", `${label}: max ${MAX_FILE_MB} MB.`, "warning");
      return false;
    }
    return true;
  };

  // ---------- Basic inputs & banner ----------
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // numeric guard for mobile
    if (name === "mobile") {
      const cleaned = value.replace(/[^\d]/g, "").slice(0, 10);
      setFormData((p) => ({ ...p, mobile: cleaned }));
      setFieldErrors((fe) => ({ ...fe, mobile: cleaned && !validateMobile(cleaned) ? "Enter 10-digit mobile" : "" }));
      return;
    }

    if (name === "email") {
      setFormData((p) => ({ ...p, email: value }));
      setFieldErrors((fe) => ({ ...fe, email: value && !validateEmail(value) ? "Invalid email" : "" }));
      return;
    }

    if (files && files[0]) {
      const file = files[0];
      if (!validateFile(file, name)) return;

      if (name === "messBanner") {
        if (bannerPreview) URL.revokeObjectURL(bannerPreview);
        const url = makePreview(file);
        setBannerPreview(url);
      }
      setFormData((prev) => ({ ...prev, [name]: file }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const clearBanner = () => {
    setFormData((p) => ({ ...p, messBanner: null }));
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerPreview(null);
  };

  // ---------- Menu section ----------
  const handleMenuChange = (i, field, value) => {
    setMenuItems((prev) => {
      const updated = [...prev];
      updated[i][field] = field === "price" ? value.replace(/[^\d]/g, "") : value;
      return updated;
    });
  };

  const handleMenuImage = (i, file) => {
    if (!file) return;
    if (!validateFile(file, `Dish #${i + 1}`)) return;

    setMenuItems((prev) => {
      const updated = [...prev];
      if (updated[i].preview) URL.revokeObjectURL(updated[i].preview);
      updated[i].image = file;
      updated[i].preview = makePreview(file);
      return updated;
    });
  };

  const clearDishImage = (i) => {
    setMenuItems((prev) => {
      const updated = [...prev];
      if (updated[i].preview) URL.revokeObjectURL(updated[i].preview);
      updated[i].image = null;
      updated[i].preview = null;
      return updated;
    });
  };

  const addMenuItem = () =>
    setMenuItems((prev) => {
      if (prev.length >= MAX_DISHES) {
        Swal.fire("Limit reached", `You can add up to ${MAX_DISHES} dishes.`, "info");
        return prev;
      }
      return [
        ...prev,
        { name: "", price: "", description: "", isVeg: true, image: null, preview: null, _id: cryptoRandom() },
      ];
    });

  const removeMenuItem = (i) =>
    setMenuItems((prev) => {
      if (prev.length <= MIN_DISHES) {
        Swal.fire("At least one dish", "Please keep at least one dish.", "info");
        return prev;
      }
      const updated = [...prev];
      if (updated[i]?.preview) URL.revokeObjectURL(updated[i].preview);
      updated.splice(i, 1);
      return updated;
    });

  // ---------- Validation per step ----------
  const duplicateDishNames = useMemo(() => {
    const names = menuItems.map((m) => m.name.trim().toLowerCase()).filter(Boolean);
    const seen = new Set();
    const dup = new Set();
    names.forEach((n) => (seen.has(n) ? dup.add(n) : seen.add(n)));
    return dup;
  }, [menuItems]);

  const validateStep = () => {
    setGlobalErrors([]);
    const errs = [];

    if (step === 1) {
      const { name, location, email, mobile, price_range, messBanner } = formData;
      if (!(name && location && email && mobile && price_range && messBanner)) errs.push("Fill all required fields.");
      if (email && !validateEmail(email)) errs.push("Invalid email.");
      if (mobile && !validateMobile(mobile)) errs.push("Mobile must be 10 digits.");
    }

    if (step === 2) {
      if (menuItems.length < MIN_DISHES) errs.push(`Add at least ${MIN_DISHES} dish.`);
      const anyMissing = menuItems.some((i) => !i.name || !i.price || !i.image);
      if (anyMissing) errs.push("Each dish needs a name, price and image.");
      if (duplicateDishNames.size) errs.push("Duplicate dish names are not allowed.");
    }

    if (step === 3) {
      // 👇 menuPhoto requirement REMOVED
      if (!(formData.pancard && formData.fssai)) {
        errs.push("PAN and FSSAI are required.");
      }
    }

    if (calcTotalBytes > MAX_TOTAL_BYTES) {
      errs.push(`Total upload size ${bytesToMB(calcTotalBytes)} MB exceeds limit of ${MAX_TOTAL_MB} MB.`);
    }

    setGlobalErrors(errs);
    return errs.length === 0;
  };

  const canProceed = useMemo(() => {
    // light/instant check to disable buttons visually
    if (step === 1) {
      const ok = formData.name && formData.location && validateEmail(formData.email) &&
                 validateMobile(formData.mobile) && formData.price_range && formData.messBanner;
      return !!ok;
    }
    if (step === 2) {
      if (menuItems.length < MIN_DISHES) return false;
      if (duplicateDishNames.size) return false;
      return menuItems.every((i) => i.name && i.price && i.image);
    }
    if (step === 3) {
      // 👇 menuPhoto removed from gating
      return !!(formData.pancard && formData.fssai);
    }
    return true;
  }, [step, formData, menuItems, duplicateDishNames]);

  const nextStep = () => {
    if (validateStep()) setStep((s) => s + 1);
    else Swal.fire("⚠️ Missing / invalid info", "Please complete required fields.", "warning");
  };
  const prevStep = () => setStep((s) => s - 1);

  // ---------- Submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!validateStep()) {
      Swal.fire("⚠️ Incomplete", "Please complete required fields.", "warning");
      return;
    }

    setLoading(true);
    setUploadPct(0);

    try {
      const payload = new FormData();

      // append basic fields
      Object.entries(formData).forEach(([key, val]) => {
        if (val instanceof File) {
          if (validateFile(val, key)) payload.append(key, val);
        } else if (typeof val === "string" && val.trim() !== "") {
          payload.append(key, val.trim());
        }
      });

      // append menu as JSON (no images here)
      payload.append(
        "menu",
        JSON.stringify(
          menuItems.map(({ name, price, description, isVeg }) => ({
            name: name.trim(),
            price: Number(price),
            description: description?.trim() || "",
            isVeg: Boolean(isVeg),
          }))
        )
      );

      // append dish images (field must match backend: "dishImages")
      menuItems.forEach((item) => {
        if (item.image instanceof File && item.image.size > 0) {
          payload.append("dishImages", item.image);
        }
      });

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log("📤 Uploading Mess Request:", [...payload.entries()]);
      }

      await api.post("/mess-request", payload, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded * 100) / evt.total);
          setUploadPct(pct);
        },
      });

      Swal.fire("✅ Success", "Your mess request has been submitted!", "success");

      // reset everything
      setFormData({
        name: "",
        location: "",
        email: "",
        mobile: "",
        price_range: "",
        offer: "",
        messBanner: null,
        pancard: null,
        fssai: null,
        // menuPhoto removed
        bankDetails: null,
      });
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrlsRef.current = [];
      setMenuItems([{ name: "", price: "", description: "", isVeg: true, image: null, preview: null, _id: cryptoRandom() }]);
      setBannerPreview(null);
      setUploadPct(0);
      setStep(1);
      setFieldErrors({});
      setGlobalErrors([]);
      localStorage.removeItem(LS_KEY);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.code === "ECONNABORTED"
          ? "Request timed out. Please try again."
          : "Server error. Try again.");
      // eslint-disable-next-line no-console
      console.error("❌ Submit Error:", err);
      Swal.fire("❌ Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  return (
    <div className="addmess-page">
      <div className="addmess-container">
        {/* Sidebar */}
        <aside className="onboarding-sidebar" aria-label="Steps">
          <h3>Complete your registration</h3>
          <ul>
            <li className={step === 1 ? "active" : step > 1 ? "done" : ""}>🏠 Mess Info</li>
            <li className={step === 2 ? "active" : step > 2 ? "done" : ""}>🍽 Menu</li>
            <li className={step === 3 ? "active" : step > 3 ? "done" : ""}>📎 Documents</li>
            <li className={step === 4 ? "active" : ""}>✅ Submit</li>
          </ul>
        </aside>

        {/* Main Form */}
        <form className="onboarding-form" onSubmit={handleSubmit} noValidate>
          {globalErrors.length > 0 && (
            <div className="amf-alert">
              {globalErrors.map((er, i) => (
                <div key={i}>• {er}</div>
              ))}
            </div>
          )}

          {/* STEP 1 — Basic Info */}
          {step === 1 && (
            <div className="form-step">
              <h2>Mess Information</h2>
              <div className="form-grid">
                <input name="name" placeholder="Mess Name" value={formData.name} onChange={handleChange} required />
                <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} required />
                <div className="with-hint">
                  <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                  {fieldErrors.email ? <small className="field-error">{fieldErrors.email}</small> : null}
                </div>
                <div className="with-hint">
                  <input
                    name="mobile"
                    inputMode="numeric"
                    placeholder="Mobile (10 digits)"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.mobile ? <small className="field-error">{fieldErrors.mobile}</small> : null}
                </div>
                <input name="price_range" placeholder="Price Range" value={formData.price_range} onChange={handleChange} required />
                <input name="offer" placeholder="Offer (optional)" value={formData.offer} onChange={handleChange} />
              </div>

              <div className="banner-section-header">
                <span className="banner-title">🏠 Mess Banner</span>
                <p className="banner-sub-text">This photo will appear on your Mess card.</p>
              </div>

              <div
                className="banner-upload-box"
                onClick={() => document.getElementById("bannerInput").click()}
                role="button"
                tabIndex={0}
              >
                {bannerPreview ? (
                  <img src={bannerPreview} className="banner-preview" alt="Mess Banner" />
                ) : (
                  <div className="banner-placeholder">📸 Click to Upload Banner</div>
                )}
              </div>
              <input
                id="bannerInput"
                type="file"
                accept={ACCEPT_ATTR}
                name="messBanner"
                onChange={handleChange}
                hidden
              />
              {formData.messBanner && (
                <div className="file-chip">
                  {formData.messBanner.name} • {bytesToMB(formData.messBanner.size)} MB
                  <button type="button" className="chip-x" onClick={clearBanner} aria-label="Remove banner">×</button>
                </div>
              )}

              <div className="step-actions">
                <button type="button" className="next-btn" onClick={nextStep} disabled={!canProceed}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — Menu */}
          {step === 2 && (
            <div className="form-step">
              <h2>Menu & Food Images</h2>

              {menuItems.map((item, i) => (
                <div key={item._id} className="menu-item-row">
                  <input
                    placeholder="Dish Name"
                    value={item.name}
                    onChange={(e) => handleMenuChange(i, "name", e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => handleMenuChange(i, "price", e.target.value)}
                    required
                  />
                  <input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleMenuChange(i, "description", e.target.value)}
                  />
                  <select
                    value={item.isVeg ? "veg" : "non-veg"}
                    onChange={(e) => handleMenuChange(i, "isVeg", e.target.value === "veg")}
                    aria-label="Veg/Non-veg"
                  >
                    <option value="veg">Veg</option>
                    <option value="non-veg">Non-Veg</option>
                  </select>

                  <div
                    className="dish-upload-box"
                    onClick={() => document.getElementById(`dish-${i}`).click()}
                    role="button"
                    tabIndex={0}
                  >
                    {item.preview ? (
                      <img src={item.preview} alt="dish preview" className="dish-img" />
                    ) : (
                      <div className="dish-upload-placeholder">📷 Upload Dish Image</div>
                    )}
                  </div>
                  <input
                    id={`dish-${i}`}
                    type="file"
                    accept={ACCEPT_ATTR}
                    hidden
                    onChange={(e) => handleMenuImage(i, e.target.files?.[0])}
                  />

                  <div className="row-actions">
                    {item.image && (
                      <button type="button" className="btn-light" onClick={() => clearDishImage(i)}>
                        Clear image
                      </button>
                    )}
                    {menuItems.length > 1 && (
                      <button type="button" className="remove-dish-btn" onClick={() => removeMenuItem(i)}>
                        Remove
                      </button>
                    )}
                  </div>

                  {duplicateDishNames.size && item.name && duplicateDishNames.has(item.name.trim().toLowerCase()) ? (
                    <small className="field-error">Duplicate dish name</small>
                  ) : null}

                  {item.image && (
                    <div className="file-chip small">
                      {item.image.name} • {bytesToMB(item.image.size)} MB
                    </div>
                  )}
                </div>
              ))}

              <button type="button" className="add-dish-btn" onClick={addMenuItem}>
                + Add Dish
              </button>

              <div className="nav-buttons">
                <button type="button" className="back-btn" onClick={prevStep}>
                  ← Back
                </button>
                <button type="button" className="next-btn" onClick={nextStep} disabled={!canProceed}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Documents */}
          {step === 3 && (
            <div className="form-step">
              <h2>Upload Documents</h2>

              <label className="doc-input">
                <span>PAN Card</span>
                <input type="file" name="pancard" accept={ACCEPT_ATTR} onChange={handleChange} />
                {formData.pancard && (
                  <div className="file-chip small">
                    {formData.pancard.name} • {bytesToMB(formData.pancard.size)} MB
                  </div>
                )}
              </label>

              <label className="doc-input">
                <span>FSSAI License</span>
                <input type="file" name="fssai" accept={ACCEPT_ATTR} onChange={handleChange} />
                {formData.fssai && (
                  <div className="file-chip small">
                    {formData.fssai.name} • {bytesToMB(formData.fssai.size)} MB
                  </div>
                )}
              </label>

              {/* 👇 Menu Photo field REMOVED */}

              <label className="doc-input">
                <span>Bank Details (optional)</span>
                <input type="file" name="bankDetails" accept={ACCEPT_ATTR} onChange={handleChange} />
                {formData.bankDetails && (
                  <div className="file-chip small">
                    {formData.bankDetails.name} • {bytesToMB(formData.bankDetails.size)} MB
                  </div>
                )}
              </label>

              <div className="nav-buttons">
                <button type="button" className="back-btn" onClick={prevStep}>
                  ← Back
                </button>
                <button type="button" className="next-btn" onClick={nextStep} disabled={!canProceed}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 — Submit */}
          {step === 4 && (
            <div className="form-step">
              <h2>Review & Submit</h2>

              <div className="soft-info">
                Total upload size: <b>{bytesToMB(calcTotalBytes)} MB</b> / {MAX_TOTAL_MB} MB
              </div>

              {loading && (
                <div className="upload-progress">
                  <div className="progress-head">
                    Uploading… {uploadPct}%
                  </div>
                  <div className="bar">
                    <div className="fill" style={{ width: `${uploadPct}%` }} />
                  </div>
                </div>
              )}

              <div className="nav-buttons">
                <button type="button" className="back-btn" onClick={prevStep} disabled={loading}>
                  ← Back
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Submitting..." : "Submit"}
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
