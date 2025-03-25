const cloudinary = require("cloudinary").v2;

const CLOUDINARY_NAME = process.env.CLOUDINARY_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

// Configure with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Force HTTPS
});


const optimizedUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    quality: 'auto',
    fetch_format: 'auto',
    width: 1200,
    ...transformations // Allows custom overrides
  });
};

const uploadPhoto = async (filePath, publicId, folder = "kitty_images") => {
    // Remove file extension from publicId
    const filenameWithoutExtension = publicId.replace(/\.[^/.]+$/, ""); // Removes .jpeg, .png, etc.
    const fullPublicId = `${filenameWithoutExtension.replace(/\//g, '_')}`;
    
    const result = await cloudinary.uploader.upload(filePath, {
        public_id: fullPublicId, // No extension
        overwrite: false,
        resource_type: 'auto',
        folder: folder
    });
    
    return result;
};


const deletePhoto = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true // Clear CDN cache
    });
    return result;
  } catch (error) {
    console.error(`[Cloudinary] Deletion failed for ${publicId}:`, error.message);
    throw new Error('IMAGE_DELETE_FAILED');
  }
};

module.exports = {
  optimizedUrl,
  uploadPhoto,
  deletePhoto,
  cloudinary // Expose direct access if needed
};