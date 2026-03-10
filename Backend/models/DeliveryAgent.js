// models/DeliveryAgent.js
import mongoose from "mongoose";

/* ============================================================
   DELIVERY AGENT SCHEMA
============================================================ */

const deliveryAgentSchema = new mongoose.Schema(
{
    /* -----------------------------
       BASIC INFO
    ----------------------------- */

    name: {
        type: String,
        required: true,
        trim: true
    },

    phone: {
        type: String,
        required: true,
        unique: true
    },

    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },

    city: {
        type: String,
        default: ""
    },

    /* -----------------------------
       VEHICLE INFO
    ----------------------------- */

    vehicleType: {
        type: String,
        enum: ["bike", "scooter", "cycle", "car"],
        default: "bike"
    },

    vehicleNumber: {
        type: String,
        default: ""
    },

    /* -----------------------------
       LOGIN
    ----------------------------- */

    password: {
        type: String,
        required: true
    },

    /* -----------------------------
       ACCOUNT STATUS
    ----------------------------- */

    status: {
        type: String,
        enum: ["active", "inactive", "blocked"],
        default: "active"
    },

    approvedAt: {
        type: Date
    },

    /* -----------------------------
       AVAILABILITY (VERY IMPORTANT)
    ----------------------------- */

    isAvailable: {
        type: Boolean,
        default: true
    },

    /* -----------------------------
       CURRENT ORDER
    ----------------------------- */

    currentOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        default: null
    },

    /* -----------------------------
       LIVE LOCATION
    ----------------------------- */

    location: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
    }

},
{
    timestamps: true
});

/* ============================================================
   INDEXES (PERFORMANCE)
============================================================ */

deliveryAgentSchema.index({ phone: 1 });
deliveryAgentSchema.index({ status: 1 });
deliveryAgentSchema.index({ isAvailable: 1 });

export default mongoose.model("DeliveryAgent", deliveryAgentSchema);