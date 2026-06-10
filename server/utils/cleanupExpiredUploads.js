import cloudinary from "../config/cloudinary.js";
import Match from "../models/Match.js";

const RETENTION_MS = 48 * 60 * 60 * 1000;

const extractPublicIdFromUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    const uploadIndex = pathParts.indexOf("upload");

    if (uploadIndex === -1) {
      return null;
    }

    const afterUpload = [...pathParts.slice(uploadIndex + 1)];
    if (/^\d+$/.test(afterUpload[0] || "")) {
      afterUpload.shift();
    }

    if (afterUpload.length === 0) {
      return null;
    }

    return afterUpload.join("/").replace(/\.[^/.]+$/, "");
  } catch (error) {
    console.warn("Failed to parse Cloudinary URL for cleanup:", error.message);
    return null;
  }
};

export const cleanupExpiredUploads = async () => {
  try {
    const cutoff = new Date(Date.now() - RETENTION_MS);
    const matches = await Match.find({
      $or: [
        { "paymentScreenshots.uploadedAt": { $lt: cutoff } },
        { "result.screenshots.uploadedAt": { $lt: cutoff } },
      ],
    });

    let deletedCount = 0;

    for (const match of matches) {
      let changed = false;

      const pruneArray = async (items = []) => {
        const remaining = [];

        for (const item of items) {
          const uploadedAt = item?.uploadedAt ? new Date(item.uploadedAt) : null;
          if (uploadedAt && uploadedAt < cutoff) {
            const publicId = extractPublicIdFromUrl(item.image);
            if (publicId) {
              try {
                await cloudinary.uploader.destroy(publicId);
              } catch (destroyError) {
                console.warn(`Failed to delete image ${item.image}:`, destroyError.message);
              }
            }
            deletedCount += 1;
            changed = true;
            continue;
          }
          remaining.push(item);
        }

        return remaining;
      };

      match.paymentScreenshots = await pruneArray(match.paymentScreenshots || []);
      match.result.screenshots = await pruneArray(match.result.screenshots || []);

      if (changed) {
        await match.save();
      }
    }

    return {
      success: true,
      deletedCount,
      cutoff,
    };
  } catch (error) {
    console.error("cleanupExpiredUploads error:", error);
    return {
      success: false,
      deletedCount: 0,
      error: error.message,
    };
  }
};
