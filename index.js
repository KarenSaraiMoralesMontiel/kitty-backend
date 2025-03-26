require('dotenv').config()
const express =  require("express")
const morgan = require("morgan")
const cors = require("cors")

const Kitty = require('./models/kitty')
const ApiKey = require('./models/apiKey')
const db = require('./models/db')

const { uploadPhoto, optimizedUrl, deletePhoto } = require('./utils/cloudinary') // Adjust path as needed
const { generateApiKey } = require('./utils/generateApiKeys')
const checkPermissions = require('./utils/checkPermissions')



const multer = require("multer")
const upload = multer({ dest: 'uploads/' })

const app = express()

// 1. Middleware order matters!
app.use(express.json()) // Must come before Morgan
app.use(cors({
  origin: "https://first-react-production.up.railway.app/",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true // Si usas cookies/autorización
}));

// 2. Minimal one-line Morgan setup
morgan.token('body', (req) => req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : '-')
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))


//POSTS METHODS

//Welcome to the API

//GET read
app.get("/", checkPermissions('canView'),(request, response) => {
    response.send("<h1>Kitty Images</h1>")
})

app.get("/api/kittys", checkPermissions('canView'),async (request, response) => {
    try {
      const kittys = await Kitty.find({})
      
      response.json(kittys)
    } catch (error) {
      response.status(500).json({ error: "Server error" })
    }
  })
  
  // Get random kitty with optimizedURL
app.get("/api/kittys/search", checkPermissions('canView'), async (request, response) => {
    try {
      const kittyCount = await Kitty.countDocuments()
      if (kittyCount === 0) {
        return response.status(404).json({ error: "No Kittys found" })
      }
  
      const randomIndex = Math.floor(Math.random() * kittyCount)
      const randomKitty = await Kitty.findOne().skip(randomIndex)
  
      response.json(randomKitty)
  
    } catch (error) {
      response.status(500).json({ error: "Internal Server Error" })
    }
  })
  
  // Get specific kitty with optimizedURL
app.get("/api/kittys/:id", checkPermissions('canView'), async (request, response) => {
    try {
      const kitty = await Kitty.findById(request.params.id)
      if (!kitty) {
        return response.status(404).json({ error: "Kitty not found" })
      }
  
      response.json(kitty)
  
    } catch (error) {
      response.status(500).json({ error: "Server error" })
    }
  })


// Post METHODS

//upload users - only admin
app.post("/api/register",  checkPermissions('canManageKeys'), async (request, response) => {
  try {
    const { clientName, role } = request.body
    const { rawKey, hashedKey } = generateApiKey()

    // 2. Create and save API key (WITHOUT storing raw key)
    const apiKey = new ApiKey({
      key: hashedKey, // Only store the hashed version
      clientName: clientName,
      role: role
    })

    // 3. Save to database
    apiKey.save().then(
      response.status(201).json({
        success: true,
        clientName: clientName,
        role: role,
        key: rawKey, // Send this to client ONCE
        warning: "Store this key securely - it won't be shown again"
      })
    )
  } catch (error) {
    console.error("Registration error:", error)
    response.status(500).json({
      success: false,
      error: "Internal server error"
    })
  }
})
//Post a kitty to mongodb database
//upload telegram
app.post("/api/kittys", checkPermissions('canUpload'), async (request, response) => {
    const body = request.body

    if (!body.image_id || !body.hour) {
        return response.status(400).json({ 
            error: 'image or hour missing' 
          })
    } 
    
    const kitty = new Kitty ({
            "quote" : body.quote || "A cutie!",
            "image_id" : body.image_id,
            "hour" : body.hour || new Date.now()
        })
    
    kitty.save().then(savedKitty => {
        response.json(savedKitty)
    })
})

//telegram, admin
app.post('/api/kittys/images', checkPermissions('canUpload'),upload.array('photos'), async (request, response) => {
  try {
    const files = request.body.photos // Array of { photo_url, filename }

    const results = await Promise.all(
      files.map(file => {
        const prefix = files.length === 1 ? '' : 'bulk_'
        return uploadPhoto(file.photo_url,`${prefix}${file.filename}` ) 
      })
    )
    // Extract `public_ids` from Cloudinary's response
    const public_ids = results.map(result => result.public_id)


    response.json({ 
      success: true,
      public_ids // Return ACTUAL Cloudinary public_ids
    })
  } catch (error) {
    console.error('[Upload Error]', error)
    response.status(500).json({ 
      success: false,
      error: error.message 
    })
  }
})

//Delete a kitty
//admin
app.delete("/api/kittys/:id", checkPermissions('canDelete'), async (request, response) => {
      
        const result = Kitty.findByIdAndDelete(request.params.id)
            .then(result => {
            response.status(204).end()
    })
    .catch(error => next(error))
    
})
//admin
app.delete("api/kittys/images/:image_id", checkPermissions('canDelete'), async (request, response) => {
    const result = deletePhoto(image_id).then(
      result => {
        response.status(204).end()
      }
    ).catch(error => next(error))
})

const unknownEndPoint = (request, response) => {
    response.status(404).send({error: "Unknown Endpoint"})
}

app.use(unknownEndPoint)
PORT = process.env.PORT

// Listen on ALL network interfaces (IPv4 + IPv6)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT} (IPv4)`);
})