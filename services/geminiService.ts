
import { GoogleGenAI } from "@google/genai";

let manualApiKey: string | null = null;

/**
 * Set the API key manually from the UI.
 */
export const setManualApiKey = (key: string) => {
  manualApiKey = key;
};

/**
 * Gets the manually set API key if available, otherwise falls back to environment variable.
 */
export const getEffectiveApiKey = () => manualApiKey || process.env.API_KEY;

/**
 * Generate a language-matched response (English or Hindi) 
 * based on the user's input language.
 */
export const generateBilingualResponse = async (
  userName: string, 
  userMessage: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  imageData?: { data: string, mimeType: string }
) => {
  const apiKey = getEffectiveApiKey();
  if (!apiKey) {
    throw new Error("API Key missing: Please enter your key in the login screen.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `
    Your name is 'Sahayak'. You are an expert and deeply knowledgeable personal AI assistant for ${userName}.
    
    STRICT LANGUAGE RULES:
    1. Detect the language of the user's message.
    2. If the user speaks English -> Respond ONLY in English.
    3. If the user speaks Hindi or Hinglish -> Respond ONLY in Hindi.
    4. Provide detailed, helpful, and polite answers.
    
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
    throw error;
  }
};

/**
 * Generate images based on text prompts using the Gemini 2.5 Flash Image model.
 */
export const generateAIImage = async (prompt: string, aspectRatio: string = "1:1", referenceImage?: { data: string, mimeType: string }) => {
  const apiKey = getEffectiveApiKey();
  if (!apiKey) throw new Error("API Key is missing.");
  
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
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};
