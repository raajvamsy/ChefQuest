"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { RecipeDetails } from "@/lib/gemini";
import { ArrowLeft, ChefHat, Loader2, Play, Check, Camera, X } from "lucide-react";
import { recipeCache } from "@/lib/cache";
import { geminiAgent } from "@/lib/gemini";

interface CookingTool {
    id: string;
    name: string;
    category: "cookware" | "utensil" | "appliance" | "other";
    optional?: boolean;
}

const commonTools: CookingTool[] = [
    { id: "knife", name: "Knife", category: "utensil" },
    { id: "cutting-board", name: "Cutting Board", category: "utensil" },
    { id: "pan", name: "Frying Pan", category: "cookware" },
    { id: "pot", name: "Pot", category: "cookware" },
    { id: "spatula", name: "Spatula", category: "utensil" },
    { id: "wooden-spoon", name: "Wooden Spoon", category: "utensil" },
    { id: "whisk", name: "Whisk", category: "utensil" },
    { id: "mixing-bowl", name: "Mixing Bowl", category: "cookware" },
    { id: "measuring-cups", name: "Measuring Cups", category: "utensil" },
    { id: "measuring-spoons", name: "Measuring Spoons", category: "utensil" },
    { id: "strainer", name: "Strainer", category: "utensil" },
    { id: "grater", name: "Grater", category: "utensil" },
    { id: "peeler", name: "Peeler", category: "utensil" },
    { id: "baking-sheet", name: "Baking Sheet", category: "cookware" },
    { id: "oven", name: "Oven", category: "appliance" },
    { id: "stove", name: "Stove", category: "appliance" },
    { id: "blender", name: "Blender", category: "appliance", optional: true },
    { id: "food-processor", name: "Food Processor", category: "appliance", optional: true },
];

