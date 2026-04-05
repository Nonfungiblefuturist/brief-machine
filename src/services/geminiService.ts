import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiService = {
  async generateContent(params: {
    model: string;
    contents: any;
    config?: any;
  }): Promise<GenerateContentResponse> {
    try {
      const response = await ai.models.generateContent(params);
      return response;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  },

  async generateContentStream(params: {
    model: string;
    contents: any;
    config?: any;
  }) {
    try {
      const response = await ai.models.generateContentStream(params);
      return response;
    } catch (error) {
      console.error("Gemini API Stream Error:", error);
      throw error;
    }
  },

  async generateImages(params: {
    model: string;
    prompt: string;
    config?: any;
  }) {
    try {
      // For nano banana series models, we use generateContent
      if (params.model.includes("flash-image")) {
        const response = await ai.models.generateContent({
          model: params.model,
          contents: { parts: [{ text: params.prompt }] },
          config: params.config
        });
        return response;
      }
      // For Imagen models
      const response = await ai.models.generateImages(params);
      return response;
    } catch (error) {
      console.error("Gemini Image Generation Error:", error);
      throw error;
    }
  },

  async generateVideos(params: {
    model: string;
    prompt: string;
    config?: any;
    image?: any;
    video?: any;
  }) {
    try {
      const operation = await ai.models.generateVideos(params);
      return operation;
    } catch (error) {
      console.error("Gemini Video Generation Error:", error);
      throw error;
    }
  },

  async getVideosOperation(params: { operation: any }) {
    try {
      const operation = await ai.operations.getVideosOperation(params);
      return operation;
    } catch (error) {
      console.error("Gemini Video Operation Error:", error);
      throw error;
    }
  }
};
