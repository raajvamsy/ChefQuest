
import { GoogleGenerativeAI, Part, SchemaType, Schema } from "@google/generative-ai";
import { RECIPE_SEARCH_PROMPT, RECIPE_DETAILS_PROMPT, TASK_VALIDATION_PROMPT, TASK_ADJUSTMENT_PROMPT, KITCHEN_TOOLS_IDENTIFICATION_PROMPT } from "./prompts";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const MODEL_NAME = "gemini-2.5-flash"; // Using 2.5 Flash as the efficient, high-limit model

const recipeSchema: Schema = {
    description: "List of recipes",
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            id: { type: SchemaType.STRING, description: "Unique identifier for the recipe", nullable: false },
            title: { type: SchemaType.STRING, description: "Title of the recipe", nullable: false },
            description: { type: SchemaType.STRING, description: "Short appetizing description", nullable: false },
            time: { type: SchemaType.STRING, description: "Cooking time (e.g., '30 mins')", nullable: false },
            calories: { type: SchemaType.STRING, description: "Calories count (e.g., '450 kcal')", nullable: false },
            image_prompt: { type: SchemaType.STRING, description: "Prompt to generate an image for this dish", nullable: false },
        },
        required: ["id", "title", "description", "time", "calories", "image_prompt"],
    },
};

const recipeDetailsSchema: Schema = {
    description: "Detailed recipe information",
    type: SchemaType.OBJECT,
    properties: {
        title: { type: SchemaType.STRING, description: "Recipe title", nullable: false },
        description: { type: SchemaType.STRING, description: "Detailed description", nullable: false },
        time: { type: SchemaType.STRING, description: "Total cooking time", nullable: false },
        servings: { type: SchemaType.STRING, description: "Number of servings", nullable: false },
        difficulty: { type: SchemaType.STRING, description: "Difficulty level", nullable: false },
        ingredients: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    item: { type: SchemaType.STRING, nullable: false },
                    quantity: { type: SchemaType.STRING, nullable: false },
                },
                required: ["item", "quantity"],
            },
        },
        steps: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    step_number: { type: SchemaType.NUMBER, nullable: false },
                    instruction: { type: SchemaType.STRING, nullable: false },
                },
                required: ["step_number", "instruction"],
            },
        },
        image_prompt: { type: SchemaType.STRING, description: "Image generation prompt", nullable: false },
    },
    required: ["title", "description", "time", "servings", "difficulty", "ingredients", "steps", "image_prompt"],
};

export class GeminiAgent {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        if (!API_KEY) {
        }
        this.genAI = new GoogleGenerativeAI(API_KEY);
        this.model = this.genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
                temperature: 0.4
            },
        });
    }

    /**
     * Generates a recipe based on the user's prompt.
     * @param prompt User's request (e.g., "I have tomatoes and eggs")
     * @returns Generated recipe text
     */
    async generateRecipe(prompt: string): Promise<string> {
        try {
            // For simple text generation, we might want a different model instance or config
            // But for now, let's just use the default model and handle the JSON response if needed
            // Or better, instantiate a separate model for text-only tasks if schema is strict
            const textModel = this.genAI.getGenerativeModel({ model: MODEL_NAME });
            const result = await textModel.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            throw new Error("Failed to generate recipe. Please try again.");
        }
    }

    /**
     * Searches for recipes based on a query.
     * @param query User's search query (e.g., "pasta", "healthy dinner")
     * @param diet Optional dietary preference (e.g., "veg", "non-veg")
     * @param count Number of recipes to return (default: 5)
     * @param language Language code for the response (default: "en")
     * @returns Array of recipe objects
     */
    async searchRecipes(query: string, diet?: string, count: number = 5, language: string = "en"): Promise<Recipe[]> {
        try {
            const prompt = RECIPE_SEARCH_PROMPT(query, diet, count, language);

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return JSON.parse(text) as Recipe[];
        } catch (error) {
            return [];
        }
    }

    /**
     * Gets detailed recipe information.
     * @param id Recipe ID
     * @param title Recipe title
     * @param language Language code for the response (default: "en")
     * @returns Detailed recipe object
     */
    async getRecipeDetails(id: string, title: string, language: string = "en"): Promise<RecipeDetails> {
        try {
            const prompt = RECIPE_DETAILS_PROMPT(title, language);

            const detailsModel = this.genAI.getGenerativeModel({
                model: MODEL_NAME,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: recipeDetailsSchema,
                    temperature: 0.4,
                },
            });

            const result = await detailsModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return { id, ...JSON.parse(text) } as RecipeDetails;
        } catch (error) {
            throw new Error("Failed to fetch recipe details. Please try again.");
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
            const imagePart = this.fileToGenerativePart(imageBase64, "image/jpeg");
            const prompt = TASK_VALIDATION_PROMPT(taskDescription);

            // Use a model without strict schema for this task
            const validationModel = this.genAI.getGenerativeModel({ model: MODEL_NAME });
            const result = await validationModel.generateContent([prompt, imagePart]);
            const response = await result.response;
            return response.text();
        } catch (error) {
            throw new Error("Failed to validate task. Please try again.");
        }
    }

    /**
     * Identifies kitchen tools from an image
     * @param imageBase64 Base64 string of the image
     * @returns Array of identified tool IDs
     */
    async identifyKitchenTools(imageBase64: string): Promise<string[]> {
        try {
            const imagePart = this.fileToGenerativePart(imageBase64, "image/jpeg");
            const prompt = KITCHEN_TOOLS_IDENTIFICATION_PROMPT();

            const toolsModel = this.genAI.getGenerativeModel({ 
                model: MODEL_NAME,
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.3,
                }
            });

            const result = await toolsModel.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            const tools = JSON.parse(text) as string[];
            return tools;
        } catch (error) {
            return [];
        }
    }

    /**
     * Suggests task adjustments based on validation results
     * @param originalStep The step that had issues
     * @param validationResult The validation feedback
     * @param remainingSteps Array of remaining steps
     * @returns Task adjustment suggestions
     */
    async suggestTaskAdjustments(
        originalStep: string,
        validationResult: string,
        remainingSteps: Array<{ step_number: number; instruction: string }>
    ): Promise<TaskAdjustment> {
        try {
            const prompt = TASK_ADJUSTMENT_PROMPT(originalStep, validationResult, remainingSteps);

            const adjustmentModel = this.genAI.getGenerativeModel({ 
                model: MODEL_NAME,
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.3,
                }
            });

            const result = await adjustmentModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return JSON.parse(text) as TaskAdjustment;
        } catch (error) {
            return {
                needs_adjustment: false,
                message: "Continue with the next steps.",
            };
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

export interface Recipe {
    id: string;
    title: string;
    description: string;
    time: string;
    calories: string;
    image_prompt: string;
}

export interface RecipeDetails {
    id: string;
    title: string;
    description: string;
    time: string;
    servings: string;
    difficulty: string;
    ingredients: Array<{ item: string; quantity: string }>;
    steps: Array<{ step_number: number; instruction: string }>;
    image_prompt: string;
}

export interface CorrectiveStep {
    step_number: string;
    instruction: string;
    type: "corrective";
}

export interface ModifiedStep {
    step_number: number;
    original_instruction: string;
    new_instruction: string;
    reason: string;
}

export interface TaskAdjustment {
    needs_adjustment: boolean;
    message: string;
    corrective_steps?: CorrectiveStep[];
    modified_steps?: ModifiedStep[];
}

export const geminiAgent = new GeminiAgent();
