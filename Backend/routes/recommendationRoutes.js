// routes/recommendationRoutes.js
import express from "express";
import mongoose from "mongoose";
import Mess from "../models/Mess.js";
import Order from "../models/Order.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let userOrders = [];

    // ✅ Avoid ObjectId cast errors
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userOrders = await Order.find({ user_id: userId });
    }

    let recommendedFoods = [];

    // ✅ Helper function to extract items safely
    const extractItems = (mess) => {
      let items = [];
      if (Array.isArray(mess.menu?.items)) {
        items = mess.menu.items;
      } else if (Array.isArray(mess.menu)) {
        mess.menu.forEach((m) => {
          if (Array.isArray(m.items)) items.push(...m.items);
        });
      }

      return items.map((i) => ({
        name: i.name || "Unnamed Dish",
        image: i.image || "default.png",
        price: i.price || 0,
        rating: i.rating || 4.0,
        description: i.description || "Delicious food you'll love!",
        mess_name: mess.name,
        mess_id: mess.mess_id || mess._id?.toString(),
        type: i.type || (i.isVeg ? "veg" : "non-veg"),
        category: i.category || "other",
      }));
    };

    // ✅ Get all messes and flatten menu items
    const messes = await Mess.find({});
    let allFoods = [];
    messes.forEach((mess) => {
      const items = extractItems(mess);
      allFoods.push(...items);
    });

    // ✅ Case 1: New user (no orders)
    if (userOrders.length === 0) {
      recommendedFoods = allFoods.sort(() => 0.5 - Math.random()).slice(0, 6);
    } else {
      // ✅ Case 2: Returning user — analyze orders
      const orderedNames = new Set();
      const typeCount = {};
      const categoryCount = {};

      userOrders.forEach((order) => {
        order.items.forEach((item) => {
          if (!item?.name) return;
          orderedNames.add(item.name.toLowerCase());

          // Count types and categories for preference
          if (item.type)
            typeCount[item.type] = (typeCount[item.type] || 0) + 1;
          if (item.category)
            categoryCount[item.category] =
              (categoryCount[item.category] || 0) + 1;
        });
      });

      // ✅ Determine user’s preferred type/category
      const topType =
        Object.keys(typeCount).sort((a, b) => typeCount[b] - typeCount[a])[0] ||
        "veg";
      const topCategory =
        Object.keys(categoryCount).sort(
          (a, b) => categoryCount[b] - categoryCount[a]
        )[0] || "other";

      // ✅ Filter foods not already ordered
      let filteredFoods = allFoods.filter(
        (f) => f.name && !orderedNames.has(f.name.toLowerCase())
      );

      // ✅ Match user preferences
      filteredFoods = filteredFoods.filter(
        (f) => f.type === topType || f.category === topCategory
      );

      // ✅ Fallback — random if none matched
      if (filteredFoods.length === 0)
        filteredFoods = allFoods.sort(() => 0.5 - Math.random()).slice(0, 6);

      recommendedFoods = filteredFoods.slice(0, 6);
    }

    // ✅ Final fallback if no food found
    if (!recommendedFoods || recommendedFoods.length === 0) {
      recommendedFoods = allFoods.slice(0, 6);
    }

    res.status(200).json({ success: true, data: recommendedFoods });
  } catch (err) {
    console.error("❌ Error fetching recommendations:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching recommendations",
      error: err.message,
    });
  }
});

export default router;
