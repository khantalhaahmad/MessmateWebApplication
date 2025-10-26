// routes/menuRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import MenuItem from "../models/MenuItem.js";

const router = express.Router();

// 📸 Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// 🟢 Add a menu item with image
router.post("/:messId", upload.single("image"), async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const menuItem = await MenuItem.create({
      mess_id: req.params.messId,
      name,
      description,
      price,
      image: imagePath,
    });

    res.status(201).json(menuItem);
  } catch (error) {
    console.error("Error adding menu item:", error);
    res.status(500).json({ message: "Failed to add menu item" });
  }
});

// 🟡 Get all menu items for a mess
router.get("/:messId", async (req, res) => {
  try {
    const items = await MenuItem.findAll({
      where: { mess_id: req.params.messId },
    });
    res.json(items);
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ message: "Failed to fetch menu" });
  }
});

export default router;
