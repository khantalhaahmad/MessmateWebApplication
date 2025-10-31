import mongoose from "mongoose";
import Counter from "./Counter.js";

// 🍽 Individual Menu Item Schema
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: "" }, // ✅ Final image URL
  description: { type: String, default: "" },
  isVeg: { type: Boolean, default: true },
});

// 📋 Menu Schema (contains multiple items)
const menuSchema = new mongoose.Schema({
  items: { type: [menuItemSchema], default: [] },
});

// 📄 Documents Schema (Pancard, FSSAI, etc.)
const docsSchema = new mongoose.Schema(
  {
    pancard: { type: String, default: "" },
    fssai: { type: String, default: "" },
    menuPhoto: { type: String, default: "" },
    bankDetails: { type: String, default: "" },
  },
  { _id: false }
);

// 🏠 Mess Schema
const messSchema = new mongoose.Schema(
  {
    mess_id: { type: Number, unique: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    price_range: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    delivery_time: { type: String, default: "" },
    offer: { type: String, default: "" },

    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🖼 Banner (for Mess card)
    banner: { type: String, default: "" },

    // 📋 Menu
    menu: { type: menuSchema, default: { items: [] } },

    // 📄 Documents
    documents: { type: docsSchema, default: () => ({}) },

    // 💰 Payout status tracking (NEW FIELD)
    payoutStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// 🔢 Auto-increment mess_id
messSchema.pre("validate", async function (next) {
  if (this.isNew) {
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
