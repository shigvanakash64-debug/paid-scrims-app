import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

/**
 * Upload file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} filename - Original filename
 * @returns {Promise<string>} - Secure URL of uploaded image
 */
export const uploadToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "scrim-results",
        resource_type: "auto",
        public_id: `${Date.now()}-${filename.split(".")[0]}`,
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          resolve(result.secure_url);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};
