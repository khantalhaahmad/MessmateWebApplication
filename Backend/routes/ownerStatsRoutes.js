import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Mess from "../models/Mess.js";
import Review from "../models/Review.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* ============================================================
   OWNER DASHBOARD STATS
============================================================ */

router.get("/:ownerId/stats", authMiddleware, async (req,res)=>{

try{

const {ownerId} = req.params

/* -----------------------------
   FIND OWNER MESSES
----------------------------- */

const messes = await Mess.find({
owner_id: ownerId
})

if(!messes.length){

return res.json({

messId:null,

ordersToday:0,
revenueToday:0,
customersToday:0,

totalOrders:0,
totalRevenue:0,
averageOrderValue:0,

activeCustomers:0,

avgRating:0,

topItems:[],

weeklyOrders:Array(7).fill(0),
monthlyRevenue:Array(4).fill(0),

recentOrders:[]
})

}

/* -----------------------------
   MESS IDS
----------------------------- */

const messIds = messes.map(m => m._id.toString())

/* -----------------------------
   FETCH ORDERS
----------------------------- */

const orders = await Order.find({
mess_id: { $in: messIds }
}).lean()

/* -----------------------------
   TOTAL STATS
----------------------------- */

const totalOrders = orders.length

const totalRevenue = orders.reduce(
(sum,o)=> sum + (o.total_price || 0)
,0)

const averageOrderValue =
totalOrders > 0 ? totalRevenue / totalOrders : 0

const activeCustomers = new Set(
orders.map(o => o.user_id?.toString())
).size

/* -----------------------------
   TODAY STATS
----------------------------- */

const today = new Date()
today.setHours(0,0,0,0)

const todaysOrders = orders.filter(o => {
const d = new Date(o.createdAt)
return d >= today
})

const ordersToday = todaysOrders.length

const revenueToday = todaysOrders.reduce(
(sum,o)=> sum + (o.total_price || 0)
,0)

const customersToday = new Set(
todaysOrders.map(o=>o.user_id?.toString())
).size

/* -----------------------------
   TOP SELLING ITEMS
----------------------------- */

const itemCount = {}

orders.forEach(order => {

(order.items || []).forEach(item => {

const name = item.name

if(!itemCount[name]){
itemCount[name] = 0
}

itemCount[name] += item.quantity || 1

})

})

const topItems = Object.entries(itemCount)
.map(([name,count])=>({name,count}))
.sort((a,b)=>b.count-a.count)
.slice(0,5)

/* -----------------------------
   REVIEWS
----------------------------- */

const reviews = await Review.find({
mess_id: { $in: messIds }
})

const avgRating =
reviews.length
? reviews.reduce((s,r)=>s+(r.rating||0),0)/reviews.length
: 0

/* -----------------------------
   WEEKLY + MONTHLY
----------------------------- */

const weeklyOrders = Array(7).fill(0)
const monthlyRevenue = Array(4).fill(0)

orders.forEach(o=>{

const d = new Date(o.createdAt)

if(!isNaN(d)){

weeklyOrders[d.getDay()]++

const weekIndex = Math.floor((d.getDate()-1)/7)

if(weekIndex>=0 && weekIndex<4){

monthlyRevenue[weekIndex]+=o.total_price || 0

}

}

})

/* -----------------------------
   RECENT ORDERS
----------------------------- */

const recentOrders = orders
.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt))
.slice(0,5)
.map(o=>({

orderId:o._id,

messId:o.mess_id,

items:o.items || [],

totalPrice:o.total_price || 0,

status:o.status || "pending",

createdAt:o.createdAt

}))

/* -----------------------------
   RESPONSE
----------------------------- */

res.json({

messId:messIds[0],

ordersToday,
revenueToday,
customersToday,

totalOrders,
totalRevenue,
averageOrderValue,

activeCustomers,

avgRating:Number(avgRating.toFixed(1)),

topItems,

weeklyOrders,
monthlyRevenue,

weeklyLabels:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],

monthlyLabels:["Week 1","Week 2","Week 3","Week 4"],

recentOrders

})

}catch(err){

console.error("Owner stats error:",err)

res.status(500).json({
success:false,
message:"Error generating stats",
error:err.message
})

}

})

/* ============================================================
   OWNER ORDERS (WITH STATUS FILTER)
============================================================ */

router.get("/:ownerId/orders", authMiddleware, async (req,res)=>{

try{

const {ownerId} = req.params
const {status} = req.query

const messes = await Mess.find({ owner_id: ownerId })

const messIds = messes.map(m => m._id.toString())

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

console.error("Owner orders error:",err)

res.status(500).json({
success:false,
message:"Error fetching orders",
error:err.message
})

}

})

/* ============================================================
   OWNER REVIEWS
============================================================ */

router.get("/:ownerId/reviews", authMiddleware, async (req,res)=>{

try{

const {ownerId} = req.params

const messes = await Mess.find({ owner_id: ownerId })

const messIds = messes.map(m => m._id.toString())

const reviews = await Review.find({
mess_id: { $in: messIds }
})

res.json({
success:true,
reviews
})

}catch(err){

res.status(500).json({
success:false,
message:"Error fetching reviews",
error:err.message
})

}

})

export default router;