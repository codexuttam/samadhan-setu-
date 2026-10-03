import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
// Allow parsing base64 audio payloads up to 10MB
app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client utility
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// AI endpoints
// 1. General multi-turn support Chatbot
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: messages,
      config: {
        systemInstruction: "You are the official Samadhan Setu Citizen Support AI Assistant. Your role is to help citizens of Amravati, Maharashtra navigate the platform, understand how to report complaints, find civic department contacts, and guide them in writing robust reports. Be extremely polite, professional, concise, and clear. Keep response size concise.",
      }
    });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Error communicating with Gemini' });
  }
});

// 2. Audio transcription for voice-to-text complaint description filling
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioData } = req.body; // base64 encoded audio string from microphone
    if (!audioData) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    const audioPart = {
      inlineData: {
        mimeType: "audio/webm",
        data: audioData,
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: [audioPart, { text: "Transcribe this audio precisely into English or Marathi or Hindi text as spoken. Do not add any preamble, conversational greeting, or explanations, just return the exact transcribed text of what the citizen said." }],
    });

    res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: error.message || 'Error transcribing audio payload' });
  }
});

// 3. Google Maps Grounding assistant
app.post('/api/maps-grounding', async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        systemInstruction: "You are the Samadhan Setu Location & Civic Grounding assistant. Use the Google Maps tool to look up real places, landmarks, streets, and government offices in Amravati, Maharashtra, India. Provide accurate details grounded in Google Maps data.",
      }
    });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Maps Grounding error:', error);
    res.status(500).json({ error: error.message || 'Error resolving grounding query' });
  }
});

// Vite Middleware mounting for unified fullstack environment on Port 3000
const isProd = process.env.NODE_ENV === 'production';
if (!isProd) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve('dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('dist/index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
