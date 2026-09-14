import express from "express";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

const app=express();
const PORT=8080;


app.get("/commerce",(req,res)=>{
   res.send("API working ")
})



const dbConnect=async()=>{
    await mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Safely Connected With MongoDB Atlas");

        app.listen(PORT,(req,res)=>{
            console.log(`App is listening on port ${PORT}`);
        });
    }).catch((err)=>{
        console.log("Some Error occured while connecting with  MongoDB Atla",err);
    })
}

dbConnect();