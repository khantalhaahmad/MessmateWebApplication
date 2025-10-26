// middleware/uploadMiddleware.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// ✅ Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Storage config
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "messmate_uploads",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
    transformation: [{ quality: "auto" }],
  },
});

// ✅ Multer instance
const upload = multer({ storage });

export default upload;
