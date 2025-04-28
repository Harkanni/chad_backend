// src/controllers/uploadthing.controller.ts
import { Request, Response } from 'express';
import { db } from '../db';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { pc } from '../utils/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';

export const handleUploadComplete = async (req: Request, res: Response) => {
  const { key, name, url, authUserId } = req.body as {
    key: string;
    name: string;
    url: string;
    authUserId: string;
  };

  try {
    const createdFile = await db.file.create({
      data: {
        key,
        name,
        userAuthId: authUserId,
        url,
        uploadStatus: 'PROCESSING',
      },
    });

    const response = await fetch(url);
    const blob = await response.blob();
    const loader = new PDFLoader(blob);
    const pageLevelDocs = await loader.load();

    const pineconeIndex = pc.Index(process.env.PINECONE_INDEX!);

    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACE_API_KEY!,
      model: 'sentence-transformers/all-mpnet-base-v2',
    });

    await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
      pineconeIndex,
      namespace: createdFile.id,
      maxConcurrency: 5,
    });

    await db.file.update({
      data: { uploadStatus: 'SUCCESS' },
      where: { id: createdFile.id },
    });

    return res.status(200).json({ success: true, fileId: createdFile.id });
  } catch (error) {
    console.error('Upload processing failed:', error);

    await db.file.update({
      data: { uploadStatus: 'FAILED' },
      where: { key },
    });

    return res.status(500).json({ success: false, message: 'Processing failed' });
  }
};
