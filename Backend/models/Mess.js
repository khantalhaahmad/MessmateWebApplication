import mongoose from "mongoose";
import Counter from "./Counter.js";

/* ============================================================
   MENU ITEM SCHEMA (LEGACY SUPPORT)
============================================================ */

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  price: {
    type: Number,
    required: true
  },

  image: {
    type: String,
    default: ""
  },

  description: {
    type: String,
    default: ""
  },

  isVeg: {
    type: Boolean,
    default: true
  },

  category: {
    type: String,
    default: "other"
  },

  available: {
    type: Boolean,
    default: true
  }
});

/* ============================================================
   MENU SCHEMA (LEGACY FALLBACK)
============================================================ */

const menuSchema = new mongoose.Schema({
  items: {
    type: [menuItemSchema],
    default: []
  }
});

/* ============================================================
   DOCUMENTS SCHEMA
============================================================ */

const docsSchema = new mongoose.Schema({
  pancard: {
    type: String,
    default: ""
  },

  fssai: {
    type: String,
    default: ""
  },

  menuPhoto: {
    type: String,
    default: ""
  },

  bankDetails: {
    type: String,
    default: ""
  }

}, { _id: false });

/* ============================================================
   MAIN MESS SCHEMA
============================================================ */

const messSchema = new mongoose.Schema({

  /* -----------------------------
     Public numeric mess id
  ----------------------------- */

  mess_id: {
    type: Number,
    unique: true,
    index: true
  },

  /* -----------------------------
     Basic info
  ----------------------------- */

  name: {
    type: String,
    required: true,
    trim: true
  },

  location: {
    type: String,
    required: true,
    trim: true
  },

  price_range: {
    type: String,
    default: ""
  },

  rating: {
    type: Number,
    default: 0
  },

  delivery_time: {
    type: String,
    default: ""
  },

  offer: {
    type: String,
    default: ""
  },

  /* -----------------------------
     Restaurant open / close
  ----------------------------- */

  isOpen: {
    type: Boolean,
    default: true
  },

  /* -----------------------------
     Owner reference
  ----------------------------- */

  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  /* -----------------------------
     Banner image
  ----------------------------- */

  banner: {
    type: String,
    default: ""
  },

  /* -----------------------------
     Legacy menu (fallback)
  ----------------------------- */

  menu: {
    type: menuSchema,
    default: { items: [] }
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
    index: true
  },

  /* -----------------------------
     Payout status
  ----------------------------- */

  payoutStatus: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending"
  }

}, {
  timestamps: true
});

/* ============================================================
   AUTO INCREMENT mess_id
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

      console.error("Error generating mess_id:", err);

    }

  }

  next();

});

/* ============================================================
   INDEXES (Performance)
============================================================ */

messSchema.index({ owner_id: 1 });
messSchema.index({ status: 1 });
messSchema.index({ mess_id: 1 });

/* ============================================================
   EXPORT MODEL
============================================================ */

export default mongoose.model("Mess", messSchema);