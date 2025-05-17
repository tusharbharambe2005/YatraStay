const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require("path")
const methodOverride = require("method-override")
const ejsMate = require("ejs-mate")
const listingsRouter = require("./routes/listings.js")
const reviewsRouter = require("./routes/review.js")
const userRouter = require("./routes/user.js")
const session = require("express-session")
const flash = require("connect-flash")
const passport = require("passport")
const LocalStrategy = require("passport-local")
const User = require("./models/user.js")

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}))
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate)
app.use(express.static(path.join(__dirname,"/public")))

const sessionOptions = {
    secret:"mysupersecretcode",
    resave:false,
    saveUninitialized : true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly:true
    },              
}


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




app.get("/", (req, res) => {
    res.send("Hi, I am root");
});

app.use(session(sessionOptions));       
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next()
})

// app.get("/demo", async(req,res)=>{
//     let fackUser = new User({
//         email:"tushar@gmail.com",
//         username:"tushar"
//     });
//     const registerUser = await User.register(fackUser,"helloworld")
//     res.send(registerUser)
// })

app.use("/listings",listingsRouter)
app.use("/listings/:id/reviews",reviewsRouter)
app.use("/",userRouter)
//Reviews
// Post Reviews Route

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
