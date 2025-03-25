const ApiKey = require('../models/apiKey')
const crypto = require('crypto')
// Simplified permission matrix
const ROLE_PERMISSIONS = {
  'admin': {
    canUpload: true,
    canView: true,
    canDelete: true,
    canManageKeys: true
  },
  'uploader': {
    canUpload: true,
    canView: true,
    canDelete: false,
    canManageKeys: false
  },
  'viewer': {
    canUpload: false,
    canView: true,
    canDelete: false,
    canManageKeys: false
  }
}

module.exports = (requiredPermission) => {
  return async (request, response, next) => {
    const apiKey = request.headers['x-api-key']
    if (!apiKey) return response.status(401).json({ error: "API key required" })


    // Find key in DB
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex')
    const keyDoc = await ApiKey.findOne({ key: hashedKey, isActive: true })
    
    if (!keyDoc) return response.status(403).json({ error: "Invalid API key" })
    
    // Check permissions
    const rolePermissions = ROLE_PERMISSIONS[keyDoc.role]
    if (!rolePermissions[requiredPermission]) {
      return response.status(403).json({ 
        error: `Invalid Request`
      })
    }

    request.keyDoc = keyDoc // Attach for later use
    next()
  }
}