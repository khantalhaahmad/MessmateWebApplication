import express from "express";
import Review from "../models/Review.js";
import Mess from "../models/Mess.js";
import Order from "../models/Order.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * ============================================================
 * 🟢 POST /reviews → Add a Review (Students only)
 * ============================================================
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { mess_id, rating, comment, foodName } = req.body;

    // Role validation
    if (req.user.role !== "student")
      return res.status(403).json({ message: "Only students can review." });

    // Validation
    if (!mess_id || !rating)
      return res.status(400).json({ message: "Mess ID and rating are required." });

    // (Optional) Check if the user has ordered from this mess before reviewing
    const hasOrdered = await Order.exists({
      user_id: req.user.id,
      mess_id: mess_id,
    });

    if (!hasOrdered) {
      return res.status(400).json({
        message: "You can only review a mess after placing an order from it.",
      });
    }

    // Create new review
    const review = await Review.create({
      mess_id,
      user_id: req.user.id,
      rating,
      comment,
      foodName,
    });

    // Update average mess rating
    const reviews = await Review.find({ mess_id });
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Mess.findByIdAndUpdate(mess_id, { rating: avgRating });

    res.status(201).json({
      message: "Review added successfully!",
      review,
      updatedRating: avgRating.toFixed(1),
    });
  } catch (error) {
    console.error("💥 Error adding review:", error);
    res
      .status(500)
      .json({ message: "Failed to add review", error: error.message });
  }
});

/**
 * ============================================================
 * 🟡 GET /reviews/:messId → Fetch All Reviews for a Mess
 * ============================================================
 */
router.get("/:messId", async (req, res) => {
  try {
    const reviews = await Review.find({ mess_id: req.params.messId })
      .populate("user_id", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error("💥 Error fetching reviews:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch reviews", error: error.message });
  }
});

export default router;
