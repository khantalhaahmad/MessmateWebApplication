import express from "express";
import DeliveryRequest from "../models/DeliveryRequest.js";
import DeliveryAgent from "../models/DeliveryAgent.js";

const router = express.Router();

// ✅ New delivery boy request (from frontend form)
router.post("/delivery-request", async (req, res) => {
  try {
    const request = new DeliveryRequest({
      ...req.body,
      date: new Date().toLocaleDateString("en-GB"), // DD/MM/YYYY
    });
    await request.save();
    res.status(201).json({ message: "Request submitted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Fetch all pending delivery requests
router.get("/delivery-requests", async (req, res) => {
  const requests = await DeliveryRequest.find({ status: "pending" });
  res.json(requests);
});

// ✅ Approve delivery request
router.post("/approve-delivery/:id", async (req, res) => {
  try {
    const request = await DeliveryRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    // Admin manually generates password
    const { generatedPassword } = req.body;

    const agent = new DeliveryAgent({
      name: request.name,
      phone: request.phone,
      email: request.email,
      city: request.city,
      vehicleType: request.vehicleType,
      vehicleNumber: request.vehicleNumber,
      password: generatedPassword,
    });

    await agent.save();
    await DeliveryRequest.findByIdAndDelete(req.params.id);

    res.json({ message: "Delivery agent approved and added to database" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Reject delivery request
router.delete("/reject-delivery/:id", async (req, res) => {
  await DeliveryRequest.findByIdAndDelete(req.params.id);
  res.json({ message: "Request rejected and deleted" });
});

export default router;
