// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import { createRouteHandler } from "uploadthing/express"
import { uploadRouter } from './services/uploadthing.services';
import { clerkMiddleware, } from '@clerk/express'
import cors from 'cors'

dotenv.config();

const app = express();

app.use(express.json());

// CORS Setup
app.use(cors());

// app.options("*", cors()); // handle preflight for all routes

app.use(clerkMiddleware({
   jwtKey: `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxCzly/FHxOGP1KhC1Wk2
   Q6lirAoowU7e1nXPIBGdQUHF8XT/d3N+2z2tu5h5nQygyG1PIS7NEnO5yAaPb4bK
   KgsgRXkhHkekWCs7eo8JKJ44r+vAickyRGvAIcoV5sIMzPhi9JlCQ9jFW+Ff/RB0
   bC+3Xm8s4ScfVNw0vBihix6jAM1K3Vytj4ZeW5pzE7adS3XE15H1N2LHLr8HC6HG
   ejjRrByyOpI6ljkbAa0z5dbhjDOqFNjOroinvAMsJOpqh942clLvv3zR/iEX0Mlj
   tcAAIF3UcuVdCnu2R3artHwwFouCvVgmxHBlXiyeJpmyIkO47UsOp2IsPCtNP/Sf
   1wIDAQAB`,
   signInUrl: 'http://localhost:3000/sign-in',
   signUpUrl: 'http://localhost:3000/sign-up',
   publishableKey: 'pk_test_bm9ybWFsLWdudS0xMS5jbGVyay5hY2NvdW50cy5kZXYk',
   debug: true
}))
// app.use(requireAuth())


app.get("/api", (req, res) => {
   res.send("Hello from Express!");
});


app.use("/api/uploadthing", createRouteHandler({
   router: uploadRouter,
   config: {
      callbackUrl: "https://d32c-197-211-57-19.ngrok-free.app/api/uploadthing",
      token: "eyJhcGlLZXkiOiJza19saXZlXzZhMzAwNDE1ODkyNGJhMmMzYTNhYmVlN2E3ZWJkMWE0YTI1ZjZjNGJiMjk3ZjAyOTkzYWM1NTg0NjI0MzlmMDQiLCJhcHBJZCI6Imt5bHdnZnp1Z2YiLCJyZWdpb25zIjpbInNlYTEiXX0="

   },
}),
);




const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
