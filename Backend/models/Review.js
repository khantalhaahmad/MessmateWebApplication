// models/Review.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    // 🟢 Use String for mess_id because your database uses "1", "3", "4", etc.
    mess_id: { type: String, required: true },

    // 🟢 user_id is still an ObjectId (you store user IDs as ObjectIds)
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    foodName: { type: String }, // Optional - for tracking which food item was reviewed
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);
export default Review;
