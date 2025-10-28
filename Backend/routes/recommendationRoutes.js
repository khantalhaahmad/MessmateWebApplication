// routes/recommendationRoutes.js
import express from "express";
import mongoose from "mongoose";
import Mess from "../models/Mess.js";
import Order from "../models/Order.js";

const router = express.Router();

/* ============================================================
   🍽️ HELPER FUNCTION — Extract food items safely
   Supports both: 
   1. { menu: { items: [{ name, price, ... }] } }
   2. { menu: { items: [{ day, breakfast, lunch, dinner }] } }
   ============================================================ */
const extractFoodItems = (mess) => {
  const items = mess.menu?.items || [];

  return items.flatMap((item) => {
    // ✅ Case 1: Standard menu format
    if (item.name && item.price) {
      return {
        name: item.name,
        image: item.image || "default.png",
        price: item.price,
        rating: item.rating || 4.0,
        description: item.description || "Delicious food you'll love!",
        mess_name: mess.name,
        mess_id: mess.mess_id || mess._id?.toString(),
        type: item.isVeg ? "veg" : "non-veg",
        category: item.category || "main-course",
      };
    }

    // ✅ Case 2: Day-based format (breakfast/lunch/dinner)
    const mealKeys = ["breakfast", "lunch", "dinner"];
    return mealKeys
      .filter((key) => item[key])
      .map((key) => ({
        name: item[key],
        image: "default.png",
        price: 80,
        rating: 4.0,
        description: `${key} special from ${mess.name}`,
        mess_name: mess.name,
        mess_id: mess.mess_id || mess._id?.toString(),
        type: "veg",
        category: key,
      }));
  });
};

/* ============================================================
   🧾 Route: GET /api/recommendations/guest
   Returns random dishes from all messes
   ============================================================ */
router.get("/guest", async (req, res) => {
  try {
    const messes = await Mess.find({});
    if (!messes || messes.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No mess data found",
        data: [],
      });
    }

    // 🥗 Extract items from all messes
    const allFoods = messes.flatMap((mess) => extractFoodItems(mess));

    // ✅ Randomly select 6
    const recommendedFoods = allFoods.sort(() => 0.5 - Math.random()).slice(0, 6);

    res.status(200).json({
      success: true,
      message: "Guest recommendations fetched successfully",
      data: recommendedFoods,
    });
  } catch (err) {
    console.error("💥 Guest recommendation error:", err.message);
    res.status(500).json({
      success: false,
      message: "Error fetching guest recommendations",
      error: err.message,
    });
  }
});

/* ============================================================
   🧠 Route: GET /api/recommendations/:userId
   Personalized recommendations for logged-in users
   ============================================================ */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // 🧩 Handle guest users gracefully
    if (userId === "guest") {
      const messes = await Mess.find({});
      const allFoods = messes.flatMap((mess) => extractFoodItems(mess));
      const randomFoods = allFoods.sort(() => 0.5 - Math.random()).slice(0, 6);
      return res.status(200).json({
        success: true,
        message: "Guest recommendations fetched successfully",
        data: randomFoods,
      });
    }

    // 🧩 Validate ObjectId and fetch user orders
    let userOrders = [];
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userOrders = await Order.find({ user_id: userId });
    }

    const messes = await Mess.find({});
    const allFoods = messes.flatMap((mess) => extractFoodItems(mess));

    // 🥗 If user has no orders → random suggestions
    if (userOrders.length === 0) {
      const randomFoods = allFoods.sort(() => 0.5 - Math.random()).slice(0, 6);
      return res.status(200).json({
        success: true,
        message: "New user — random recommendations",
        data: randomFoods,
      });
    }

    // 🧩 Analyze user’s order patterns
    const orderedNames = new Set();
    const typeCount = {};
    const categoryCount = {};

    userOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        if (!item?.name) return;
        orderedNames.add(item.name.toLowerCase());
        if (item.type)
          typeCount[item.type] = (typeCount[item.type] || 0) + 1;
        if (item.category)
          categoryCount[item.category] =
            (categoryCount[item.category] || 0) + 1;
      });
    });

    const topType =
      Object.keys(typeCount).sort((a, b) => typeCount[b] - typeCount[a])[0] ||
      "veg";
    const topCategory =
      Object.keys(categoryCount).sort(
        (a, b) => categoryCount[b] - categoryCount[a]
      )[0] || "main-course";

    // 🧩 Filter untried dishes matching user’s preferences
    let filteredFoods = allFoods.filter(
      (f) => f.name && !orderedNames.has(f.name.toLowerCase())
    );

    filteredFoods = filteredFoods.filter(
      (f) => f.type === topType || f.category === topCategory
    );

    // 🧩 Fallback if not enough data
    if (filteredFoods.length === 0)
      filteredFoods = allFoods.sort(() => 0.5 - Math.random()).slice(0, 6);

    const recommendedFoods = filteredFoods.slice(0, 6);

    res.status(200).json({
      success: true,
      message: "Personalized recommendations fetched successfully",
      data: recommendedFoods,
    });
  } catch (err) {
    console.error("❌ Error fetching recommendations:", err.message);
    res.status(500).json({
      success: false,
      message: "Error fetching recommendations",
      error: err.message,
    });
  }
});

export default router;
