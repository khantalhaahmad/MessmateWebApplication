// Backend/routes/messRoutes.js
import express from "express";
import Mess from "../models/Mess.js";
import { verifyToken } from "../middleware/auth.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* ============================================================
   🧾 CREATE NEW MESS (uploads to Cloudinary)
   ============================================================ */
router.post(
  "/",
  verifyToken,
  upload.fields([
    { name: "pancard", maxCount: 1 },
    { name: "fssai", maxCount: 1 },
    { name: "menuPhoto", maxCount: 1 },
    { name: "bankDetails", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("➡️ [POST] /api/messes");
      const ownerId = req.user?.id || req.user?._id;
      if (!ownerId) return res.status(400).json({ success: false, message: "Owner ID missing" });

      // Parse menu JSON
      let parsedMenuItems = [];
      if (req.body.menu) {
        try {
          const parsed = typeof req.body.menu === "string" ? JSON.parse(req.body.menu) : req.body.menu;
          parsedMenuItems = parsed.items || parsed;
        } catch (e) {
          console.warn("⚠️ Invalid menu JSON:", e.message);
        }
      }

      const newMess = await Mess.create({
        name: req.body.name,
        location: req.body.location,
        price_range: req.body.price_range,
        offer: req.body.offer,
        owner_id: ownerId,
        menu: { items: parsedMenuItems },
        documents: {
          pancard: req.files?.pancard?.[0]?.path || "",
          fssai: req.files?.fssai?.[0]?.path || "",
          menuPhoto: req.files?.menuPhoto?.[0]?.path || "",
          bankDetails: req.files?.bankDetails?.[0]?.path || "",
        },
      });

      res.status(201).json({ success: true, message: "Mess created", mess: newMess });
    } catch (err) {
      console.error("💥 Error creating mess:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

/* ============================================================
   📋 GET ALL MESSES
   ============================================================ */
router.get("/", async (_, res) => {
  try {
    const messes = await Mess.find().sort({ mess_id: 1 });
    res.json(messes);
  } catch (e) {
    console.error("💥 Fetch error:", e.message);
    res.status(500).json({ message: "Failed to fetch messes" });
  }
});

/* ============================================================
   🍛 GET MESS BY ID
   ============================================================ */
router.get("/:id", async (req, res) => {
  try {
    const mess = await Mess.findOne({ mess_id: Number(req.params.id) });
    if (!mess) return res.status(404).json({ message: "Mess not found" });
    res.json(mess);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch mess" });
  }
});

export default router;
