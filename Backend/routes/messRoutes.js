import express from "express";
import Mess from "../models/Mess.js";
import { verifyToken } from "../middleware/auth.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const ownerId = req.user.id;
    const formattedMenu = Array.isArray(req.body.menu)
      ? { items: req.body.menu }
      : req.body.menu || { items: [] };

    const imageUrl = req.file?.path || req.body.image || "";

    const newMess = await Mess.create({
      name: req.body.name,
      location: req.body.location,
      price_range: req.body.price_range,
      rating: req.body.rating || 0,
      delivery_time: req.body.delivery_time,
      offer: req.body.offer,
      owner_id: ownerId,
      image: imageUrl,
      menu: formattedMenu,
    });

    res.status(201).json({ message: "Mess created", mess: newMess });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  const messes = await Mess.find().sort({ mess_id: 1 });
  res.json(messes);
});

export default router;
