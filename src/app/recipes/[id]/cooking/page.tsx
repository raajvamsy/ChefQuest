"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { RecipeDetails } from "@/lib/gemini";
import { ArrowLeft, Camera, Check, CheckCircle2, Circle, Loader2, X, Eye, Sparkles, AlertCircle, Lock } from "lucide-react";
import { recipeCache } from "@/lib/cache";
import { geminiAgent } from "@/lib/gemini";

interface RecipeStep {
    step_number: number | string;
    instruction: string;
    type?: "original" | "corrective" | "modified";
    isModified?: boolean;
    originalInstruction?: string;
    modificationReason?: string;
}

interface StepStatus {
    stepNumber: number | string;
    completed: boolean;
    validated?: boolean;
    validationResult?: string;
}

export default function CookingQuestPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
    const [recipeSteps, setRecipeSteps] = useState<RecipeStep[]>([]);
    const [stepStatuses, setStepStatuses] = useState<StepStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [validatingStep, setValidatingStep] = useState<number | string | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [selectedStep, setSelectedStep] = useState<number | string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [adjustmentMessage, setAdjustmentMessage] = useState<string | null>(null);
    const [cookingSessionId, setCookingSessionId] = useState<string | null>(null);

    useEffect(() => {
        const loadRecipe = async () => {
            const cached = recipeCache.getRecipeDetails(id);
            if (cached) {
                setRecipe(cached);
                
                // Initialize recipe steps
                const initialSteps: RecipeStep[] = cached.steps.map((step) => ({
                    step_number: step.step_number,
                    instruction: step.instruction,
                    type: "original",
                }));
                setRecipeSteps(initialSteps);
                
                // Initialize step statuses
                const statuses = cached.steps.map((step) => ({
                    stepNumber: step.step_number,
                    completed: false,
                }));
                setStepStatuses(statuses);
                
                // Create cooking session
                try {
                    const response = await fetch('/api/cooking/session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            recipeId: id,
                            originalSteps: cached.steps,
                        }),
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        setCookingSessionId(data.session.id);
                    }
                } catch (error) {
                    console.error('Failed to create cooking session:', error);
                }
                
                setLoading(false);
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

    const toggleStepCompletion = (stepNumber: number | string) => {
        setStepStatuses((prev) =>
            prev.map((s) =>
                s.stepNumber === stepNumber ? { ...s, completed: !s.completed } : s
            )
        );
    };

    const startCamera = async (stepNumber: number | string) => {
        setSelectedStep(stepNumber);
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
        setSelectedStep(null);
    };

    const validateStep = async () => {
        if (!capturedImage || selectedStep === null || !recipe) return;

        const step = recipeSteps.find((s) => s.step_number === selectedStep);
        if (!step) return;

        setValidatingStep(selectedStep);

        try {
            const validationResult = await geminiAgent.validateTask(
                capturedImage,
                `Step ${selectedStep}: ${step.instruction}`
            );

            // Parse validation result to determine if it passed
            const passed = validationResult.toLowerCase().includes("pass");
            const failed = validationResult.toLowerCase().includes("fail");
            
            // Determine validation status and confidence
            let validationStatus = 'uncertain';
            if (passed) validationStatus = 'pass';
            if (failed) validationStatus = 'fail';
            
            const confidenceMatch = validationResult.match(/Confidence.*?:\s*(High|Medium|Low)/i);
            const confidenceLevel = confidenceMatch ? confidenceMatch[1].toLowerCase() : 'medium';

            setStepStatuses((prev) =>
                prev.map((s) =>
                    s.stepNumber === selectedStep
                        ? {
                              ...s,
                              completed: passed,
                              validated: true,
                              validationResult,
                          }
                        : s
                )
            );

            // Log validation to database
            if (cookingSessionId) {
                try {
                    await fetch('/api/cooking/validation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sessionId: cookingSessionId,
                            recipeId: id,
                            stepNumber: selectedStep,
                            stepInstruction: step.instruction,
                            validationResult,
                            validationStatus,
                            confidenceLevel,
                            imageUrl: null, // Could upload to storage if needed
                        }),
                    });
                } catch (error) {
                    console.error('Failed to log validation:', error);
                }
            }

            // If validation failed, check if task list needs adjustment
            if (failed) {
                await handleTaskAdjustment(step, validationResult);
            }

            closeCamera();
        } catch (error) {
            alert("Failed to validate. Please try again.");
        } finally {
            setValidatingStep(null);
        }
    };

    const handleTaskAdjustment = async (
        failedStep: RecipeStep,
        validationResult: string
    ) => {
        try {
            // Get remaining steps
            const currentIndex = recipeSteps.findIndex(
                (s) => s.step_number === failedStep.step_number
            );
            const remainingSteps = recipeSteps.slice(currentIndex + 1).map((s) => ({
                step_number: typeof s.step_number === 'number' ? s.step_number : parseInt(String(s.step_number)),
                instruction: s.instruction,
            }));

            // Ask AI for adjustments
            const adjustment = await geminiAgent.suggestTaskAdjustments(
                failedStep.instruction,
                validationResult,
                remainingSteps
            );

            if (adjustment.needs_adjustment) {
                setAdjustmentMessage(adjustment.message);

                // Apply corrective steps
                if (adjustment.corrective_steps && adjustment.corrective_steps.length > 0) {
                    const newSteps = [...recipeSteps];
                    const insertIndex = currentIndex + 1;

                    // Insert corrective steps
                    adjustment.corrective_steps.forEach((corrective, idx) => {
                        newSteps.splice(insertIndex + idx, 0, {
                            step_number: corrective.step_number,
                            instruction: corrective.instruction,
                            type: "corrective",
                        });

                        // Add status for corrective step
                        setStepStatuses((prev) => [
                            ...prev.slice(0, insertIndex + idx),
                            {
                                stepNumber: corrective.step_number,
                                completed: false,
                            },
                            ...prev.slice(insertIndex + idx),
                        ]);
                    });

                    setRecipeSteps(newSteps);
                }

                // Apply modified steps
                if (adjustment.modified_steps && adjustment.modified_steps.length > 0) {
                    setRecipeSteps((prev) =>
                        prev.map((step) => {
                            const modification = adjustment.modified_steps?.find(
                                (m) => m.step_number === step.step_number
                            );
                            if (modification) {
                                return {
                                    ...step,
                                    instruction: modification.new_instruction,
                                    isModified: true,
                                    originalInstruction: modification.original_instruction,
                                    modificationReason: modification.reason,
                                    type: "modified",
                                };
                            }
                            return step;
                        })
                    );
                }

                // Auto-dismiss message after 10 seconds
                setTimeout(() => setAdjustmentMessage(null), 10000);
            }
        } catch (error) {
            // Silently fail
        }
    };

    if (loading || !recipe) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-primary" />
            </div>
        );
    }

    const completedSteps = stepStatuses.filter((s) => s.completed).length;
    const totalSteps = stepStatuses.length;
    const progress = (completedSteps / totalSteps) * 100;

    // Mark session as completed when all steps are done
    useEffect(() => {
        if (completedSteps === totalSteps && totalSteps > 0 && cookingSessionId) {
            const markComplete = async () => {
                try {
                    await fetch('/api/cooking/session', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sessionId: cookingSessionId,
                            updates: {
                                session_status: 'completed',
                                completed_at: new Date().toISOString(),
                                current_step: totalSteps,
                                total_steps: totalSteps,
                            },
                        }),
                    });
                } catch (error) {
                    console.error('Failed to mark session complete:', error);
                }
            };
            markComplete();
        }
    }, [completedSteps, totalSteps, cookingSessionId]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted pb-8">
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-border-gray/30 z-50 shadow-sm">
                <div className="max-w-2xl mx-auto px-6 py-4">
                    <div className="flex items-start gap-3 mb-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-full hover:bg-background-muted/50 text-text-dark transition-all flex-shrink-0 mt-0.5"
                        >
                            <ArrowLeft size={20} strokeWidth={2} />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-sm font-semibold text-primary break-words leading-tight">
                                {recipe.title}
                            </h1>
                            <p className="text-xs text-text-medium mt-0.5">
                                {completedSteps} of {totalSteps} steps completed
                            </p>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 bg-background-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Adjustment Message */}
            {adjustmentMessage && (
                <div className="max-w-2xl mx-auto px-6 pt-6">
                    <div className="bg-secondary-orange/10 border border-secondary-orange/30 rounded-2xl p-4 flex gap-3 animate-in fade-in slide-in-from-top duration-300">
                        <AlertCircle size={20} className="text-secondary-orange flex-shrink-0 mt-0.5" strokeWidth={2} />
                        <div className="flex-1">
                            <h4 className="font-semibold text-text-dark mb-1">Recipe Adjusted</h4>
                            <p className="text-sm text-text-medium">{adjustmentMessage}</p>
                        </div>
                        <button
                            onClick={() => setAdjustmentMessage(null)}
                            className="text-text-medium hover:text-text-dark"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Steps Checklist */}
            <div className="max-w-2xl mx-auto px-6 py-6 space-y-3">
                {recipeSteps.map((step, index) => {
                    const status = stepStatuses.find((s) => s.stepNumber === step.step_number);
                    const isCompleted = status?.completed || false;
                    const isValidated = status?.validated || false;
                    const isCorrective = step.type === "corrective";
                    const isModified = step.type === "modified";
                    
                    // Check if previous step is completed
                    const previousStep = index > 0 ? recipeSteps[index - 1] : null;
                    const previousStatus = previousStep 
                        ? stepStatuses.find((s) => s.stepNumber === previousStep.step_number)
                        : null;
                    const isPreviousCompleted = index === 0 || previousStatus?.completed || false;
                    const isLocked = !isPreviousCompleted;

                    return (
                        <div
                            key={step.step_number}
                            className={`bg-white border rounded-2xl p-5 transition-all duration-200 ${
                                isLocked
                                    ? "border-border-gray/30 bg-background-muted/30 opacity-80"
                                    : isCorrective
                                    ? "border-secondary-orange/50 bg-secondary-orange/5"
                                    : isModified
                                    ? "border-info/50 bg-info/5"
                                    : isCompleted
                                    ? "border-primary/50 shadow-sm"
                                    : "border-border-gray/30 hover:border-primary/30"
                            }`}
                        >
                            <div className="flex gap-4">
                                {/* Step Number & Checkbox */}
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                                            isLocked
                                                ? "bg-background-muted text-text-medium/60"
                                                : isCompleted
                                                ? "bg-primary text-white"
                                                : "bg-background-muted text-text-medium"
                                        }`}
                                    >
                                        {step.step_number}
                                    </div>
                                    <button
                                        onClick={() => !isLocked && toggleStepCompletion(step.step_number)}
                                        disabled={isLocked}
                                        className={`transition-transform ${
                                            isLocked 
                                                ? "cursor-not-allowed opacity-60" 
                                                : "hover:scale-110"
                                        }`}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2
                                                size={24}
                                                className="text-primary"
                                                strokeWidth={2}
                                            />
                                        ) : (
                                            <Circle
                                                size={24}
                                                className={isLocked ? "text-text-medium/60" : "text-text-medium"}
                                                strokeWidth={2}
                                            />
                                        )}
                                    </button>
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 space-y-3">
                                    {isCorrective && (
                                        <div className="mb-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary-orange/20 text-secondary-orange text-xs font-semibold rounded-lg">
                                                <AlertCircle size={12} />
                                                Corrective Step
                                            </span>
                                        </div>
                                    )}
                                    {isModified && step.modificationReason && (
                                        <div className="mb-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-info/20 text-info text-xs font-semibold rounded-lg">
                                                <AlertCircle size={12} />
                                                Modified: {step.modificationReason}
                                            </span>
                                        </div>
                                    )}
                                    {isLocked && (
                                        <div className="mb-2">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-text-medium/15 text-text-medium/70 text-xs font-semibold rounded-lg">
                                                <Lock size={12} strokeWidth={2.5} />
                                                Complete previous step to unlock
                                            </span>
                                        </div>
                                    )}
                                    <p
                                        className={`leading-relaxed ${
                                            isLocked
                                                ? "text-text-medium/65"
                                                : isCompleted
                                                ? "text-text-medium line-through"
                                                : "text-text-dark"
                                        }`}
                                    >
                                        {step.instruction}
                                    </p>
                                    {isModified && step.originalInstruction && (
                                        <details className="text-xs text-text-medium">
                                            <summary className="cursor-pointer hover:text-text-dark">
                                                View original instruction
                                            </summary>
                                            <p className="mt-2 pl-3 border-l-2 border-border-gray italic">
                                                {step.originalInstruction}
                                            </p>
                                        </details>
                                    )}

                                    {/* AI Validation Button */}
                                    <button
                                        onClick={() => startCamera(step.step_number)}
                                        disabled={isLocked || (isCompleted && isValidated)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isValidated ? (
                                            <>
                                                <Sparkles size={16} strokeWidth={2} />
                                                <span>AI Validated</span>
                                            </>
                                        ) : (
                                            <>
                                                <Camera size={16} strokeWidth={2} />
                                                <span>{isLocked ? "Locked" : "Validate with AI"}</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Validation Result */}
                                    {status?.validationResult && (
                                        <div className="mt-2 p-3 bg-background-muted rounded-xl text-xs text-text-medium">
                                            <div className="flex items-start gap-2">
                                                <Eye size={14} className="mt-0.5 flex-shrink-0" />
                                                <p className="line-clamp-3">{status.validationResult}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Completion Message */}
            {completedSteps === totalSteps && (
                <div className="max-w-2xl mx-auto px-6 py-4">
                    <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto">
                            <Check size={32} className="text-white" strokeWidth={3} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-primary">Quest Complete!</h3>
                            <p className="text-text-medium mt-1">
                                Congratulations on completing this recipe!
                            </p>
                        </div>
                        <button
                            onClick={() => router.push("/")}
                            className="px-6 py-3 bg-primary text-white rounded-2xl font-semibold hover:bg-primary-dark transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            )}

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
                        <h3 className="text-white font-semibold text-wrap max-w-[200px]">
                            Step {selectedStep} Validation
                        </h3>
                        <div className="w-10" />
                    </div>

                    {/* Camera View / Captured Image */}
                    <div className="flex-1 relative bg-black flex items-center justify-center">
                        {!capturedImage ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="max-w-full max-h-full"
                            />
                        ) : (
                            <img
                                src={capturedImage}
                                alt="Captured"
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
                                    onClick={validateStep}
                                    disabled={validatingStep !== null}
                                    className="px-8 py-3 rounded-2xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {validatingStep !== null ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            <span>Validating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={20} />
                                            <span>Validate</span>
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

