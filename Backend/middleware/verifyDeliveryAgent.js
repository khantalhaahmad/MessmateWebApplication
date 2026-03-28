import DeliveryAgent from "../models/DeliveryAgent.js";

export const verifyDeliveryAgent = async (req, res, next) => {
  try {
    /* -----------------------------
       STEP 1: CHECK USER
    ----------------------------- */
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    /* -----------------------------
       STEP 2: ROLE CHECK
    ----------------------------- */
    if (req.user.role !== "delivery") {
      return res.status(403).json({
        success: false,
        message: "Access denied (delivery only)"
      });
    }

    /* -----------------------------
       STEP 3: FIND AGENT (🔥 HERE)
    ----------------------------- */
    const agent = await DeliveryAgent.findOne({
      userId: req.user.id
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Delivery profile not found"
      });
    }

    /* -----------------------------
       STEP 4: ATTACH
    ----------------------------- */
    req.agent = agent;

    next();

  } catch (error) {
    console.error("verifyDeliveryAgent error:", error);
    res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }
};