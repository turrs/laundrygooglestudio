import { GoogleGenAI } from "@google/genai";
import { Order, OrderStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBusinessInsights = async (orders: Order[], revenue: number) => {
  try {
    const model = ai.models;
    
    const orderStats = {
      totalOrders: orders.length,
      revenue: revenue,
      byStatus: orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    const prompt = `
      You are an expert business consultant for a laundry business. 
      Analyze the following weekly performance data:
      ${JSON.stringify(orderStats, null, 2)}
      
      Provide a concise response in valid JSON format with the following structure:
      {
        "summary": "A 1-sentence summary of performance.",
        "tips": ["Tip 1", "Tip 2", "Tip 3"]
      }
      Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
    `;

    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      summary: "Unable to generate insights at this time.",
      tips: ["Check your internet connection.", "Ensure API Key is valid.", "Try again later."]
    };
  }
};
