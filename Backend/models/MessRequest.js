// models/MessRequest.js
import mongoose from "mongoose";

/* ============================================================
   🍱 MENU ITEM SCHEMA
   ============================================================ */
const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    isVeg: { type: Boolean, default: true },
  },
  { _id: false }
);

/* ============================================================
   🏠 MESS REQUEST SCHEMA
   ============================================================ */
const messRequestSchema = new mongoose.Schema(
  {
    // 🧩 Basic Information
    name: { type: String, required: true },
    location: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },

    // 🍽️ Menu Section (same structure as in Mess model)
    menu: {
      items: { type: [menuItemSchema], default: [] },
    },

    // 💰 Pricing & Offers
    price_range: { type: String },
    offer: { type: String },

    // 🖼️ Document Uploads (Stored as Cloudinary URLs)
    pancard: { type: String },        // PAN Card image URL
    fssai: { type: String },          // ✅ ADDED: FSSAI License image URL
    menuPhoto: { type: String },      // Menu image URL
    bankDetails: { type: String },    // ✅ ADDED: Bank Details document URL

    // 👤 Relationship (Link to Owner)
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ⚙️ Request Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reason: { type: String, default: "" },
  },
  { timestamps: true } // ✅ Automatically adds createdAt & updatedAt
);

/* ============================================================
   🔍 INDEX CLEANUP
   ============================================================ */
// Just in case older versions had unique constraint issues
messRequestSchema.index({ request_id: 1 }, { unique: false, sparse: true });

/* ============================================================
   ✅ EXPORT MODEL
   ============================================================ */
const MessRequest = mongoose.model("MessRequest", messRequestSchema);
export default MessRequest;
