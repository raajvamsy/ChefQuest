"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { RecipeDetails } from "@/lib/gemini";
import { ArrowLeft, ChefHat, Loader2, Play, Check, Camera, X, User, ShoppingCart } from "lucide-react";
import { recipeCache } from "@/lib/cache";
import { geminiAgent } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";

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
    const searchParams = useSearchParams();
    const id = params.id as string;
    const searchQueryId = searchParams.get("sq");

    const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [suggestedTools, setSuggestedTools] = useState<string[]>([]);
    const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [addingToGrocery, setAddingToGrocery] = useState(false);
    const [groceryItemCount, setGroceryItemCount] = useState(0);
    const [cameraActive, setCameraActive] = useState(false);

    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [identifyingTools, setIdentifyingTools] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Restore grocery state from sessionStorage so back-navigation keeps the count
    useEffect(() => {
        if (!id) return;
        const stored = sessionStorage.getItem(`grocery_recipe_${id}`);
        if (stored) setGroceryItemCount(parseInt(stored, 10) || 0);
    }, [id]);

    const getAuthHeaders = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) {
            headers.Authorization = `Bearer ${session.access_token}`;
        }
        return headers;
    };

    useEffect(() => {
        const loadRecipe = async () => {
            const cached = recipeCache.getRecipeDetails(id);
            if (cached) {
                setRecipe(cached);
                setLoading(false);
                await analyzeRequiredTools(cached);
                
                // Log prepare_started interaction
                try {
                    const authHeaders = await getAuthHeaders();
                    await fetch('/api/recipes/interaction', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...authHeaders },
                        body: JSON.stringify({
                            recipeId: id,
                            interactionType: 'prepare_started',
                            source: 'prepare_page',
                            searchQueryId: searchQueryId || null,
                        }),
                    });
                } catch (error) {
                    console.error('Failed to log interaction:', error);
                }
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
            
            // Replace selected tools with ONLY the identified tools (don't keep previously selected)
            const newSelected = new Set<string>();
            identifiedTools.forEach(toolId => {
                if (commonTools.find(t => t.id === toolId)) {
                    newSelected.add(toolId);
                }
            });
            
            // Update selected tools to only include detected items
            setSelectedTools(newSelected);
            
            closeCamera();
        } catch (error) {
            alert("Failed to identify tools. Please try again.");
        } finally {
            setIdentifyingTools(false);
        }
    };

    const handleAddToGrocery = async () => {
        if (!recipe || addingToGrocery) return;
        setAddingToGrocery(true);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch("/api/grocery/lists", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders },
                body: JSON.stringify({
                    recipeKey: id,
                    recipeTitle: recipe.title,
                    ingredients: recipe.ingredients,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.totalAdded > 0) {
                    const newCount = groceryItemCount + data.totalAdded;
                    setGroceryItemCount(newCount);
                    sessionStorage.setItem(`grocery_recipe_${id}`, String(newCount));
                } else {
                    console.error('Grocery add returned 0 items:', data);
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error('Grocery add failed:', res.status, errData);
            }
        } catch {
            // silently fail
        } finally {
            setAddingToGrocery(false);
        }
    };

    const handleStartCooking = () => {
        // Store selected tools in session storage
        sessionStorage.setItem(`recipe_${id}_tools`, JSON.stringify(Array.from(selectedTools)));
        const params = new URLSearchParams();
        if (searchQueryId) params.set("sq", searchQueryId);
        const queryString = params.toString();
        router.push(`/recipes/${id}/cooking${queryString ? `?${queryString}` : ""}`);
    };

    if (loading || !recipe) {
        return (
            <div className="min-h-screen bg-background-muted flex items-center justify-center">
                <div className="relative flex items-center justify-center w-14 h-14">
                    <Loader2 size={36} className="animate-spin text-primary absolute" strokeWidth={2} />
                    <ChefHat size={18} className="text-primary relative z-10" strokeWidth={2} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-muted flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-border-gray/15">
                <div className="w-full px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-background-muted text-text-dark transition-colors shrink-0"
                    >
                        <ArrowLeft size={18} strokeWidth={2} />
                    </button>
                    <button
                        onClick={() => router.push("/home")}
                        className="text-lg font-bold text-primary tracking-tight shrink-0"
                    >
                        ChefQuest
                    </button>
                    <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-text-medium truncate block">{recipe.title}</span>
                    </div>
                    <button
                        onClick={() => router.push("/profile")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-gray/30 text-xs font-semibold text-text-medium hover:text-text-dark hover:border-border-gray/60 transition-colors shrink-0"
                    >
                        <User size={14} strokeWidth={2} />
                        
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-8">
                {/* Introduction */}
                <div className="bg-white border border-border-gray/20 rounded-2xl shadow-sm p-5">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <ChefHat size={20} className="text-primary" strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-base font-bold text-text-dark mb-1">Let&apos;s get prepared!</h2>
                            <p className="text-sm text-text-medium leading-relaxed">
                                Select the cooking tools you have available. We&apos;ll customize the instructions based on your equipment.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tool Selection */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-text-dark">Your Kitchen Tools</h3>
                        <button
                            onClick={startCamera}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                        >
                            <Camera size={13} strokeWidth={2} />
                            <span>Scan Tools</span>
                        </button>
                    </div>

                    {isAnalyzing && (
                        <div className="flex items-center gap-2 text-xs text-text-medium">
                            <Loader2 size={12} className="animate-spin" />
                            Analyzing recipe...
                        </div>
                    )}

                    {suggestedTools.length > 0 && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5">
                            <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                                <Check size={13} strokeWidth={2.5} />
                                Recommended tools pre-selected for this recipe
                            </p>
                        </div>
                    )}

                    {/* Tool Grid — 4 per row on desktop */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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

                {/* Footer: summary + grocery icon + CTA */}
                <div className="bg-white border border-border-gray/20 rounded-2xl shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <p className="text-xs text-text-medium">Selected tools</p>
                            <p className="text-2xl font-bold text-primary">{selectedTools.size}</p>
                            <p className="text-[11px] text-text-medium mt-0.5">You can always adapt as you go.</p>
                        </div>

                        {/* Compact grocery button */}
                        <button
                            onClick={groceryItemCount > 0 ? () => router.push("/grocery") : handleAddToGrocery}
                            disabled={addingToGrocery}
                            title={groceryItemCount > 0 ? "View Grocery List" : "Add to Grocery List"}
                            className={`flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl font-semibold border transition-all active:scale-[0.98] shrink-0 ${
                                groceryItemCount > 0
                                    ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/15"
                                    : "bg-white border-border-gray/30 text-text-dark hover:border-primary/40 hover:text-primary"
                            }`}
                        >
                            {addingToGrocery
                                ? <Loader2 size={15} className="animate-spin" strokeWidth={2} />
                                : groceryItemCount > 0
                                    ? <><ShoppingCart size={15} strokeWidth={2} /><span className="text-sm font-bold">{groceryItemCount}</span></>
                                    : <><ShoppingCart size={15} strokeWidth={2} /><span className="text-sm whitespace-nowrap">Add</span></>
                            }
                        </button>

                        <button
                            onClick={handleStartCooking}
                            disabled={selectedTools.size === 0}
                            className="py-3 px-6 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                        >
                            <Play size={16} strokeWidth={2.5} fill="white" />
                            <span>Start Cooking</span>
                        </button>
                    </div>
                </div>
            </main>

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

