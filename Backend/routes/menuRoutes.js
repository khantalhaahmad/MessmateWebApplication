// routes/menuRoutes.js

import express from "express";
import multer from "multer";
import path from "path";
import MenuItem from "../models/MenuItem.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================
   📸 MULTER IMAGE STORAGE CONFIG
===================================== */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* =====================================
   🟢 ADD MENU ITEM (Vendor App)
===================================== */

router.post("/:messId", authMiddleware, upload.single("image"), async (req, res) => {
  try {

    const { name, description, price, isVeg, category } = req.body;

    const imagePath = req.file
      ? `/uploads/${req.file.filename}`
      : "default.png";

    const menuItem = await MenuItem.create({
      mess_id: req.params.messId,
      name,
      description,
      price,
      image: imagePath,
      isVeg: isVeg === "true",
      category: category || "other",
    });

    console.log("🍽 Menu item added:", menuItem.name);

    res.status(201).json(menuItem);

  } catch (error) {

    console.error("❌ Error adding menu item:", error);

    res.status(500).json({
      message: "Failed to add menu item",
      error: error.message,
    });
  }
});

/* =====================================
   🟡 GET MENU ITEMS (Vendor + User Apps)
   IMPORTANT: Returns ARRAY for Android
===================================== */

import Mess from "../models/Mess.js";

router.get("/:messId", async (req, res) => {
  try {

    const messId = req.params.messId;

    console.log("📦 Fetching menu for mess:", messId);

    const mess = await Mess.findById(messId);

    if (!mess) {
      return res.status(404).json({
        message: "Mess not found"
      });
    }

    const items = mess.menu?.items || [];

    console.log("🍽 Menu items count:", items.length);

    // Android expects array
    res.json(items);

  } catch (error) {

    console.error("❌ Error fetching menu:", error);

    res.status(500).json({
      message: "Failed to fetch menu"
    });
  }
});
/* =====================================
   🔴 DELETE MENU ITEM
===================================== */

router.delete("/:itemId", authMiddleware, async (req, res) => {
  try {

    await MenuItem.findByIdAndDelete(req.params.itemId);

    console.log("🗑 Menu item deleted:", req.params.itemId);

    res.json({
      message: "Menu item deleted",
    });

  } catch (error) {

    console.error("❌ Delete menu error:", error);

    res.status(500).json({
      message: "Failed to delete menu item",
    });
  }
});

/* =====================================
   🔵 UPDATE MENU ITEM
===================================== */

router.put("/:itemId", authMiddleware, upload.single("image"), async (req, res) => {
  try {

    const updateData = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      isVeg: req.body.isVeg === "true",
    };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.itemId,
      updateData,
      { new: true }
    );

    console.log("✏️ Menu item updated:", updatedItem.name);

    res.json(updatedItem);

  } catch (error) {

    console.error("❌ Update menu error:", error);

    res.status(500).json({
      message: "Failed to update menu item",
    });
  }
});

export default router;