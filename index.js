require('dotenv').config()
const express =  require("express")
const morgan = require("morgan")
const mongoose = require("mongoose")
const cors = require("cors")

const Kitty = require('./models/kitty')
const ApiKey = require('./models/apiKey')
const db = require('./models/db')

const { uploadPhotosBulk , uploadPhoto, deletePhoto } = require('./utils/cloudinary') // Adjust path as needed
const { generateApiKey } = require('./utils/generateApiKeys')
const checkPermissions = require('./utils/checkPermissions')



const multer = require("multer")
const upload = multer({ dest: 'uploads/' })

const app = express()


const allowedOrigins = process.env.ALLOWED_ORIGINS

// 1. CORS Middleware (should be FIRST)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// 2. Special OPTIONS handler
app.options("*", (req, res) => res.sendStatus(200));

// 3. Other middleware (AFTER CORS)
app.use(express.json());
app.use(morgan("dev"));

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

// Atomic bulk upload endpoint
app.post('/api/kittys/images', checkPermissions('canUpload'), upload.none(), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Upload all photos
    const { public_ids, results } = await uploadPhotosBulk(req.body.photos);

    // 2. Create database entries
    const kitties = public_ids.map((public_id, index) => ({
      image_id: public_id,
      quote: req.body.photos[index]?.caption || "A cutie!",
      hour: new Date()
    }));

    await Kitty.insertMany(kitties, { session });

    // 3. Commit if successful
    await session.commitTransaction();
    res.json({ success: true, public_ids });

  } catch (error) {
    // 4. Rollback on failure
    await session.abortTransaction();
    
    // 5. Cleanup uploaded files (if any)
    

    console.error('[Bulk Upload Failed]', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  } finally {
    session.endSession();
  }
});

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
app.listen(PORT,  () => {
  console.log(`Server running on ${PORT} (IPv4)`);
})