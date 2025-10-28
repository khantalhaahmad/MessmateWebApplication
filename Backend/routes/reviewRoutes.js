// routes/reviewRoutes.js
import express from "express";
import Review from "../models/Review.js";
import Mess from "../models/Mess.js";
import Order from "../models/Order.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* ============================================================
   🟢 POST /reviews → Add a Review (Students only)
   ============================================================ */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { mess_id, rating, comment, foodName } = req.body;

    if (req.user.role !== "student")
      return res.status(403).json({ message: "Only students can review." });

    if (!mess_id || !rating)
      return res.status(400).json({ message: "Mess ID and rating are required." });

    // ✅ Ensure user has ordered before reviewing
    const hasOrdered = await Order.exists({
      user_id: req.user.id,
      mess_id: mess_id,
    });

    if (!hasOrdered)
      return res.status(400).json({
        message: "You can only review a mess after placing an order from it.",
      });

    // ✅ Create review
    const review = await Review.create({
      mess_id,
      user_id: req.user.id,
      rating,
      comment,
      foodName,
    });

    // ✅ Update average rating
    const reviews = await Review.find({ mess_id });
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Mess.findOneAndUpdate({ mess_id }, { rating: avgRating });

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

/* ============================================================
   🟡 GET /reviews/mess/:messId → Fetch Reviews for a Mess
   ============================================================ */
router.get("/mess/:messId", async (req, res) => {
  try {
    const reviews = await Review.find({ mess_id: req.params.messId })
      .populate("user_id", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error("💥 Error fetching mess reviews:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch reviews", error: error.message });
  }
});

/* ============================================================
   🟡 GET /reviews/user/:userId → Fetch Reviews by a User
   ============================================================ */
router.get("/user/:userId", async (req, res) => {
  try {
    const reviews = await Review.find({ user_id: req.params.userId })
      .populate("mess_id", "name location")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error("💥 Error fetching user reviews:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch reviews", error: error.message });
  }
});

/* ============================================================
   🧩 NEW: GET /reviews/owner/:ownerId → Fetch Reviews for Owner's Messes
   ============================================================ */
router.get("/owner/:ownerId", authMiddleware, async (req, res) => {
  try {
    const { ownerId } = req.params;
    console.log("🧾 Fetching reviews for owner:", ownerId);

    // ✅ Get all messes owned by this owner
    const messes = await Mess.find({ owner_id: ownerId });
    const messIds = messes.map((m) => m.mess_id);

    if (messes.length === 0) {
      return res.status(200).json({ success: true, reviews: [] });
    }

    // ✅ Fetch all reviews for those messes
    const reviews = await Review.find({ mess_id: { $in: messIds } })
      .populate("user_id", "name email")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${reviews.length} reviews for owner ${ownerId}`);
    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error("💥 Error fetching owner reviews:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching owner reviews",
      error: error.message,
    });
  }
});

export default router;
