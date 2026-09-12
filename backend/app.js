import express from "express";

const app=express();
const PORT=8080;








//Routes handling


app.get("/commerce/get",(req,res)=>{
    res.send( `<html>
        <head>
            <title>My Page</title>
        </head>
        <body>
            <h1>Hello World!</h1>
            <p>This HTML is being sent using res.send().</p>
        </body>
    </html>`)
})


app.listen(PORT,(req,res)=>{
    console.log(`Application is running on PORT ${PORT}`);
})