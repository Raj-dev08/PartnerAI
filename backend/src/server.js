import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http"

import { connectDB } from "./lib/db.js";
import { errorHandler } from "./middleware/error.middleware.js";

import authRoutes from "./routes/auth.routes.js";



const app = express()
const server = http.createServer(app)




dotenv.config();

const PORT = process.env.PORT;


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());


app.use("/api/auth", authRoutes);


app.use(errorHandler)


server.listen(PORT, "0.0.0.0", () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});