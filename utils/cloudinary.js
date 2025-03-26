const cloudinary = require("cloudinary").v2
const Kitty = require('../models/kitty')
const mongoose = require('mongoose')

const CLOUDINARY_NAME = process.env.CLOUDINARY_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

// Configure with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Force HTTPS
})


const optimizedUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    quality: 'auto',
    fetch_format: 'auto',
    width: 1200,
    ...transformations // Allows custom overrides
  })
}

const uploadPhoto = async (filePath, publicId, folder = "kitty_images") => {
    // Remove file extension from publicId
    const filenameWithoutExtension = publicId.replace(/\.[^/.]+$/, "") // Removes .jpeg, .png, etc.
    const fullPublicId = `${filenameWithoutExtension.replace(/\//g, '_')}`
    console.log(filePath)
    
    const result = await cloudinary.uploader.upload(filePath, {
        public_id: fullPublicId, // No extension
        overwrite: false,
        resource_type: 'auto',
        folder: folder
    })
    
    return result
}


const deletePhoto = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true // Clear CDN cache
    })
    return result
  } catch (error) {
    console.error(`[Cloudinary] Deletion failed for ${publicId}:`, error.message)
    throw new Error('IMAGE_DELETE_FAILED')
  }
}

// Add this new function to your existing middleware
const uploadPhotosBulk = async (files, folder='kitty_images') => {
  const results = await Promise.all(
    files.map(file => {
      const prefix = files.length === 1 ? '' : 'bulk_';
      const filenameWithoutExtension = file.filename.replace(/\.[^/.]+$/, "");
      const publicId = `${prefix}${filenameWithoutExtension.replace(/\//g, '_')}`;
      
      return cloudinary.uploader.upload(file.photo_url, {
        public_id: publicId,
        overwrite: false,
        resource_type: 'auto',
        folder: folder
      });
    })
  );

  return {
    public_ids: results.map(r => r.public_id),
    results // Full Cloudinary responses
  };
};

module.exports = {
  optimizedUrl,
  uploadPhoto,
  deletePhoto,
  uploadPhotosBulk, // Add this
  cloudinary
};