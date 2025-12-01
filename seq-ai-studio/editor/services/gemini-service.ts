import { GoogleGenAI } from "@google/genai";

// Helper to check for API Key selection (specific to Veo requirements)
// Access window.aistudio via casting to avoid type conflicts with global declarations
export const checkApiKey = async (): Promise<boolean> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    return await win.aistudio.hasSelectedApiKey();
  }
  return !!process.env.API_KEY;
};

export const selectApiKey = async (): Promise<void> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.openSelectKey) {
    await win.aistudio.openSelectKey();
  }
};

export const generateVideo = async (prompt: string, aspectRatio: string = '16:9'): Promise<string> => {
  // Always instantiate fresh to grab the latest key if it was just selected
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    const startTime = Date.now();
    const TIMEOUT_MS = 60000; // 60 second timeout

    // Polling loop
    while (!operation.done) {
      if (Date.now() - startTime > TIMEOUT_MS) {
        throw new Error("Video generation timed out.");
      }
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!videoUri) {
      throw new Error("No video URI returned from API");
    }

    // Append API key to fetch the actual video binary
    return `${videoUri}&key=${process.env.API_KEY}`;

  } catch (error) {
    console.error("Video generation failed:", error);
    throw error;
  }
};
