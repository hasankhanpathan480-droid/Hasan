
import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Please add it to your secrets.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeSocialPulse = async (posts: any[]) => {
  try {
    const ai = getAI();

    const prompt = `
      You are a social media analyst for a platform called Hexagram.
      Analyze the following posts and provide a 2-sentence quirky summary of the current "Social Pulse" or trends.
      Keep it futuristic and energetic.
      
      Posts:
      ${posts.map(p => `- ${p.user.handle}: ${p.caption}`).join('\n')}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text || "The hexagonal lattice is shifting...";
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return "The hexagonal lattice is shifting... Gemini is recalibrating the pulse.";
  }
};
