
import { GoogleGenAI } from "@google/genai";
import { Tone } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const humanizeText = async (text: string, tone: Tone, targetLanguage: string = 'English'): Promise<string> => {
  const isTranslationNeeded = targetLanguage !== 'English' && targetLanguage !== 'English (Pakistan)';
  
  const systemInstruction = `
    You are an expert editor and humanizer. Your sole job is to rewrite AI-generated text to sound 100% human, natural, and undetectable by AI detectors.
    
    CRITICAL RULES:
    1. ${isTranslationNeeded ? `Translation: Convert the text to ${targetLanguage} while keeping it natural.` : `Language: Keep the output in ${targetLanguage}.`}
    2. Tone: Use a ${tone} style.
    3. Human Nuance: Incorporate natural flow, varied sentence lengths, and appropriate idioms.
    4. Authenticity: Avoid "AI-isms" like "In conclusion," "Moreover," or overly predictable structures.
    5. Maintain Meaning: Do not change the facts or the core message.
    
    Return ONLY the humanized text. No conversational filler or explanations.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // High quality for transformation
      contents: `Humanize this text in ${targetLanguage} with a ${tone} tone: \n\n${text}`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9,
      },
    });

    return response.text || "I couldn't process that text. Please try again.";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("API call failed. Please check your connection or try a shorter text.");
  }
};

export const fixSpellingAndGrammar = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Fix all grammar and spelling errors while maintaining the exact tone: \n\n${text}`,
    });
    return response.text?.trim() || text;
  } catch (error) {
    throw new Error("Grammar fix failed.");
  }
};

export const extractTextFromImage = async (base64Data: string): Promise<string> => {
  try {
    const data = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: data } },
          { text: "Read and extract all text from this image as plain text. Do not add comments." },
        ],
      },
    });
    return response.text?.trim() || "";
  } catch (error) {
    throw new Error("Could not scan text from camera.");
  }
};
