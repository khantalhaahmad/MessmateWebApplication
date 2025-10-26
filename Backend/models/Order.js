// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mess_name: { type: String, required: true },
    mess_id: { type: String }, // can be string or number

    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String, default: "default.png" },

        // ✅ Newly added fields for smarter recommendations
        type: {
          type: String,
          enum: ["veg", "non-veg"],
          default: "veg",
        },
        category: {
          type: String,
          default: "other",
        },
      },
    ],

    total_price: { type: Number, required: true },
    status: { type: String, default: "confirmed" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
