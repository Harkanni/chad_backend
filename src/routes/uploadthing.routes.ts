import express from "express";
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "../uploadthing"; // We'll create this next

const router = express.Router();

router.use("/uploadthing", createRouteHandler({
  router: uploadRouter,
}));

export default router;
