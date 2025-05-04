const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Listing = require("../majorproject/models/listing.js");
const path = require("path")
const methodOverride = require("method-override")
const ejsMate = require("ejs-mate")
const wrapAsync = require("./utils/wrapAsync.js")
const ExpressError = require("./utils/ExpressError.js")
const {listingSchema}= require("./schema.js")

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}))
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate)
app.use(express.static(path.join(__dirname,"/public")))

async function main() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1); // Exit process on connection failure
    }
}

main();

const validatelisting = (req,res,next)=>{
    let {error} = listingSchema.validate(req.body)
    if(error){
        let errMsg = error.details.map((el)=> el.message).join(",");
        throw new ExpressError(400,errMsg);
    }else{
        next();
    }
}

app.get("/", (req, res) => {
    res.send("Hi, I am root");
});

//index router
app.get('/listings', wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render('listings/index', { allListings });
}));

//New Router
app.get("/listings/new",(req,res)=>{
    res.render("listings/new.ejs")
})

//show route
app.get("/listings/:id",wrapAsync(async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs",{listing})
}))

//create route
app.post("/listings",validatelisting, wrapAsync(async (req, res, next) => {
    
        const newListing = new Listing(req.body.listing);
        await newListing.save();        
        res.redirect("/listings");
}));


//Edit Route
app.get("/listings/:id/edit", validatelisting,wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
  }));
  
  //Update Route
  app.put("/listings/:id", validatelisting, wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
  }));

//delete Route
app.delete("/listings/:id", wrapAsync(async (req,res)=>{
    let { id }=req.params;
    let deletedListing= await Listing.findByIdAndDelete(id)
    console.log(deletedListing)
    res.redirect("/listings")
  }))


// app.get("/testListing", async (req, res) => {
//     try {
//         let sampleListing = new Listing({
//             title: "My New Villa",
//             description: "By the beach",
//             price: 1200,
//             location: "Calangute, Goa",
//             country: "India"
//         });
//         await sampleListing.save();
//         console.log("Sample listing was saved");
//         res.send("Successful testing");
//     } catch (error) {
//         console.error("Error saving sample listing:", error);
//         res.status(500).send("Failed to save sample listing");
//     }
// });

// app.all("/   *", (req, res, next) => {
//     next(new ExpressError("somthing went wrong!",404   ));
// });

app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong!" } = err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs",{err})
});


const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
