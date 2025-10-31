import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: String,
  mess_id: { type: mongoose.Schema.Types.ObjectId, ref: "Mess" },
});

const MenuItem = mongoose.model("MenuItem", menuItemSchema);
export default MenuItem;