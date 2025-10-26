import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const userSchema = new mongoose.Schema(
  {
    user_id: { type: Number, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "owner", "admin"], default: "student" },
  },
  { timestamps: true }
);

// ✅ Add Auto-Increment Plugin
const AutoIncrement = AutoIncrementFactory(mongoose);
userSchema.plugin(AutoIncrement, { inc_field: "user_id" });

const User = mongoose.model("User", userSchema);
export default User;
