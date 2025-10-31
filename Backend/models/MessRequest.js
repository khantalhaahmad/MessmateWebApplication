// Backend/models/MessRequest.js
import mongoose from "mongoose";

/* ============================================================
   🍱 MENU ITEM SCHEMA (with image)
   ============================================================ */
const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: "" },
    isVeg: { type: Boolean, default: true },

    // 🔗 Cloudinary info (from dishImages[])
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
  },
  { _id: false }
);

/* ============================================================
   📎 DOCUMENTS
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
   🏠 MESS REQUEST SCHEMA
   ============================================================ */
const messRequestSchema = new mongoose.Schema(
  {
    // Basic
    name: { type: String, required: true },
    location: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },

    // Banner (mess card image)
    messBanner: { type: String, default: "" },

    // Menu
    menu: {
      items: { type: [menuItemSchema], default: [] },
    },

    // Pricing & Offers
    price_range: { type: String, default: "" },
    offer: { type: String, default: "" },

    // Documents (URLs)
    documents: { type: docsSchema, default: () => ({}) },

    // Relationship
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Status
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reason: { type: String, default: "" },
  },
  { timestamps: true }
);

// safety index
messRequestSchema.index({ createdAt: 1 });

const MessRequest = mongoose.model("MessRequest", messRequestSchema);
export default MessRequest;
