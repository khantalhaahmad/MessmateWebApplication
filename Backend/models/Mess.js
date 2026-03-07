import mongoose from "mongoose";
import Counter from "./Counter.js";

/* ============================================================
   🍽 Embedded Menu Item Schema (LEGACY SUPPORT)
   ============================================================ */
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: "" },
  description: { type: String, default: "" },
  isVeg: { type: Boolean, default: true },

  // 🔥 Added for compatibility with MenuItem collection
  category: { type: String, default: "other" },
  available: { type: Boolean, default: true }
});

/* ============================================================
   📋 Menu Schema (Legacy fallback)
   ============================================================ */
const menuSchema = new mongoose.Schema({
  items: { type: [menuItemSchema], default: [] },
});

/* ============================================================
   📄 Documents Schema
   ============================================================ */
const docsSchema = new mongoose.Schema(
  {
    pancard: { type: String, default: "" },
    fssai: { type: String, default: "" },
    menuPhoto: { type: String, default: "" },
    bankDetails: { type: String, default: "" },
  },
  { _id: false }
);

/* ============================================================
   🏠 MAIN MESS SCHEMA
   ============================================================ */
const messSchema = new mongoose.Schema(
  {
    /* -----------------------------
       Public numeric mess id
    ----------------------------- */
    mess_id: {
      type: Number,
      unique: true,
      index: true,
    },

    /* -----------------------------
       Basic info
    ----------------------------- */
    name: { type: String, required: true },
    location: { type: String, required: true },

    price_range: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    delivery_time: { type: String, default: "" },
    offer: { type: String, default: "" },

    /* -----------------------------
       Owner reference
    ----------------------------- */
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* -----------------------------
       Banner image
    ----------------------------- */
    banner: { type: String, default: "" },

    /* =========================================================
       LEGACY MENU (Fallback only)
       ⚠️ New menu items stored in MenuItem collection
       ========================================================= */
    menu: {
      type: menuSchema,
      default: { items: [] },
    },

    /* -----------------------------
       Documents
    ----------------------------- */
    documents: {
      type: docsSchema,
      default: () => ({})
    },

    /* -----------------------------
       Approval status
    ----------------------------- */
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    /* -----------------------------
       Payout status
    ----------------------------- */
    payoutStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

/* ============================================================
   🔢 Auto increment mess_id
   ============================================================ */
messSchema.pre("validate", async function (next) {
  if (this.isNew && !this.mess_id) {
    try {

      const counter = await Counter.findOneAndUpdate(
        { name: "mess_id" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      this.mess_id = counter.seq;

    } catch (err) {

      console.error("❌ Error in mess_id auto-increment:", err);

    }
  }

  next();
});

export default mongoose.model("Mess", messSchema);