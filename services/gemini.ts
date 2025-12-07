import { Order } from "../types";

// This service has been deprecated and Gemini API dependency removed.
// The file is kept to avoid import errors if referenced elsewhere, but exports dummy functions.

export const generateBusinessInsights = async (_orders: Order[], _revenue: number) => {
  console.warn("AI Insights feature has been disabled.");
  return {
    summary: "AI feature disabled.",
    tips: []
  };
};