import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import { app } from "./app.js";

dotenv.config({path:"./.env"})

/* CONNECT TO DB */
connectDB()
.then(()=>{
  app.listen(process.env.PORT || 5001, ()=>{
    console.log(`Server is listening at port: ${process.env.port}`);
  })
})
.catch((error)=>{
  console.log('MongoDB FAILED!!! ', error);
}); // connnect to MongoDB 