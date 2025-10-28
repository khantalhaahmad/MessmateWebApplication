// Backend/middleware/uploadMiddleware.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// Cloudinary + Multer storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "messmate_uploads",
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "webp"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  },
});

// 5 MB limit per file
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;
