/**
 * Convert uploaded image buffer to a data URL.
 * This avoids any external image hosting dependency.
 */
export const uploadToCloudinary = async (buffer, filename) => {
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
