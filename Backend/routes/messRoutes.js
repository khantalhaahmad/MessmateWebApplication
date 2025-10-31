import express from "express";
import Mess from "../models/Mess.js";
import { verifyToken } from "../middleware/auth.js";
import { handleMulterErrors, messRequestUploads } from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* ============================================================
   🧾 CREATE NEW MESS
   ============================================================ */
router.post("/add", verifyToken, handleMulterErrors(messRequestUploads), async (req, res) => {
  try {
    console.log("➡️ [POST] Create Mess");
    const ownerId = req.user?._id || req.user?.id;
    if (!ownerId) return res.status(400).json({ success: false, message: "Owner ID missing" });

    const body = req.body || {};
    if (!body.name || !body.location)
      return res.status(400).json({ success: false, message: "Missing required fields: name, location" });

    // Parse menu (text fields only)
    let parsedMenu = [];
    try {
      parsedMenu = JSON.parse(body.menu);
    } catch {
      parsedMenu = [];
    }

    // ✅ FIXED: Preserve Cloudinary URLs properly + support imageUrl field
const dishFiles = req.files?.dishImages || [];

parsedMenu = parsedMenu.map((item, idx) => ({
  ...item,
  image:
    item.image ||
    item.imageUrl ||
    dishFiles[idx]?.secure_url ||
    dishFiles[idx]?.path ||
    "",
  imageUrl:
    item.imageUrl ||
    item.image ||
    dishFiles[idx]?.secure_url ||
    dishFiles[idx]?.path ||
    "",
}));

    // ✅ FIXED: Handle Cloudinary + already existing banner field
const bannerUrl =
  req.files?.messBanner?.[0]?.secure_url ||
  req.files?.messBanner?.[0]?.path ||
  body.messBanner ||
  "";

    const messCount = await Mess.countDocuments();

    const newMess = await Mess.create({
      mess_id: messCount + 1,
      name: body.name,
      location: body.location,
      price_range: body.price_range,
      offer: body.offer,
      owner_id: ownerId,
      banner: bannerUrl,
      menu: { items: parsedMenu },
      documents: {
        pancard: req.files?.pancard?.[0]?.path || req.files?.pancard?.[0]?.secure_url || "",
        fssai: req.files?.fssai?.[0]?.path || req.files?.fssai?.[0]?.secure_url || "",
        bankDetails: req.files?.bankDetails?.[0]?.path || req.files?.bankDetails?.[0]?.secure_url || "",
      },
    });

    return res.status(201).json({ success: true, message: "Mess created successfully", mess: newMess });
  } catch (err) {
    console.error("💥 Error creating mess:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/* ============================================================
   📋 GET ALL MESSES
   ============================================================ */
router.get("/", async (_req, res) => {
  try {
    const messes = await Mess.find()
      .populate("owner_id", "name email")
      .sort({ createdAt: -1 });
    res.json(messes);

  } catch (err) {
    console.error("💥 Fetch error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch messes" });
  }
});

/* ============================================================
   🍛 GET MESS BY ID
   ============================================================ */
router.get("/:id", async (req, res) => {
  try {
    const mess = await Mess.findOne({ mess_id: Number(req.params.id) });
    if (!mess) return res.status(404).json({ success: false, message: "Mess not found" });
    res.json(mess);

  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch mess" });
  }
});
// ============================================================
// ❌ DELETE A MENU ITEM FROM A MESS
// ============================================================
router.delete("/:messId/menu/:itemId", async (req, res) => {
  try {
    const { messId, itemId } = req.params;

    const mess = await Mess.findOne({ mess_id: Number(messId) });
    if (!mess) {
      return res.status(404).json({ success: false, message: "Mess not found" });
    }

    // Filter out the item
    mess.menu.items = mess.menu.items.filter(
      (item) => item._id.toString() !== itemId
    );

    await mess.save();
    res.json({ success: true, message: "Menu item deleted successfully", mess });
  } catch (err) {
    console.error("💥 Delete menu item error:", err);
    res.status(500).json({ success: false, message: "Failed to delete menu item" });
  }
});

export default router;
