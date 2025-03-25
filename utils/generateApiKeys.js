// utils/generateKey.js
const crypto = require('crypto')

function generateApiKey() {
  const rawKey = `ak_${crypto.randomBytes(32).toString('hex')}` // e.g., "ak_1a2b3c..."
  const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex')
  return { rawKey, hashedKey } // Send rawKey to client ONCE
}

module.exports = {
    generateApiKey
}