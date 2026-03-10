// routes/OrderRoutes.js
import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Mess from "../models/Mess.js";
import User from "../models/User.js";
import admin from "../config/firebaseAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

/* ============================================================
   PLACE ORDER
============================================================ */

router.post("/", verifyToken, async (req, res) => {

try {

const firebaseUid = req.user?.uid;
const backendId = req.user?.id;

const { mess_id, mess_name, items, paymentMethod, total_price } = req.body;

/* -----------------------------
   FIND USER
----------------------------- */

const dbUser = await User.findOne({
$or: [{ _id: backendId }, { firebaseUid }]
});

if (!dbUser) {
return res.status(401).json({
success:false,
message:"User not found"
});
}

/* -----------------------------
   VALIDATE ITEMS
----------------------------- */

if (!Array.isArray(items) || items.length === 0) {
return res.status(400).json({
success:false,
message:"No food items provided"
});
}

/* -----------------------------
   TOTAL PRICE
----------------------------- */

const finalTotal = total_price ||
items.reduce((sum,item)=>
sum + (item.price || 0) * (item.quantity || 1)
,0);

/* -----------------------------
   FIND MESS
----------------------------- */

let mess = null;

if (mess_id && mongoose.Types.ObjectId.isValid(mess_id)) {
mess = await Mess.findById(mess_id);
}

if (!mess && mess_id && !isNaN(Number(mess_id))) {
mess = await Mess.findOne({ mess_id:Number(mess_id) });
}

if (!mess && mess_name) {
mess = await Mess.findOne({ name:mess_name });
}

/* -----------------------------
   NORMALIZE ITEMS
----------------------------- */

const updatedItems = items.map(item => ({
...item,
type: item.type || "veg",
category: item.category || "other",
image: item.image || "default.png"
}));

/* -----------------------------
   CREATE ORDER
----------------------------- */

const newOrder = await Order.create({

user_id: dbUser._id,

mess_id: mess?._id?.toString() || String(mess_id),

mess_name: mess?.name || mess_name || "Unknown Mess",

items: updatedItems,

total_price: finalTotal,

paymentMethod: paymentMethod || "Online",

status: "pending",

orderExpiresAt: new Date(Date.now() + 60000)

});

console.log("New Order:", newOrder._id);

/* ============================================================
   AUTO CANCEL AFTER 60s
============================================================ */

setTimeout(async () => {

try{

const order = await Order.findById(newOrder._id);

if(order && order.status === "pending"){

order.status = "cancelled";
order.cancelledAt = new Date();

await order.save();

console.log("Auto cancelled order:",order._id);

const io = req.app.get("io");

if(io && mess?.owner_id){

io.to(`owner_${mess.owner_id}`).emit("order_auto_cancelled",order);

}

}

}catch(err){

console.log("Auto cancel error:",err.message)

}

},60000);

/* ============================================================
   NOTIFY OWNER
============================================================ */

try {

const io = req.app.get("io");
const ownerId = mess?.owner_id?.toString();

if (io && ownerId) {

io.to(`owner_${ownerId}`).emit("new_order", newOrder);

}

const owner = await User.findById(ownerId);

if (owner?.fcmToken) {

await admin.messaging().send({

token: owner.fcmToken,

notification: {
title:"New Order Received",
body:`₹${newOrder.total_price} order received`
},

data:{
orderId:newOrder._id.toString()
}

});

}

}catch(e){
console.log("Notification error",e.message)
}

res.status(201).json({
success:true,
order:newOrder,
expiresIn:60
});

}catch(err){

console.error("Order Error:",err)

res.status(500).json({
success:false,
message:err.message
})

}

});

/* ============================================================
   UPDATE ORDER STATUS
============================================================ */

router.patch("/:id/status", verifyToken, async (req,res)=>{

try{

const {status} = req.body;

const order = await Order.findByIdAndUpdate(
req.params.id,
{ status },
{ new:true }
);

if(!order){

return res.status(404).json({
success:false,
message:"Order not found"
})

}

/* notify user */

const io = req.app.get("io");

if(io){
io.to(`user_${order.user_id}`).emit("order_status",order)
}

res.json({
success:true,
order
})

}catch(err){

res.status(500).json({
success:false,
message:err.message
})

}

})

/* ============================================================
   ACCEPT ORDER
============================================================ */

router.patch("/:id/accept", verifyToken, async (req,res)=>{

const order = await Order.findByIdAndUpdate(
req.params.id,
{
status:"accepted",
acceptedAt:new Date()
},
{new:true}
)

res.json({success:true,order})

})

/* ============================================================
   REJECT ORDER
============================================================ */

router.patch("/:id/reject", verifyToken, async (req,res)=>{

const order = await Order.findByIdAndUpdate(
req.params.id,
{
status:"cancelled",
cancelledAt:new Date()
},
{new:true}
)

res.json({success:true,order})

})

/* ============================================================
   PREPARING ORDER
============================================================ */

router.patch("/:id/preparing", verifyToken, async (req,res)=>{

const order = await Order.findByIdAndUpdate(
req.params.id,
{
status:"preparing",
preparingAt:new Date()
},
{new:true}
)

res.json({success:true,order})

})

/* ============================================================
   ORDER READY
============================================================ */

router.patch("/:id/ready", verifyToken, async (req,res)=>{

const order = await Order.findByIdAndUpdate(
req.params.id,
{
status:"ready",
readyAt:new Date()
},
{new:true}
)

res.json({success:true,order})

})

/* ============================================================
   USER ORDERS
============================================================ */

router.get("/my-orders", verifyToken, async (req,res)=>{

const orders = await Order.find({
user_id:req.user.id
}).sort({createdAt:-1})

res.json({
success:true,
orders
})

})

/* ============================================================
   OWNER ORDERS
============================================================ */

router.get("/owner/:ownerId", verifyToken, async (req,res)=>{

try{

const {ownerId} = req.params
const {status} = req.query

const messes = await Mess.find({owner_id:ownerId})
const messIds = messes.map(m=>m._id.toString())

let filter = { mess_id: { $in: messIds } }

if(status){
filter.status = status
}

const orders = await Order.find(filter)
.sort({createdAt:-1})

res.json({
success:true,
orders
})

}catch(err){

res.status(500).json({
success:false,
message:err.message
})

}

})

export default router