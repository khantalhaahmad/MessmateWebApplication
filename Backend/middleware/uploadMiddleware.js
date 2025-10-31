// Backend/middleware/uploadMiddleware.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

/* ============================================================
   🔎 Validation + helpers
   ============================================================ */
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

const sanitizeBase = (name = "file") =>
  String(name)
    .replace(/\.[^.]+$/, "")       // drop extension
    .replace(/[^\w\-]+/g, "_")     // non-word -> _
    .replace(/_+/g, "_")           // collapse __
    .slice(0, 60) || "file";

const pickFolder = (field = "") => {
  if (field === "messBanner") return "messmate/mess-banner";
  if (field === "dishImages") return "messmate/dishes";
  if (["pancard", "fssai", "menuPhoto", "bankDetails"].includes(field)) return "messmate/docs";
  return "messmate/uploads";
};

/* ============================================================
   ☁️ CLOUDINARY STORAGE CONFIGURATION
   - file.path     => secure_url
   - file.filename => public_id
   ============================================================ */
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    if (!file?.mimetype) throw new Error("Unknown file type.");
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new Error("Unsupported file format. Only JPG/PNG/WEBP images are allowed.");
    }

    const folder = pickFolder(file.fieldname);
    const slug = sanitizeBase(file.originalname);

    return {
      folder,
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      public_id: `${file.fieldname}-${Date.now()}-${slug}`,
      use_filename: false,
      unique_filename: true,
      overwrite: false,
      transformation: [{ quality: "auto:good", fetch_format: "auto" }],
    };
  },
});

/* ============================================================
   🧩 MULTER INSTANCE
   ============================================================ */
const baseUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 60,                 // hard cap per request
  },
  fileFilter: (_req, file, cb) => {
    if (!file?.mimetype?.startsWith?.("image/")) {
      return cb(new Error("Only image files are allowed."), false);
    }
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error("Unsupported image type."), false);
    }
    cb(null, true);
  },
});

/* ============================================================
   📦 Fields map for mess request (matches your frontend)
   ============================================================ */
export const messRequestUploads = baseUpload.fields([
  { name: "messBanner", maxCount: 1 },
  { name: "pancard", maxCount: 1 },
  { name: "fssai", maxCount: 1 },
  { name: "bankDetails", maxCount: 1 },
  { name: "dishImages", maxCount: 50 },
]);

/* ============================================================
   🛡️ Graceful error wrapper with clearer messages
   Usage: handleMulterErrors(messRequestUploads)
   ============================================================ */
export const handleMulterErrors = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (!err) return next();

    console.error("❌ Multer Upload Error:", err);

    // Multer coded errors
    if (err.code) {
      const code = err.code;
      const map = {
        LIMIT_FILE_SIZE: "One or more files exceed the 5 MB size limit.",
        LIMIT_FILE_COUNT: "Too many files uploaded.",
        LIMIT_UNEXPECTED_FILE:
          "Unexpected file field. Allowed: messBanner, pancard, fssai, menuPhoto, bankDetails, dishImages.",
        LIMIT_PART_COUNT: "Too many parts in the request.",
        LIMIT_FIELD_KEY: "Field name too long.",
        LIMIT_FIELD_VALUE: "Field value too long.",
        LIMIT_FIELD_COUNT: "Too many fields.",
      };
      return res.status(400).json({
        success: false,
        message: map[code] || "Upload failed due to a Multer error.",
        code,
      });
    }

    // Generic errors (validation/mimetype/etc.)
    return res.status(400).json({
      success: false,
      message: err.message || "Upload failed.",
    });
  });
};

/* ============================================================
   ✨ Default export (kept same for your existing imports)
   ============================================================ */
export default baseUpload;
