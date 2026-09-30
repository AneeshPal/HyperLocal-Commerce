import express from "express";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import cors from "cors";
import authMiddleware from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listing.js";


const app=express();
const PORT=8080;


app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);



app.get("/commerce",(req,res)=>{
   res.send("API working ")
})


app.get("/api/protected", authMiddleware, (req, res) => {
    res.json({
        message: "You accessed a protected route",
        userId: req.user
    });
});



// connecting with MongoDB Atlas.
const dbConnect=async()=>{
    await mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Safely Connected With MongoDB Atlas");
        console.log("Database name:", mongoose.connection.name);
        app.listen(PORT,(req,res)=>{
            console.log(`App is listening on port ${PORT}`);
        });
    }).catch((err)=>{
        console.log("Some Error occured while connecting with  MongoDB Atla",err);
    })
}

dbConnect();