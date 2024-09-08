import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"
import {foodRouter} from "./routes/food.routes.js"
import userRouter from "./routes/User.routes.js";
const app=express();
app.use(cors({
    origin: process.env.CORS_Origin,
    credentials: true,
  }))
app.use(express.json({limit: "500kb"}));
app.use(express.urlencoded({extended:true,limit:"500kb"}))
app.use(express.static("public"));  
app.use(cookieParser())
app.use("/api/v1/food",foodRouter)
app.use("/api/v1/user",userRouter)
import orderRouter from "./routes/order.routes.js";
app.use("/api/v1/order",orderRouter)
export default app;

