// routes/message.ts
import express, { NextFunction, Request, Response, } from "express";
import { db } from "../db/client";
import { pc } from "../services/pinecone";
import { SendMessageValidator } from "../utils/sendMessageValidators";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { PineconeStore } from "@langchain/pinecone";
import { HfInference } from "@huggingface/inference";
import { generatePrompts } from "../utils/constants";
import { z } from "zod";

const router = express.Router();
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Middleware to require auth and attach user ID (adapt as needed)
const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
   // const authUserId = req.header("x-user-id");
   const { userId: authUserId} = req.body
   console.log("MESSAGE MIDDLEWARE DISCOVERED", req.body)

   if (!authUserId) {
      res.status(401).send("UNAUTHORIZED");
      return;
   }

   req.user = { id: authUserId };
   console.log("This is the rq.user: ", req.user)
   next();
};

router.post("/endpoint", async (req, res) => {

})

router.post("/message", requireAuth, async (req, res) => {
   console.log("Message request")
   console.time()
   try {
      const body = SendMessageValidator.parse(req.body);
      const { fileId, message } = body;
      const authUserId = req.user?.id;

      const file = await db.file.findFirst({
         where: {
            id: fileId,
            userAuthId: authUserId,
         },
      });

      if (!file) {
         console.log("File not found")
         res.status(404).send("NOT FOUND");
         throw new Error("File Not Found")
      }


      await db.message.create({
         data: {
            text: message,
            isUserMessage: true,
            userAuthId: authUserId,
            fileId,
         },
      });

      // Vectorize user question
      const embeddings = new HuggingFaceInferenceEmbeddings({
         apiKey: process.env.HUGGINGFACE_API_KEY,
         model: "sentence-transformers/all-mpnet-base-v2",
      });

      const pineconeIndex = pc.Index(process.env.PINECONE_INDEX!);

      const vectorstore = await PineconeStore.fromExistingIndex(embeddings, {
         pineconeIndex,
         namespace: file.id,
         maxConcurrency: 5,
      });

      const results = await vectorstore.similaritySearch(message, 4);

      const prevMessages = await db.message.findMany({
         where: { fileId },
         orderBy: { createdAt: "asc" },
         take: 6,
      });

      const formattedPrevMessages = prevMessages.map((msg) => ({
         role: msg.isUserMessage ? "user" as const : "assistant" as const,
         content: msg.text
      }))

      const response = await hf.textGeneration({
         model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
         inputs: generatePrompts(formattedPrevMessages, results, message),
         parameters: {
            max_new_tokens: 150,
            temperature: 0.7,
            top_p: 0.8,
         },
      });

      const generatedText = response.generated_text;
      const parts = generatedText.split("</think>");
      const answer = parts.length > 1 ? parts[1].trim() : generatedText.trim();

      await db.message.create({
         data: {
            text: answer,
            isUserMessage: false,
            userAuthId: authUserId,
            fileId,
         },
      });

      res.json(response); // ✅ This fixes the type issue
      console.timeEnd()
   } catch (error) {
      console.error("Message endpoint error:", error);
      res.status(500).send("Something went wrong");
      console.timeEnd()
   }
});

export default router;
