"use client";

import InstallPWA from "@/components/InstallPWA";
import {
  Search,
  Languages,
  Plus,
  X,
  ArrowRight,
  Leaf,
  Timer,
  ChefHat,
  GlassWater,
  User,
  Mic,
  MicOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi (हिंदी)" },
  { code: "ta", name: "Tamil (தமிழ்)" },
  { code: "te", name: "Telugu (తెలుగు)" },
  { code: "mr", name: "Marathi (मराठी)" },
  { code: "bn", name: "Bengali (বাংলা)" },
  { code: "gu", name: "Gujarati (ગુજรાતી)" },
  { code: "kn", name: "Kannada (ಕನ್ನಡ)" },
  { code: "ml", name: "Malayalam (മലയാളം)" },
  { code: "pa", name: "Punjabi (ਪੰਜਾਬੀ)" },
  { code: "es", name: "Spanish (Español)" },
  { code: "fr", name: "French (Français)" },
  { code: "de", name: "German (Deutsch)" },
  { code: "it", name: "Italian (Italiano)" },
  { code: "pt", name: "Portuguese (Português)" },
  { code: "zh", name: "Chinese (中文)" },
  { code: "ja", name: "Japanese (日本語)" },
  { code: "ko", name: "Korean (한국어)" },
  { code: "ar", name: "Arabic (العربية)" },
  { code: "ru", name: "Russian (Русский)" },
];

const CATEGORIES = [
  { id: "vegetarian", label: "Vegetarian", Icon: Leaf, query: "vegetarian recipes" },
  { id: "quick-meals", label: "Quick Meals", Icon: Timer, query: "quick meals under 30 minutes" },
  { id: "baking", label: "Baking", Icon: ChefHat, query: "baking recipes" },
  { id: "smoothies", label: "Smoothies", Icon: GlassWater, query: "smoothie recipes" },
];

const CUISINES = [
  { id: "indian", label: "Indian", query: "Indian recipes" },
  { id: "italian", label: "Italian", query: "Italian recipes" },
  { id: "chinese", label: "Chinese", query: "Chinese recipes" },
  { id: "mexican", label: "Mexican", query: "Mexican recipes" },
  { id: "mediterranean", label: "Mediterranean", query: "Mediterranean recipes" },
  { id: "thai", label: "Thai", query: "Thai recipes" },
  { id: "japanese", label: "Japanese", query: "Japanese recipes" },
  { id: "american", label: "American", query: "American recipes" },
  { id: "middle-eastern", label: "Middle Eastern", query: "Middle Eastern recipes" },
  { id: "korean", label: "Korean", query: "Korean recipes" },
];

