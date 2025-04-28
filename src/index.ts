// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import { createRouteHandler } from "uploadthing/express"
import { uploadRouter } from './services/uploadthing.services';
import cors from 'cors'

dotenv.config();

const app = express();

// CORS Setup
app.use(cors());

// Manually set Access-Control headers if needed
app.use((req, res, next) => {
   res.header('Access-Control-Allow-Origin', '*'); // or '*'
   res.header('Access-Control-Allow-Credentials', 'true');
   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
   next();
});



app.use(express.json());


app.get("/api", (req, res) => {
   res.send("Hello from Express!");
});


app.use("/api/uploadthing", createRouteHandler({
   router: uploadRouter,
   config: {
      callbackUrl: "https://5d01-197-211-63-125.ngrok-free.app/api/uploadthing",
      token: "eyJhcGlLZXkiOiJza19saXZlXzZhMzAwNDE1ODkyNGJhMmMzYTNhYmVlN2E3ZWJkMWE0YTI1ZjZjNGJiMjk3ZjAyOTkzYWM1NTg0NjI0MzlmMDQiLCJhcHBJZCI6Imt5bHdnZnp1Z2YiLCJyZWdpb25zIjpbInNlYTEiXX0="
   },
}),
);




const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
