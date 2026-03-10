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
       ORDER STATUS
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
       ORDER EXPIRY (AUTO CANCEL)
       Used for 60s vendor response timer
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

    /* -----------------------------
       ORDER TIMESTAMPS
    ----------------------------- */

    acceptedAt: {
        type: Date,
        default: null
    },

    preparingAt: {
        type: Date,
        default: null
    },

    readyAt: {
        type: Date,
        default: null
    },

    pickedAt: {
        type: Date,
        default: null
    },

    deliveredAt: {
        type: Date,
        default: null
    },

    cancelledAt: {
        type: Date,
        default: null
    }

},
{
    timestamps: true
}
);

/* ============================================================
   INDEXES (PERFORMANCE)
============================================================ */

orderSchema.index({ user_id: 1 });
orderSchema.index({ mess_id: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderExpiresAt: 1 });

/* ============================================================
   EXPORT MODEL
============================================================ */

export default mongoose.model("Order", orderSchema);