import express from "express";
import Mess from "../models/Mess.js";
import User from "../models/User.js";
import verifyToken from "../middleware/authMiddleware.js";
import {
  handleMulterErrors,
  messRequestUploads,
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* ============================================================
   CREATE NEW MESS REQUEST
============================================================ */

router.post(
  "/add",
  verifyToken,
  handleMulterErrors(messRequestUploads),
  async (req, res) => {
    try {

      const userId = req.user?.id || req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized user",
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const body = req.body || {};

      if (!body.name || !body.location) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: name, location",
        });
      }

      /* ---------------- MENU PARSING ---------------- */

      let parsedMenu = [];

      try {
        parsedMenu = JSON.parse(body.menu);
      } catch {
        parsedMenu = [];
      }

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

      /* ---------------- BANNER ---------------- */

      const bannerUrl =
        req.files?.messBanner?.[0]?.secure_url ||
        req.files?.messBanner?.[0]?.path ||
        body.messBanner ||
        "";

      /* ---------------- CREATE MESS ---------------- */

      const newMess = await Mess.create({
        name: body.name,
        location: body.location,
        price_range: body.price_range,
        offer: body.offer,
        owner_id: user._id,
        banner: bannerUrl,
        menu: { items: parsedMenu },
        status: "pending",
        isOpen: true, // default open
        documents: {
          pancard:
            req.files?.pancard?.[0]?.secure_url ||
            req.files?.pancard?.[0]?.path ||
            "",
          fssai:
            req.files?.fssai?.[0]?.secure_url ||
            req.files?.fssai?.[0]?.path ||
            "",
          bankDetails:
            req.files?.bankDetails?.[0]?.secure_url ||
            req.files?.bankDetails?.[0]?.path ||
            "",
        },
      });

      res.status(201).json({
        success: true,
        message: "Mess request submitted. Awaiting admin approval.",
        mess: newMess,
        role: user.role,
      });

    } catch (err) {

      console.error("Create mess error:", err);

      res.status(500).json({
        success: false,
        message: err.message || "Server error",
      });

    }
  }
);

/* ============================================================
   GET ALL MESSES (PUBLIC)
   CLOSED restaurants also returned
============================================================ */

router.get("/", async (req, res) => {

  try {

    const messes = await Mess.find({ status: "approved" })
      .populate("owner_id", "name email phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      messes
    });

  } catch (err) {

    console.error("Fetch mess error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch messes",
    });

  }

});

/* ============================================================
   GET MESS BY NUMERIC ID
============================================================ */

router.get("/:id", async (req, res) => {

  try {

    const mess = await Mess.findOne({
      mess_id: Number(req.params.id),
      status: "approved",
    });

    if (!mess) {

      return res.status(404).json({
        success: false,
        message: "Mess not found or not approved",
      });

    }

    res.json({
      success: true,
      mess
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: "Failed to fetch mess",
    });

  }

});

/* ============================================================
   TOGGLE RESTAURANT OPEN / CLOSE
   (OWNER ONLY)
============================================================ */

router.patch("/:messId/toggle-open", verifyToken, async (req, res) => {

  try {

    const { messId } = req.params;

    const mess = await Mess.findOne({
      mess_id: Number(messId)
    });

    if (!mess) {

      return res.status(404).json({
        success: false,
        message: "Mess not found",
      });

    }

    /* OWNER CHECK */

    if (String(mess.owner_id) !== String(req.user.id)) {

      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this mess",
      });

    }

    mess.isOpen = !mess.isOpen;

    await mess.save();

    res.json({
      success: true,
      isOpen: mess.isOpen,
      message: mess.isOpen
        ? "Restaurant opened successfully"
        : "Restaurant closed successfully",
    });

  } catch (err) {

    console.error("Toggle mess error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to toggle restaurant status",
    });

  }

});

/* ============================================================
   DELETE MENU ITEM (OWNER ONLY)
============================================================ */

router.delete("/:messId/menu/:itemId", verifyToken, async (req, res) => {

  try {

    const { messId, itemId } = req.params;

    const mess = await Mess.findOne({
      mess_id: Number(messId),
    });

    if (!mess) {

      return res.status(404).json({
        success: false,
        message: "Mess not found",
      });

    }

    if (String(mess.owner_id) !== String(req.user.id)) {

      return res.status(403).json({
        success: false,
        message: "You are not allowed to modify this mess",
      });

    }

    mess.menu.items = mess.menu.items.filter(
      (item) => item._id.toString() !== itemId
    );

    await mess.save();

    res.json({
      success: true,
      message: "Menu item deleted successfully",
      mess,
    });

  } catch (err) {

    console.error("Delete menu item error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to delete menu item",
    });

  }

});

export default router;