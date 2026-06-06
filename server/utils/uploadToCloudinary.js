import cloudinary from "../config/cloudinary.js";

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const fallbackDataUrl = (buffer, filename) => {
  const extension = (filename?.split(".").pop() || "png").toLowerCase();
  const mimeType = extension === "jpg" || extension === "jpeg"
    ? "image/jpeg"
    : extension === "png"
      ? "image/png"
      : extension === "gif"
        ? "image/gif"
        : extension === "webp"
          ? "image/webp"
          : "image/png";

  return `data:${mimeType};base64,${buffer.toString("base64")}`;
};

export const uploadToCloudinary = async (buffer, filename) => {
  if (!hasCloudinaryConfig) {
    return fallbackDataUrl(buffer, filename);
  }

  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "scrim-results",
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
      },
      (error, uploadResult) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(uploadResult);
      }
    );

    uploadStream.end(buffer);
  });

  return result?.secure_url || result?.url || fallbackDataUrl(buffer, filename);
};
