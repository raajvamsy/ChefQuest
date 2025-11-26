import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const MODEL_NAME = "gemini-2.5-flash-lite"; // Using 2.5 Flash as the efficient, high-limit model

export class GeminiAgent {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        if (!API_KEY) {
            console.warn("Gemini API Key is missing. Please set NEXT_PUBLIC_GEMINI_API_KEY in .env.local");
        }
        this.genAI = new GoogleGenerativeAI(API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: MODEL_NAME });
    }

    /**
     * Generates a recipe based on the user's prompt.
     * @param prompt User's request (e.g., "I have tomatoes and eggs")
     * @returns Generated recipe text
     */
    async generateRecipe(prompt: string): Promise<string> {
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Error generating recipe:", error);
            throw new Error("Failed to generate recipe. Please try again.");
        }
    }

    /**
     * Validates if the provided image matches the task description.
     * @param imageBase64 Base64 string of the image
     * @param taskDescription Description of the task (e.g., "Cook a tomato omelet")
     * @returns Validation result text
     */
    async validateTask(imageBase64: string, taskDescription: string): Promise<string> {
        try {
            const imagePart = this.fileToGenerativePart(imageBase64, "image/jpeg"); // Assuming jpeg for simplicity, can be dynamic
            const prompt = `Does this image show the result of the following task: "${taskDescription}"? Please analyze the image and confirm if the dish matches the description.`;

            const result = await this.model.generateContent([prompt, imagePart]);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Error validating task:", error);
            throw new Error("Failed to validate task. Please try again.");
        }
    }

    /**
     * Helper to convert base64 string to GenerativePart
     */
    private fileToGenerativePart(data: string, mimeType: string): Part {
        // Remove data URL prefix if present
        const base64Data = data.replace(/^data:image\/\w+;base64,/, "");

        return {
            inlineData: {
                data: base64Data,
                mimeType,
            },
        };
    }
}

export const geminiAgent = new GeminiAgent();
