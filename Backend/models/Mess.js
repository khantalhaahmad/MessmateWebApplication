import mongoose from "mongoose";
import Counter from "./Counter.js";

const menuItemSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String,
  description: String,
  isVeg: { type: Boolean, default: true },
});

const menuSchema = new mongoose.Schema({
  items: { type: [menuItemSchema], default: [] },
});

const messSchema = new mongoose.Schema(
  {
    mess_id: { type: Number, unique: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    price_range: String,
    rating: { type: Number, default: 0 },
    delivery_time: String,
    offer: String,
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    menu: { type: menuSchema, default: { items: [] } },

    // ✅ Added for Cloudinary document URLs
    documents: {
      pancard: String,
      fssai: String,
      menuPhoto: String,
      bankDetails: String,
    },
  },
  { timestamps: true }
);

// Auto-increment mess_id
messSchema.pre("validate", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "mess_id" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.mess_id = counter.seq;
  }
  next();
});

export default mongoose.model("Mess", messSchema);
