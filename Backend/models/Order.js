// models/Order.js
import mongoose from "mongoose";

/* ============================================================
   ORDER ITEM SCHEMA
============================================================ */

const orderItemSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
        trim: true
    },

    price: {
        type: Number,
        required: true
    },

    quantity: {
        type: Number,
        required: true,
        min: 1
    },

    image: {
        type: String,
        default: "default.png"
    },

    type: {
        type: String,
        enum: ["veg", "non-veg"],
        default: "veg"
    },

    category: {
        type: String,
        default: "other"
    }
},
{ _id: false }
);

/* ============================================================
   MAIN ORDER SCHEMA
============================================================ */

const orderSchema = new mongoose.Schema(
{
    /* -----------------------------
       USER
    ----------------------------- */

    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    /* -----------------------------
       MESS INFO
    ----------------------------- */

    mess_name: {
        type: String,
        required: true,
        trim: true
    },

    mess_id: {
        type: String,
        index: true
    },

    /* -----------------------------
       ORDER ITEMS
    ----------------------------- */

    items: {
        type: [orderItemSchema],
        required: true,
        default: []
    },

    /* -----------------------------
       PRICE
    ----------------------------- */

    total_price: {
        type: Number,
        required: true,
        min: 0
    },

    /* -----------------------------
       PAYMENT
    ----------------------------- */

    paymentMethod: {
        type: String,
        enum: ["Online", "COD"],
        default: "Online"
    },

    /* -----------------------------
       COMMISSION & EARNINGS
    ----------------------------- */

    platformCommission: {
        type: Number,
        default: 0
    },

    vendorEarning: {
        type: Number,
        default: 0
    },

    payoutStatus: {
        type: String,
        enum: ["pending", "paid"],
        default: "pending",
        index: true
    },

    /* -----------------------------
       ORDER STATUS (VENDOR FLOW)
    ----------------------------- */

    status: {
        type: String,
        enum: [
            "pending",
            "accepted",
            "preparing",
            "ready",
            "picked",
            "delivered",
            "cancelled"
        ],
        default: "pending",
        index: true
    },

    /* -----------------------------
       ORDER EXPIRY
    ----------------------------- */

    orderExpiresAt: {
        type: Date,
        default: null
    },

    /* -----------------------------
       DELIVERY AGENT
    ----------------------------- */

    deliveryAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeliveryAgent",
        default: null
    },

    /* ============================================================
       🚴 DELIVERY SYSTEM (ADDED ONLY THIS PART)
    ============================================================ */

    deliveryStatus: {
        type: String,
        enum: [
            "NOT_ASSIGNED",
            "ASSIGNED",
            "ACCEPTED",
            "REACHED_RESTAURANT",
            "PICKED_UP",
            "OUT_FOR_DELIVERY",
            "DELIVERED"
        ],
        default: "NOT_ASSIGNED"
    },

    pickupLocation: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
    },

    dropLocation: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
    },

    deliveryFee: {
        type: Number,
        default: 40
    },

    /* -----------------------------
       ORDER TIMESTAMPS
    ----------------------------- */

    acceptedAt: { type: Date, default: null },
    preparingAt: { type: Date, default: null },
    readyAt: { type: Date, default: null },
    pickedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null }

},
{
    timestamps: true
});

/* ============================================================
   INDEXES (PERFORMANCE)
============================================================ */

orderSchema.index({ user_id: 1 });
orderSchema.index({ mess_id: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderExpiresAt: 1 });
orderSchema.index({ payoutStatus: 1 });

/* ============================================================
   EXPORT MODEL
============================================================ */

export default mongoose.model("Order", orderSchema);