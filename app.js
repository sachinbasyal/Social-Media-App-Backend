import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser"
import cors from "cors";
import helmet from "helmet";  // security package
import morgan from "morgan";
import path from "path";
import {errorHandler, routeNotFound}  from "./src/middleware/error.middleware.js";
import router from "./src/routes/index.js";

// Configurations
const __dirname = path.resolve(path.dirname(""));

const app = express();

app.use(express.static("public"))
app.use(express.static(path.join(__dirname, "/src/views/build")));

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ["GET", "POST", "DELETE", "PUT"],
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(helmet())
app.use(helmet.crossOriginResourcePolicy({policy: "cross-origin"}))
app.use(bodyParser.json({limit: "10mb", extended: true}))
app.use(bodyParser.urlencoded({limit: "10mb", extended: true}))
app.use(cookieParser())

app.use(morgan("dev"))
app.use("/api/v1", router)

// Error middleware
app.use(routeNotFound);
app.use(errorHandler);

export {app}