export default function AppHome() {
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [showIngredientsSheet, setShowIngredientsSheet] = useState(false);
  const [ingredientInput, setIngredientInput] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);

  const suggestedIngredients = [
    "Onion", "Tomato", "Garlic", "Ginger", "Egg",
    "Potato", "Rice", "Milk", "Cheese", "Spinach",
  ];

  const addIngredient = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const alreadyExists = selectedIngredients.some(
      (item) => item.toLowerCase() === trimmed.toLowerCase(),
    );
    if (alreadyExists) return;
    setSelectedIngredients((prev) => [...prev, trimmed]);
    setIngredientInput("");
  };

  const removeIngredient = (value: string) => {
    setSelectedIngredients((prev) => prev.filter((item) => item !== value));
  };

  const handleUnifiedSearch = (queryOverride?: string, dietOverride?: "veg" | "non-veg") => {
    const trimmedQuery = (queryOverride ?? searchQuery).trim();
    const hasIngredients = selectedIngredients.length > 0;
    if (!trimmedQuery && !hasIngredients) return;

    let query = trimmedQuery;
    let mode = "query_only";

    if (!trimmedQuery && hasIngredients) {
      query = "ingredient based recipes";
      mode = "ingredients_only";
    } else if (trimmedQuery && hasIngredients) {
      mode = "query_with_ingredients";
    }

    const params = new URLSearchParams({
      q: query,
      lang: language,
      mode,
    });
    if (dietOverride) {
      params.set("diet", dietOverride);
    }

    if (hasIngredients) {
      params.set("ingredients", selectedIngredients.join(","));
    }

    setShowIngredientsSheet(false);
    router.push(`/recipes?${params.toString()}`);
  };

  const handleVoiceSearch = useCallback(() => {
    const SpeechRecognition =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) || null;
    if (!SpeechRecognition) return;

    if (isListening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = language === "en" ? "en-US" : language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
      // Auto-search after voice input
      setTimeout(() => handleUnifiedSearch(transcript), 100);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  }, [isListening, language, handleUnifiedSearch]);

  return (
    <div className="min-h-screen flex flex-col">

      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-border-gray/15">
        <div className="w-full px-5 h-14 flex items-center gap-3">

          {/* Logo */}
          <span className="text-lg font-bold text-primary tracking-tight shrink-0">ChefQuest</span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Language selector */}
          <div className="relative hidden sm:flex items-center gap-1">
            <Languages size={14} className="text-text-medium shrink-0" strokeWidth={2} />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none bg-transparent text-sm font-medium text-text-medium hover:text-text-dark pr-4 focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <div className="absolute right-0 pointer-events-none">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" className="text-text-medium">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Profile */}
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-gray/30 text-xs font-semibold text-text-medium hover:text-text-dark hover:border-border-gray/60 transition-colors shrink-0"
          >
            <User size={14} strokeWidth={2} />
            
          </button>

          {/* Install PWA — inline in header */}
          <InstallPWA />
        </div>
      </header>

      {/* Main content — plain background, fully centered */}
      <main className="flex-1 bg-background-muted flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg flex flex-col items-center gap-10 text-center">

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold text-primary leading-tight tracking-tight">
              What are you craving?
            </h1>
            <p className="text-text-medium text-base">
              Discover recipes tailored to your taste and time.
            </p>
          </div>

          {/* Search + ingredients */}
          <div className="w-full space-y-3">
            <div className="flex items-center gap-0 bg-white rounded-2xl border border-border-gray/25 shadow-sm overflow-hidden pl-4">
              <Search size={18} className="text-text-medium shrink-0" strokeWidth={2} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Quick vegetarian pasta..."
                className="flex-1 px-3 py-4 text-sm text-text-dark placeholder:text-text-medium/55 focus:outline-none bg-transparent"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUnifiedSearch();
                }}
              />
              {/* Voice search button */}
              <button
                onClick={handleVoiceSearch}
                title="Search by voice"
                className={`p-3 transition-all duration-150 shrink-0 ${
                  isListening
                    ? "text-primary animate-pulse"
                    : "text-text-medium hover:text-primary"
                }`}
              >
                {isListening ? <MicOff size={18} strokeWidth={2} /> : <Mic size={18} strokeWidth={2} />}
              </button>
              <button
                onClick={() => handleUnifiedSearch()}
                disabled={!searchQuery.trim() && selectedIngredients.length === 0}
                className="m-1.5 p-3 rounded-xl bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-dark active:scale-95 transition-all duration-150 shrink-0"
              >
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setShowIngredientsSheet(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-border-gray/30 text-sm font-medium text-text-dark shadow-sm hover:border-primary/40 hover:text-primary active:scale-95 transition-all duration-150"
              >
                <Plus size={14} strokeWidth={2.5} />
                {selectedIngredients.length > 0
                  ? `${selectedIngredients.length} ingredients`
                  : "By ingredients"}
              </button>
            </div>
          </div>

          {/* Category tiles */}
          <div className="w-full grid grid-cols-4 gap-3">
            {CATEGORIES.map(({ id, label, Icon, query }) => (
              <button
                key={id}
                onClick={() => handleUnifiedSearch(query)}
                className="flex flex-col items-center gap-2.5 py-5 px-2 rounded-2xl bg-white border border-border-gray/20 shadow-sm hover:border-primary/30 hover:shadow-md active:scale-95 transition-all duration-150 group"
              >
                <div className="w-11 h-11 rounded-xl bg-background-muted flex items-center justify-center group-hover:bg-primary/8 transition-colors">
                  <Icon size={22} className="text-text-dark group-hover:text-primary transition-colors" strokeWidth={1.75} />
                </div>
                <span className="text-[10px] font-semibold text-text-medium uppercase tracking-wider leading-tight text-center">
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Cuisine chips */}
          <div className="w-full">
            <p className="text-xs font-semibold text-text-medium uppercase tracking-wider mb-3 text-left">
              Cuisines
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              {CUISINES.map(({ id, label, query }) => (
                <button
                  key={id}
                  onClick={() => handleUnifiedSearch(query)}
                  className="shrink-0 px-4 py-2 rounded-full bg-white border border-border-gray/25 text-xs font-semibold text-text-dark hover:border-primary/40 hover:text-primary hover:shadow-sm active:scale-95 transition-all duration-150 shadow-sm"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Ingredients Bottom Sheet */}
      {showIngredientsSheet && (
        <div
          className="fixed inset-0 z-[120] bg-black/35 backdrop-blur-[1px]"
          onClick={() => setShowIngredientsSheet(false)}
        >
          <div
            className="absolute inset-x-0 bottom-6 max-w-md mx-auto bg-white rounded-3xl border border-border-gray/20 shadow-2xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-primary">Add Ingredients</h2>
                <p className="text-xs text-text-medium mt-0.5">
                  Use ingredients only, or combine with the search above.
                </p>
              </div>
              <button
                onClick={() => setShowIngredientsSheet(false)}
                className="w-9 h-9 rounded-full border border-border-gray/30 text-text-medium hover:text-text-dark hover:border-border-gray/60 transition-colors flex items-center justify-center"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-border-gray/30 bg-background-muted/35 p-3">
              <p className="text-sm font-medium text-text-dark">
                Selected ingredients:{" "}
                <span className="text-primary">{selectedIngredients.length}</span>
              </p>
              <p className="text-xs text-text-medium mt-1">
                {searchQuery.trim()
                  ? `Search will use "${searchQuery.trim()}" + selected ingredients.`
                  : "No dish term entered. Search will use ingredients only."}
              </p>
            </div>

            <div className="mt-5 space-y-5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  placeholder="Add ingredient (e.g., tomato)"
                  className="flex-1 px-4 py-3 rounded-xl border border-border-gray/30 text-sm text-text-dark placeholder:text-text-medium/60 focus:outline-none focus:border-primary/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addIngredient(ingredientInput);
                  }}
                />
                <button
                  onClick={() => addIngredient(ingredientInput)}
                  className="px-4 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-95 active:scale-95 transition-all"
                >
                  Add
                </button>
              </div>

              {selectedIngredients.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-text-medium uppercase tracking-wide">
                      Selected ({selectedIngredients.length})
                    </p>
                    <button
                      onClick={() => setSelectedIngredients([])}
                      className="text-xs font-medium text-text-medium hover:text-text-dark"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedIngredients.map((item) => (
                      <button
                        key={item}
                        onClick={() => removeIngredient(item)}
                        className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 hover:bg-primary/15 transition-colors"
                      >
                        {item} ×
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-medium text-text-medium uppercase tracking-wide">
                  Popular ingredients
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedIngredients.map((item) => (
                    <button
                      key={item}
                      onClick={() => addIngredient(item)}
                      className="px-3 py-1.5 rounded-full bg-white border border-border-gray/30 text-xs font-medium text-text-dark hover:border-primary hover:text-primary transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
