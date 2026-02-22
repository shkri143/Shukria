import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface CropAdvice {
  healthStatus: string;
  recommendations: string[];
  pestWarning: string | null;
  irrigationAdvice: string;
}

export async function getCropAdvice(cropName: string, region: string, sensorData: any): Promise<CropAdvice> {
  const prompt = `
    As an expert agronomist specialized in Somali agriculture, provide advice for a ${cropName} farm in the ${region} region.
    Current Sensor Data:
    - Soil Moisture: ${sensorData.soil_moisture}%
    - Temperature: ${sensorData.temperature}°C
    - Humidity: ${sensorData.humidity}%
    
    Consider the local climate of ${region}, Somalia.
    IMPORTANT: Provide all text fields (healthStatus, recommendations, pestWarning, irrigationAdvice) in the Somali language.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          healthStatus: { type: Type.STRING },
          recommendations: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          pestWarning: { type: Type.STRING, nullable: true },
          irrigationAdvice: { type: Type.STRING }
        },
        required: ["healthStatus", "recommendations", "irrigationAdvice"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function getMarketInsights(): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Provide a brief summary of current agricultural market trends and prices for staple crops in Somalia (Maize, Sorghum, Sesame). Format as Markdown. IMPORTANT: The entire response must be in the Somali language.",
  });
  return response.text || "Xogta suuqa lama heli karo hadda.";
}