export default function PrepareRecipePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [suggestedTools, setSuggestedTools] = useState<string[]>([]);
    const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [identifyingTools, setIdentifyingTools] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const loadRecipe = async () => {
            const cached = recipeCache.getRecipeDetails(id);
            if (cached) {
                setRecipe(cached);
                setLoading(false);
                await analyzeRequiredTools(cached);
            } else {
                router.push(`/recipes/${id}`);
            }
        };

        if (id) {
            loadRecipe();
        }

        // Cleanup camera on unmount
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [id, router, stream]);

    const analyzeRequiredTools = async (recipeDetails: RecipeDetails) => {
        setIsAnalyzing(true);
        try {
            // Extract tools from recipe description and steps
            const text = `${recipeDetails.description} ${recipeDetails.steps.map(s => s.instruction).join(" ")}`.toLowerCase();
            
            const suggested: string[] = [];
            commonTools.forEach(tool => {
                const keywords = tool.name.toLowerCase().split(" ");
                const matches = keywords.some(keyword => text.includes(keyword));
                if (matches) {
                    suggested.push(tool.id);
                }
            });

            // Add basic essentials
            const essentials = ["knife", "cutting-board", "stove"];
            essentials.forEach(essential => {
                if (!suggested.includes(essential)) {
                    suggested.push(essential);
                }
            });

            setSuggestedTools(suggested);
            setSelectedTools(new Set(suggested));
        } catch (error) {
            // Silently fail
        } finally {
            setIsAnalyzing(false);
        }
    };

    const toggleTool = (toolId: string) => {
        const newSelected = new Set(selectedTools);
        if (newSelected.has(toolId)) {
            newSelected.delete(toolId);
        } else {
            newSelected.add(toolId);
        }
        setSelectedTools(newSelected);
    };

    const startCamera = async () => {
        setCameraActive(true);
        setCapturedImage(null);

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            alert("Unable to access camera. Please check permissions.");
            setCameraActive(false);
        }
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0);
                const imageData = canvas.toDataURL("image/jpeg");
                setCapturedImage(imageData);
            }
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
    };

    const closeCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
        setCameraActive(false);
        setCapturedImage(null);
    };

    const identifyTools = async () => {
        if (!capturedImage) return;

        setIdentifyingTools(true);
        try {
            const identifiedTools = await geminiAgent.identifyKitchenTools(capturedImage);
            
            // Add identified tools to selected set
            const newSelected = new Set(selectedTools);
            identifiedTools.forEach(toolId => {
                if (commonTools.find(t => t.id === toolId)) {
                    newSelected.add(toolId);
                }
            });
            setSelectedTools(newSelected);
            
            closeCamera();
        } catch (error) {
            alert("Failed to identify tools. Please try again.");
        } finally {
            setIdentifyingTools(false);
        }
    };

    const handleStartCooking = () => {
        // Store selected tools in session storage
        sessionStorage.setItem(`recipe_${id}_tools`, JSON.stringify(Array.from(selectedTools)));
        router.push(`/recipes/${id}/cooking`);
    };

    if (loading || !recipe) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted flex items-center justify-center">
                <div className="relative flex items-center justify-center w-16 h-16">
                    <Loader2 size={40} className="animate-spin text-primary absolute" strokeWidth={2.5} />
                    <ChefHat size={20} className="text-primary relative z-10" strokeWidth={2} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted pb-24">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-border-gray/30 z-50 shadow-sm">
                <div className="max-w-2xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-full hover:bg-background-muted/50 text-text-dark transition-all flex-shrink-0"
                        >
                            <ArrowLeft size={20} strokeWidth={2} />
                        </button>
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <h1 className="text-base font-semibold text-primary text-wrap">Prepare to Cook</h1>
                            <p className="text-xs text-text-medium text-wrap">{recipe.title}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
                {/* Introduction */}
                <div className="bg-white border border-border-gray/30 rounded-2xl p-6 space-y-3">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <ChefHat size={24} className="text-primary" strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-text-dark mb-2">
                                Let's get prepared!
                            </h2>
                            <p className="text-sm text-text-medium leading-relaxed">
                                Select the cooking tools and utensils you have available. We'll customize the 
                                cooking instructions based on your equipment.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tool Selection */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-text-dark">Your Kitchen Tools</h3>
                        <button
                            onClick={startCamera}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                        >
                            <Camera size={16} strokeWidth={2} />
                            <span>Scan Tools</span>
                        </button>
                    </div>
                    
                    {isAnalyzing && (
                        <div className="flex items-center gap-2 text-xs text-text-medium">
                            <Loader2 size={12} className="animate-spin" />
                            Analyzing recipe...
                        </div>
                    )}

                    {/* Suggested Tools */}
                    {suggestedTools.length > 0 && (
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2">
                            <p className="text-sm font-semibold text-primary flex items-center gap-2">
                                <Check size={16} strokeWidth={2} />
                                Recommended for this recipe
                            </p>
                        </div>
                    )}

                    {/* Tool Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {commonTools.map((tool) => {
                            const isSelected = selectedTools.has(tool.id);
                            const isSuggested = suggestedTools.includes(tool.id);

                            return (
                                <button
                                    key={tool.id}
                                    onClick={() => toggleTool(tool.id)}
                                    className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                                        isSelected
                                            ? "border-primary bg-primary/10 shadow-sm"
                                            : "border-border-gray/30 bg-white hover:border-primary/50"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-text-dark text-sm text-wrap">
                                                {tool.name}
                                            </div>
                                            <div className="text-xs text-text-medium mt-0.5 capitalize">
                                                {tool.category}
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                    isSelected
                                                        ? "border-primary bg-primary"
                                                        : "border-border-gray"
                                                }`}
                                            >
                                                {isSelected && (
                                                    <Check size={12} className="text-white" strokeWidth={3} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {isSuggested && (
                                        <div className="mt-2">
                                            <span className="inline-block px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                                                Recommended
                                            </span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-background-muted border border-border-gray/30 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-medium">Selected tools</p>
                            <p className="text-2xl font-bold text-primary">{selectedTools.size}</p>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <ChefHat size={32} className="text-primary" strokeWidth={2} />
                        </div>
                    </div>
                </div>

                {/* Start Cooking Button */}
                <button
                    onClick={handleStartCooking}
                    disabled={selectedTools.size === 0}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-semibold hover:bg-primary-dark transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <Play size={20} strokeWidth={2.5} fill="white" />
                    <span>Start Cooking Quest</span>
                </button>

                <p className="text-center text-xs text-text-medium">
                    Don't worry! You can always adapt as you go.
                </p>
            </div>

            {/* Camera Modal */}
            {cameraActive && (
                <div className="fixed inset-0 bg-black z-[200] flex flex-col">
                    {/* Camera Header */}
                    <div className="bg-black/50 p-4 flex items-center justify-between">
                        <button
                            onClick={closeCamera}
                            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
                        >
                            <X size={24} />
                        </button>
                        <h3 className="text-white font-semibold">Scan Kitchen Tools</h3>
                        <div className="w-10" />
                    </div>

                    {/* Camera View / Captured Image */}
                    <div className="flex-1 relative bg-black flex items-center justify-center">
                        {!capturedImage ? (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="max-w-full max-h-full"
                                />
                                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                                    <p className="text-white text-sm bg-black/50 px-4 py-2 rounded-full">
                                        Position your kitchen tools in view
                                    </p>
                                </div>
                            </>
                        ) : (
                            <img
                                src={capturedImage}
                                alt="Captured tools"
                                className="max-w-full max-h-full object-contain"
                            />
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {/* Camera Controls */}
                    <div className="bg-black/50 p-6 flex items-center justify-center gap-4">
                        {!capturedImage ? (
                            <button
                                onClick={captureImage}
                                className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
                            >
                                <Camera size={32} className="text-primary" strokeWidth={2} />
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={retakePhoto}
                                    className="px-6 py-3 rounded-2xl bg-white/20 text-white font-semibold hover:bg-white/30 transition-colors"
                                >
                                    Retake
                                </button>
                                <button
                                    onClick={identifyTools}
                                    disabled={identifyingTools}
                                    className="px-8 py-3 rounded-2xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {identifyingTools ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            <span>Identifying...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={20} />
                                            <span>Identify Tools</span>
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

