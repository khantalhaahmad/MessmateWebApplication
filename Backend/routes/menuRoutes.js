import express from "express";
import multer from "multer";
import path from "path";
import MenuItem from "../models/MenuItem.js";
import Mess from "../models/Mess.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================
   📸 MULTER CONFIG
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
   🟢 ADD MENU ITEM
===================================== */

router.post("/:messId", authMiddleware, upload.single("image"), async (req, res) => {
  try {

    const messId = req.params.messId;

    const mess = await Mess.findById(messId);

    if (!mess) {
      return res.status(404).json({
        success:false,
        message:"Mess not found"
      });
    }

    /* -----------------------------
       Ownership check
    ----------------------------- */

    if (mess.owner_id.toString() !== req.user.id) {
      return res.status(403).json({
        success:false,
        message:"You are not allowed to modify this mess"
      });
    }

    let { name, description, price, isVeg, category } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success:false,
        message:"Item name and price are required"
      });
    }

    const normalizedName = name.trim().toLowerCase();

    /* -----------------------------
       Duplicate item check
    ----------------------------- */

    const existingItem = await MenuItem.findOne({
      mess_id: messId,
      name: normalizedName
    });

    if (existingItem) {
      return res.status(400).json({
        success:false,
        message:"This item already exists in your menu"
      });
    }

    const imagePath = req.file
      ? `/uploads/${req.file.filename}`
      : "default.png";

    const menuItem = await MenuItem.create({
      mess_id: messId,
      name: normalizedName,
      description,
      price,
      image: imagePath,
      isVeg: isVeg === "true",
      category: category || "other",
    });

    console.log("🍽 Menu item added:", menuItem.name);

    res.status(201).json({
      success:true,
      message:"Menu item added successfully",
      item:menuItem
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(400).json({
        success:false,
        message:"This item already exists in your menu"
      });
    }

    console.error("❌ Error adding menu item:", error);

    res.status(500).json({
      success:false,
      message:"Failed to add menu item"
    });
  }
});

/* =====================================
   🟡 GET MENU ITEMS
===================================== */

router.get("/:messId", async (req, res) => {
  try {

    const messId = req.params.messId;

    console.log("📦 Fetching menu for mess:", messId);

    /* -----------------------------
       Build query (available filter)
    ----------------------------- */

    const query = { mess_id: messId };

    if (req.query.available === "true") {
      query.available = true;
    }

    /* -----------------------------
       Try MenuItem collection
    ----------------------------- */

    const items = await MenuItem
      .find(query)
      .sort({ createdAt: 1 });

    if (items.length > 0) {

      console.log("🍽 Menu loaded from MenuItem collection:", items.length);

      return res.json(items);
    }

    /* -----------------------------
       Fallback to Mess.menu
    ----------------------------- */

    const mess = await Mess.findById(messId);

    if (!mess) {
      return res.status(404).json({
        message:"Mess not found"
      });
    }

    const fallbackItems = mess.menu?.items || [];

    console.log("🍽 Menu loaded from Mess model:", fallbackItems.length);

    res.json(fallbackItems);

  } catch (error) {

    console.error("❌ Error fetching menu:", error);

    res.status(500).json({
      message:"Failed to fetch menu"
    });
  }
});

/* =====================================
   🔴 DELETE MENU ITEM
===================================== */

router.delete("/:itemId", authMiddleware, async (req, res) => {
  try {

    const item = await MenuItem.findById(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        message:"Menu item not found"
      });
    }

    const mess = await Mess.findById(item.mess_id);

    if (!mess || mess.owner_id.toString() !== req.user.id) {
      return res.status(403).json({
        message:"You are not allowed to delete this item"
      });
    }

    await MenuItem.findByIdAndDelete(req.params.itemId);

    console.log("🗑 Menu item deleted:", req.params.itemId);

    res.json({
      message:"Menu item deleted successfully"
    });

  } catch (error) {

    console.error("❌ Delete menu error:", error);

    res.status(500).json({
      message:"Failed to delete menu item"
    });
  }
});

/* =====================================
   🔵 UPDATE MENU ITEM
===================================== */

router.put("/:itemId", authMiddleware, upload.single("image"), async (req, res) => {
  try {

    const item = await MenuItem.findById(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        message:"Menu item not found"
      });
    }

    const mess = await Mess.findById(item.mess_id);

    if (!mess || mess.owner_id.toString() !== req.user.id) {
      return res.status(403).json({
        message:"You are not allowed to update this item"
      });
    }

    let updateData = {
      name: req.body.name?.trim().toLowerCase(),
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
      { new:true }
    );

    console.log("✏️ Menu item updated:", updatedItem?.name);

    res.json(updatedItem);

  } catch (error) {

    console.error("❌ Update menu error:", error);

    res.status(500).json({
      message:"Failed to update menu item"
    });
  }
});

/* =====================================
   🟣 TOGGLE AVAILABILITY
===================================== */

router.patch("/:itemId/availability", authMiddleware, async (req, res) => {
  try {

    const item = await MenuItem.findById(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        message:"Menu item not found"
      });
    }

    const mess = await Mess.findById(item.mess_id);

    if (!mess || mess.owner_id.toString() !== req.user.id) {
      return res.status(403).json({
        message:"You are not allowed to modify this item"
      });
    }

    item.available = !item.available;

    await item.save();

    res.json(item);

  } catch (error) {

    console.error("❌ Toggle availability error:", error);

    res.status(500).json({
      message:"Failed to update availability"
    });
  }
});

export default router;