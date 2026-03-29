import mongoose from "mongoose";

const deliveryAgentSchema = new mongoose.Schema(
{
    /* -----------------------------
       🔗 LINK WITH USER (IMPORTANT)
    ----------------------------- */

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

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
        unique: true,
        trim: true
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
        enum: ["bike", "scooty", "Bike", "Scooty"],
        default: "bike"
    },

    vehicleNumber: {
        type: String,
        default: ""
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
       ONLINE / AVAILABILITY
    ----------------------------- */

    isOnline: {
        type: Boolean,
        default: false
    },

    isAvailable: {
        type: Boolean,
        default: true
    },

    /* -----------------------------
       CURRENT ORDER
    ----------------------------- */

    currentOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        default: null
    },

    /* -----------------------------
       LOCATION
    ----------------------------- */

    location: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
    },

    /* -----------------------------
       EARNINGS
    ----------------------------- */

    totalEarnings: {
        type: Number,
        default: 0
    }

},
{
    timestamps: true
});

export default mongoose.model("DeliveryAgent", deliveryAgentSchema);