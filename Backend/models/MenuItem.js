import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
{
  mess_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Mess",
    required: true,
    index: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    default: ""
  },

  price: {
    type: Number,
    required: true
  },

  image: {
    type: String,
    default: ""
  },

  isVeg: {
    type: Boolean,
    default: true
  },

  category: {
    type: String,
    default: "other"
  },

  available: {
    type: Boolean,
    default: true
  }

},
{ timestamps: true }
);

/* =====================================
   Prevent duplicate item in same mess
===================================== */

menuItemSchema.index(
  { mess_id: 1, name: 1 },
  { unique: true }
);

/* =====================================
   Normalize item name
===================================== */

menuItemSchema.pre("save", function(next) {

  if (this.name) {
    this.name = this.name.trim().toLowerCase();
  }

  next();
});

export default mongoose.model("MenuItem", menuItemSchema);