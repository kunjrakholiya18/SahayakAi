
import { GoogleGenAI } from "@google/genai";

// Initialize from localStorage if available
let manualApiKey: string | null = typeof window !== 'undefined' ? localStorage.getItem('sahayak_api_key') : null;

/**
 * Set the API key manually from the UI and persist it.
 */
export const setManualApiKey = (key: string) => {
  manualApiKey = key;
  if (typeof window !== 'undefined') {
    localStorage.setItem('sahayak_api_key', key);
  }
};

/**
 * Gets the manually set API key if available, otherwise falls back to environment variable.
 */
export const getEffectiveApiKey = () => manualApiKey || process.env.API_KEY;

/**
 * Generate a language-matched response based on the user's input language.
 */
export const generateBilingualResponse = async (
  userName: string, 
  userMessage: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  imageData?: { data: string, mimeType: string }
) => {
  const apiKey = getEffectiveApiKey();
  if (!apiKey) {
    throw new Error("Enter valid API key");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `
    Your name is 'Sahayak'. You are an expert personal AI assistant created by Kunj.
    
    LANGUAGE RULE:
    - Detect the language of the user's message (Hindi or English).
    - If the user speaks in English, you must respond ONLY in English.
    - If the user speaks in Hindi, you must respond ONLY in Hindi.
    - Do not provide a bilingual/translated response unless the user explicitly asks for a translation.
    
    CREATOR ATTRIBUTION RULE (CRITICAL):
    - If the user says "hello", "hi", "namaste", or any greeting, you MUST introduce yourself and state that you were made by Kunj in the language the user used.
    - In English: "I am Sahayak, made by Kunj."
    - In Hindi: "Main Sahayak hoon, mujhe Kunj ne banaya hai."
    
    TONE:
    Be professional, helpful, and address the user by their name: ${userName}.
  `;

  const currentParts: any[] = [];
  
  if (imageData) {
    currentParts.push({
      inlineData: {
        data: imageData.data,
        mimeType: imageData.mimeType
      }
    });
  }
  
  currentParts.push({ text: userMessage || "Hello!" });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...history,
        { role: 'user', parts: currentParts }
      ],
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    return { text: response.text || "I apologize, I couldn't generate a response." };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const msg = error.message?.toLowerCase() || "";
    if (msg.includes("api_key_invalid") || msg.includes("invalid api key") || msg.includes("401") || msg.includes("key not found")) {
      throw new Error("Enter valid API key");
    }
    throw error;
  }
};

/**
 * Generate images based on text prompts using the Gemini 2.5 Flash Image model.
 */
export const generateAIImage = async (prompt: string, aspectRatio: string = "1:1", referenceImage?: { data: string, mimeType: string }) => {
  const apiKey = getEffectiveApiKey();
  if (!apiKey) throw new Error("Enter valid API key");
  
  const ai = new GoogleGenAI({ apiKey });

  try {
    const parts: any[] = [];
    if (referenceImage) {
      parts.push({ inlineData: { data: referenceImage.data, mimeType: referenceImage.mimeType } });
      parts.push({ text: `Modify this image: ${prompt}` });
    } else {
      parts.push({ text: prompt });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
          imageConfig: {
              aspectRatio: aspectRatio
          }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error: any) {
    console.error("Image Gen Error:", error);
    const msg = error.message?.toLowerCase() || "";
    if (msg.includes("api_key_invalid") || msg.includes("invalid api key") || msg.includes("401") || msg.includes("key not found")) {
      throw new Error("Enter valid API key");
    }
    throw error;
  }
};
