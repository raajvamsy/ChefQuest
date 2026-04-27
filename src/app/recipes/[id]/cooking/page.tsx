"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { RecipeDetails, TaskAdjustment } from "@/lib/gemini";
import { ArrowLeft, Camera, Check, CheckCircle2, Circle, Loader2, X, Eye, Sparkles, AlertCircle, Lock, Play, Pause, RotateCcw, Bell, BellOff, User } from "lucide-react";
import { recipeCache } from "@/lib/cache";
import { geminiAgent } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";

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

interface PersistedTimerState {
    activeTimerStep: number | string | null;
    timerInitialSeconds: number;
    timerRemainingSeconds: number;
    timerRunning: boolean;
    savedAt: number;
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
    const [activeTimerStep, setActiveTimerStep] = useState<number | string | null>(null);
    const [timerInitialSeconds, setTimerInitialSeconds] = useState(0);
    const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerAlertMessage, setTimerAlertMessage] = useState<string | null>(null);
    const [timerFinishedStep, setTimerFinishedStep] = useState<number | string | null>(null);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
    const [notificationHint, setNotificationHint] = useState<string | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isCancellingQuest, setIsCancellingQuest] = useState(false);
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const activeTimerStepRef = useRef<number | string | null>(null);
    const timerStorageKey = `chefquest_cooking_timer_${id}`;

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
                    const authHeaders = await getAuthHeaders();
                    const response = await fetch('/api/cooking/session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...authHeaders },
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
            stopTimer();
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [id, router, stream]);

    useEffect(() => {
        activeTimerStepRef.current = activeTimerStep;
    }, [activeTimerStep]);

    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!id) return;

        const raw = localStorage.getItem(timerStorageKey);
        if (!raw) return;

        try {
            const saved = JSON.parse(raw) as PersistedTimerState;
            if (!saved.activeTimerStep || saved.timerRemainingSeconds <= 0) {
                clearPersistedTimer();
                return;
            }

            const elapsedSeconds = Math.max(
                0,
                Math.floor((Date.now() - (saved.savedAt || Date.now())) / 1000)
            );
            const restoredRemaining = saved.timerRunning
                ? Math.max(saved.timerRemainingSeconds - elapsedSeconds, 0)
                : saved.timerRemainingSeconds;

            setActiveTimerStep(saved.activeTimerStep);
            setTimerInitialSeconds(saved.timerInitialSeconds || restoredRemaining);
            setTimerRemainingSeconds(restoredRemaining);
            setTimerRunning(saved.timerRunning && restoredRemaining > 0);

            if (saved.timerRunning && restoredRemaining === 0) {
                triggerTimerDoneAlert(saved.activeTimerStep);
                clearPersistedTimer();
            }
        } catch {
            clearPersistedTimer();
        }
    }, [id, timerStorageKey]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        if (activeTimerStep === null || timerRemainingSeconds <= 0) {
            clearPersistedTimer();
            return;
        }

        const payload: PersistedTimerState = {
            activeTimerStep,
            timerInitialSeconds,
            timerRemainingSeconds,
            timerRunning,
            savedAt: Date.now(),
        };
        localStorage.setItem(timerStorageKey, JSON.stringify(payload));
    }, [
        activeTimerStep,
        timerInitialSeconds,
        timerRemainingSeconds,
        timerRunning,
        timerStorageKey,
    ]);

    useEffect(() => {
        if (!timerRunning) return;

        timerIntervalRef.current = setInterval(() => {
            setTimerRemainingSeconds((prev) => {
                if (prev <= 1) {
                    if (timerIntervalRef.current) {
                        clearInterval(timerIntervalRef.current);
                        timerIntervalRef.current = null;
                    }
                    setTimerRunning(false);
                    setActiveTimerStep(null);
                    setTimerInitialSeconds(0);
                    triggerTimerDoneAlert(activeTimerStepRef.current);
                    clearPersistedTimer();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, [timerRunning]);

    const toggleStepCompletion = (stepNumber: number | string) => {
        const targetStatus = stepStatuses.find((s) => s.stepNumber === stepNumber);
        const willBeCompleted = !targetStatus?.completed;

        if (willBeCompleted && activeTimerStep === stepNumber) {
            stopTimer();
            setActiveTimerStep(null);
            setTimerInitialSeconds(0);
            setTimerRemainingSeconds(0);
            setTimerFinishedStep(null);
            clearPersistedTimer();
        }

        setStepStatuses((prev) =>
            prev.map((s) =>
                s.stepNumber === stepNumber ? { ...s, completed: !s.completed } : s
            )
        );
    };

    const markStepCompleted = (stepNumber: number | string) => {
        if (activeTimerStep === stepNumber) {
            stopTimer();
            setActiveTimerStep(null);
            setTimerInitialSeconds(0);
            setTimerRemainingSeconds(0);
            setTimerFinishedStep(null);
            clearPersistedTimer();
        }

        setStepStatuses((prev) =>
            prev.map((s) =>
                s.stepNumber === stepNumber ? { ...s, completed: true } : s
            )
        );
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const inferStepTimerSeconds = (instruction: string) => {
        const rangeMatch = instruction.match(/(\d+)\s*-\s*(\d+)\s*(minutes?|mins?|min|seconds?|secs?|sec)/i);
        if (rangeMatch) {
            const minVal = parseInt(rangeMatch[1], 10);
            const maxVal = parseInt(rangeMatch[2], 10);
            const avg = Math.round((minVal + maxVal) / 2);
            const unit = rangeMatch[3].toLowerCase();
            return unit.startsWith("sec") ? avg : avg * 60;
        }

        const singleMatch = instruction.match(/(\d+)\s*(minutes?|mins?|min|seconds?|secs?|sec)/i);
        if (singleMatch) {
            const value = parseInt(singleMatch[1], 10);
            const unit = singleMatch[2].toLowerCase();
            return unit.startsWith("sec") ? value : value * 60;
        }

        return 5 * 60;
    };

    const stopTimer = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        setTimerRunning(false);
    };

    const triggerTimerDoneAlert = (stepNumber: number | string | null) => {
        if (!stepNumber) return;
        setTimerFinishedStep(stepNumber);
        setTimerAlertMessage(`Step ${stepNumber} timer is complete. Ready for the next action.`);
        playTimerDoneCue();
        void showSystemNotification(
            "ChefQuest Timer Complete",
            `Step ${stepNumber} is done. Check your cooking quest.`,
            `chefquest-step-${stepNumber}`
        );
    };

    const playTimerDoneCue = () => {
        if (typeof window === "undefined") return;
        try {
            if ("vibrate" in navigator) {
                navigator.vibrate([160, 80, 160]);
            }
            const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.type = "sine";
            oscillator.frequency.value = 880;
            gain.gain.value = 0.02;
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.18);
        } catch {
            // Non-blocking fallback: in-app alert banner remains visible.
        }
    };

    const showSystemNotification = async (title: string, body: string, tag: string) => {
        if (typeof window === "undefined" || !("Notification" in window)) return;

        let permission = Notification.permission;
        if (permission === "default") {
            permission = await Notification.requestPermission();
            setNotificationPermission(permission);
        }
        if (permission !== "granted") return;

        const options: NotificationOptions = {
            body,
            tag,
            requireInteraction: true,
            icon: "/icon-192x192.png",
            badge: "/icon-192x192.png",
        };

        let delivered = false;
        try {
            if ("serviceWorker" in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    await registration.showNotification(title, options);
                    delivered = true;
                }
            }
            // Try direct Web Notification as an additional path.
            new Notification(title, options);
            delivered = true;
        } catch {
            // In-app alert banner is already shown as fallback.
        }

        if (!delivered) {
            setNotificationHint(
                "System notification could not be displayed. Check OS/browser notification settings."
            );
        }
    };

    const clearPersistedTimer = () => {
        if (typeof window === "undefined") return;
        localStorage.removeItem(timerStorageKey);
    };

    const startStepTimer = (stepNumber: number | string, instruction: string) => {
        const replacingAnotherStep =
            activeTimerStep !== null && activeTimerStep !== stepNumber && timerRunning;

        if (replacingAnotherStep) {
            const confirmed = window.confirm(
                `A timer is running for Step ${activeTimerStep}. Start Step ${stepNumber} timer instead?`
            );
            if (!confirmed) return;
        }

        const isSameStepPaused = activeTimerStep === stepNumber && timerRemainingSeconds > 0 && !timerRunning;
        const initial = isSameStepPaused ? timerRemainingSeconds : inferStepTimerSeconds(instruction);

        stopTimer();
        setActiveTimerStep(stepNumber);
        setTimerInitialSeconds(initial);
        setTimerRemainingSeconds(initial);
        setTimerRunning(true);
        setTimerAlertMessage(null);
        setTimerFinishedStep(null);

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
            void requestNotificationAccess();
        }
    };

    const resetStepTimer = () => {
        stopTimer();
        setTimerRemainingSeconds(timerInitialSeconds);
    };

    const requestNotificationAccess = async () => {
        if (typeof window === "undefined" || !("Notification" in window)) return;
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission !== "granted") {
            setNotificationHint("Notifications are blocked. You can still use in-app timer alerts.");
        } else {
            setNotificationHint(null);
        }
    };


    const confirmCancelQuest = async () => {
        setIsCancellingQuest(true);
        stopTimer();
        clearPersistedTimer();
        closeCamera();
        setTimerAlertMessage(null);

        if (cookingSessionId) {
            try {
                const authHeaders = await getAuthHeaders();
                await fetch('/api/cooking/session', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', ...authHeaders },
                    body: JSON.stringify({
                        sessionId: cookingSessionId,
                        updates: {
                            session_status: 'cancelled',
                        },
                    }),
                });
            } catch {
                // Non-blocking
            }
        }

        setShowCancelDialog(false);
        setIsCancellingQuest(false);
        router.push(`/recipes/${id}`);
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
                    const authHeaders = await getAuthHeaders();
                    await fetch('/api/cooking/validation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...authHeaders },
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

            // Ask server-side text router (Groq primary, Gemini fallback) for adjustments
            const adjustmentResponse = await fetch('/api/cooking/adjustments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalStep: failedStep.instruction,
                    validationResult,
                    remainingSteps,
                }),
            });
            const adjustmentData = await adjustmentResponse.json();
            if (!adjustmentResponse.ok || !adjustmentData.adjustment) {
                throw new Error(adjustmentData.message || 'Failed to get task adjustments');
            }
            const adjustment: TaskAdjustment = adjustmentData.adjustment;

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

    const completedSteps = stepStatuses.filter((s) => s.completed).length;
    const totalSteps = stepStatuses.length;
    const progress = (completedSteps / totalSteps) * 100;

    // Mark session as completed when all steps are done
    useEffect(() => {
        if (completedSteps === totalSteps && totalSteps > 0 && cookingSessionId) {
            const markComplete = async () => {
                try {
                    const authHeaders = await getAuthHeaders();
                    await fetch('/api/cooking/session', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', ...authHeaders },
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

    if (loading || !recipe) {
        return (
            <div className="min-h-screen bg-background-muted flex items-center justify-center">
                <div className="relative flex items-center justify-center w-14 h-14">
                    <Loader2 size={36} className="animate-spin text-primary absolute" strokeWidth={2} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-muted flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-border-gray/15">
                {/* Row 1: nav */}
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
                        onClick={requestNotificationAccess}
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-background-muted transition-colors shrink-0"
                        title={notificationPermission === "granted" ? "Alerts On" : "Enable Alerts"}
                    >
                        {notificationPermission === "granted"
                            ? <Bell size={15} className="text-primary" strokeWidth={2} />
                            : <BellOff size={15} className="text-text-medium" strokeWidth={2} />
                        }
                    </button>
                    <button
                        onClick={() => router.push("/profile")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-gray/30 text-xs font-semibold text-text-medium hover:text-text-dark hover:border-border-gray/60 transition-colors shrink-0"
                    >
                        <User size={14} strokeWidth={2} />
                        <span className="hidden sm:inline">Profile</span>
                    </button>
                </div>

                {/* Row 2: progress */}
                <div className="px-4 pb-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-text-medium">
                            {completedSteps} of {totalSteps} steps completed
                        </span>
                        <button
                            onClick={() => setShowCancelDialog(true)}
                            className="text-xs font-semibold text-text-medium hover:text-error transition-colors"
                        >
                            Cancel Quest
                        </button>
                    </div>
                    <div className="h-1.5 bg-background-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {notificationHint && (
                        <p className="text-[11px] text-text-medium">{notificationHint}</p>
                    )}
                </div>

                {/* Row 3: active timer pill (conditional) */}
                {activeTimerStep !== null && timerRemainingSeconds > 0 && (
                    <div className="px-4 pb-3">
                        <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-primary">Step {activeTimerStep}</span>
                                <span className="text-sm font-bold text-primary tabular-nums">{formatDuration(timerRemainingSeconds)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {timerRunning ? (
                                    <button
                                        onClick={stopTimer}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-border-gray/30 text-xs font-semibold text-text-dark"
                                    >
                                        <Pause size={12} />
                                        Pause
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setTimerRunning(true)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-white text-xs font-semibold"
                                    >
                                        <Play size={12} />
                                        Resume
                                    </button>
                                )}
                                <button
                                    onClick={resetStepTimer}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-border-gray/30 text-xs font-semibold text-text-dark"
                                >
                                    <RotateCcw size={12} />
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Adjustment Message */}
            {adjustmentMessage && (
                <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5">
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

            {/* Timer Completion Alert */}
            {timerAlertMessage && (
                <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5">
                    <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 flex items-center justify-between gap-3">
                        <p className="text-sm text-text-dark">{timerAlertMessage}</p>
                        <div className="flex items-center gap-3">
                            {timerFinishedStep !== null && (
                                <button
                                    onClick={() => {
                                        markStepCompleted(timerFinishedStep);
                                        setTimerAlertMessage(null);
                                    }}
                                    className="text-xs font-semibold text-primary hover:underline"
                                >
                                    Mark step complete
                                </button>
                            )}
                            <button
                                onClick={() => setTimerAlertMessage(null)}
                                className="text-text-medium hover:text-text-dark"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Steps Checklist */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

                                    {/* Timer Trigger */}
                                    {!isLocked && !isCompleted && (
                                        <div className="flex items-center justify-between">
                                            <button
                                                onClick={() => startStepTimer(step.step_number, step.instruction)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-muted text-text-dark text-xs font-semibold hover:bg-border-gray/30 transition-colors"
                                            >
                                                <Play size={12} />
                                                {activeTimerStep === step.step_number
                                                    ? timerRunning
                                                        ? "Timer running"
                                                        : "Resume timer"
                                                    : `Start ${formatDuration(inferStepTimerSeconds(step.instruction))} timer`}
                                            </button>
                                        </div>
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
            </div>

            {/* Completion Message */}
            {completedSteps === totalSteps && (
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
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
                            onClick={() => router.push("/home")}
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

            {/* Cancel Quest Dialog */}
            {showCancelDialog && (
                <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-[1px] flex items-center justify-center px-6">
                    <div className="w-full max-w-sm bg-white rounded-2xl border border-border-gray/30 p-5 space-y-4 shadow-2xl">
                        <div className="space-y-2">
                            <h3 className="text-base font-semibold text-text-dark">Cancel Cooking Quest?</h3>
                            <p className="text-sm text-text-medium leading-relaxed">
                                This will stop your active timer and discard in-progress cooking setup for this recipe.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => setShowCancelDialog(false)}
                                disabled={isCancellingQuest}
                                className="px-3 py-2 rounded-lg text-sm font-medium text-text-medium hover:text-text-dark disabled:opacity-50"
                            >
                                Keep Quest
                            </button>
                            <button
                                onClick={confirmCancelQuest}
                                disabled={isCancellingQuest}
                                className="px-3 py-2 rounded-lg bg-error text-white text-sm font-semibold hover:opacity-95 disabled:opacity-50 inline-flex items-center gap-2"
                            >
                                {isCancellingQuest ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Cancelling...
                                    </>
                                ) : (
                                    "Cancel Quest"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

