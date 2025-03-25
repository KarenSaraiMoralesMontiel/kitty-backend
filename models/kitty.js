const mongoose = require('mongoose');
const {optimizedUrl} = require('../utils/cloudinary')

const kittySchema = new mongoose.Schema({
        image_id: String,
        quote: {type:String, default:""},
        hour: {type: Date, default: Date.now}
      })
    
kittySchema.set('toJSON', {
        transform: (document, returnedObject) => {
            returnedObject.id = returnedObject._id.toString()
            returnedObject.optimizedUrl = optimizedUrl(returnedObject.image_id)
            delete returnedObject._id
            delete returnedObject.__v
        }
    })

module.exports = mongoose.model('Kitty', kittySchema)