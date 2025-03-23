require('dotenv').config()
const express =  require("express");
const morgan = require("morgan");
const cors = require("cors");
const Kitty = require('./models/kitty')
const app = express();


morgan.token('body', (req) =>
    Object.values(req.body)[0] ? JSON.stringify(req.body) : null
  )
  // morgan.token('type',  req=>req.headers['content-type'])
app.use(cors())
app.use(
    morgan(':method :url :status :res[content-length] - :response-time ms :body')
  )
app.use(express.json())


//POSTS METHODS

//Welcome to the API
app.get("/", (request, response) => {
    response.send("<h1>Kitty Images</h1>")
})

//get all kittys photos metadata
app.get("/api/kittys", (request, response) => {

    console.log("Entering")
    Kitty.find({}).then(kittys => {
        response.json(kittys)
        console.log(kittys)
      })
    console.log("Leaving!")
})

//get a random kitty photo metadata 
app.get("/api/kittys/search", async (request, response) => {
    console.log("Entering")

    try {
        const kittyCount = await Kitty.countDocuments();
        if (kittyCount === 0) {
            return response.status(404).json({ error: "No Kittys found" });
        }

        const randomIndex = Math.floor(Math.random() * kittyCount);
        const randomKitty = await Kitty.findOne().skip(randomIndex);

        response.json(randomKitty);
    } catch (error) {
        response.status(500).json({ error: "Internal Server Error" });
    }
});

//get an specific kitty photo metadata according to id
app.get("/api/kittys/:id", async (request, response) => {
    Kitty.findById(request.params.id).then(kitty => {
        response.json(kitty)
    })
})

//Post a kitty to mongodb database
app.post("/api/kittys", async (request, response) => {
    const body = request.body

    if (!body.image) {
        return response.status(400).json({ 
            error: 'image or hour missing' 
          })
    } 
    
    const kitty = new Kitty ({
            "quote" : body.quote,
            "image" : body.image,
            "hour" : body.hour
        })
    
    kitty.save().then(savedKitty => {
        response.json(savedKitty)
    })
    
    
})

app.post("api/kittys/images", async (request, response) => {

})


//Delete a kitty
app.delete("/api/kittys/:id", async (request, response) => {
      
        response.status(204).end()
        Kitty.findByIdAndDelete(request.params.id)
            .then(result => {
            response.status(204).end()
    })
    .catch(error => next(error))
    
})

const unknownEndPoint = (request, response) => {
    response.status(404).send({error: "Unknown Endpoint"});
}

app.use(unknownEndPoint);
PORT = process.env.PORT;
app.listen(PORT);
console.log(`Server running on port ${PORT}`);