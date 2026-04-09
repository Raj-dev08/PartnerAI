import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http"
import cors from "cors"

import { connectDB } from "./lib/db.js";
import { connectSQLDB } from "./lib/sqldb.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { protectRoute } from "./middleware/auth.middleware.js";
import { initSocket } from "./lib/socket.js";

import authRoutes from "./routes/auth.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import chooseAiRoutes from "./routes/chooseai.routes.js";
import experienceRoutes from "./routes/experience.routes.js";
import interestRoutes from "./routes/interest.routes.js";
import convoRoutes from "./routes/convo.routes.js";
import paymentRoutes from "./routes/payment.routes.js"






const app = express()
const server = http.createServer(app)




dotenv.config();

const PORT = process.env.PORT;


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    exposedHeaders: ["Authorization"]
  })
);



app.use("/api/auth", authRoutes);
app.use("/api/ai", protectRoute, aiRoutes);
app.use("/api/chooseai", protectRoute, chooseAiRoutes);
app.use("/api/experience", protectRoute, experienceRoutes);
app.use("/api/interest", protectRoute, interestRoutes);
app.use("/api/convo", protectRoute, convoRoutes);
app.use("/api/payment", protectRoute, paymentRoutes)

app.get("/api/health", (req, res) => {
  return res.status(200).json({ message: "OK" })
})

app.get("/health", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json({ status: "ok" });
});

app.head("/health", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).end();
});


app.use(errorHandler)


server.listen(PORT, "0.0.0.0", async () => {
  console.log("server is running on PORT:" + PORT);
  await initSocket(server);
  await connectDB();
  await connectSQLDB();
});