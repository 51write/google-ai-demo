import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateHairstyle(base64Image: string, mimeType: string, hairstylePrompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: `Edit this portrait photo. Change the person's hairstyle to: ${hairstylePrompt}. 
          CRITICAL INSTRUCTION: Keep the person's face, facial features, skin tone, expression, and the background EXACTLY the same. 
          ONLY change the hair. Ensure the new hair blends naturally with the head and lighting. Make it highly realistic, like a salon photograph.`,
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}

export async function adjustToFrontFacing(base64Image: string, mimeType: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: `Edit this portrait photo. Adjust the person's pose and head angle so they are facing directly forward (frontal view) looking straight at the camera. 
          CRITICAL INSTRUCTION: You MUST preserve the person's exact identity, facial features, skin tone, and expression. 
          The background, lighting, and clothing MUST seamlessly match the original photo. Make it highly realistic.`,
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}

