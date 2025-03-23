const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

const url = process.env.MONGODB_URI

console.log('connecting to', url)
mongoose.connect(url)
    .then(result => {
        console.log('connected to MongoDB')
    })
    .catch(error => {
        console.log('error connecting to MongoDB: ', error.message)
    })

const kittySchema = new mongoose.Schema({
        image: String,
        quote: {type:String, default:""},
        hour: {type: Date, default: Date.now}
      })
    
kittySchema.set('toJSON', {
        transform: (document, returnedObject) => {
            returnedObject.id = returnedObject._id.toString()
            delete returnedObject._id
            delete returnedObject.__v
        }
    })

module.exports = mongoose.model('Kitty', kittySchema)