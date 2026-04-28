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
  SlidersHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef } from "react";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi (हिंदी)" },
  { code: "ta", name: "Tamil (தமிழ்)" },
  { code: "te", name: "Telugu (తెలుగు)" },
  { code: "mr", name: "Marathi (मराठी)" },
  { code: "bn", name: "Bengali (বাংলা)" },
  { code: "gu", name: "Gujarati (ગુજરાતી)" },
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
  { id: "indian", label: "Indian" },
  { id: "italian", label: "Italian" },
  { id: "chinese", label: "Chinese" },
  { id: "mexican", label: "Mexican" },
  { id: "mediterranean", label: "Mediterranean" },
  { id: "thai", label: "Thai" },
  { id: "japanese", label: "Japanese" },
  { id: "american", label: "American" },
  { id: "middle-eastern", label: "Middle Eastern" },
  { id: "korean", label: "Korean" },
];

const SUGGESTED_INGREDIENTS = [
  "Onion", "Tomato", "Garlic", "Ginger", "Egg",
  "Potato", "Rice", "Milk", "Cheese", "Spinach",
];

export default function AppHome() {
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [ingredientInput, setIngredientInput] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addIngredient = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (selectedIngredients.some((i) => i.toLowerCase() === trimmed.toLowerCase())) return;
    setSelectedIngredients((prev) => [...prev, trimmed]);
    setIngredientInput("");
  };

  const removeIngredient = (value: string) => {
    setSelectedIngredients((prev) => prev.filter((i) => i !== value));
  };

  const toggleCuisine = (label: string) => {
    setSelectedCuisine((prev) => (prev === label ? null : label));
  };

  // Build search label for the filter button
  const filterLabel = (() => {
    const parts: string[] = [];
    if (selectedCuisine) parts.push(selectedCuisine);
    if (selectedIngredients.length > 0) parts.push(`${selectedIngredients.length} ingredient${selectedIngredients.length > 1 ? "s" : ""}`);
    return parts.length > 0 ? parts.join(" · ") : null;
  })();

  const hasFilters = !!(selectedCuisine || selectedIngredients.length > 0);

  const handleUnifiedSearch = useCallback(
    (queryOverride?: string, dietOverride?: "veg" | "non-veg") => {
      const trimmedQuery = (queryOverride ?? searchQuery).trim();
      const hasIngredients = selectedIngredients.length > 0;
      const cuisine = selectedCuisine;
      if (!trimmedQuery && !hasIngredients && !cuisine) return;

      // Build the effective query incorporating cuisine
      let query = trimmedQuery;
      let mode = "query_only";

      if (cuisine && trimmedQuery) {
        query = `${cuisine} ${trimmedQuery}`;
      } else if (cuisine && !trimmedQuery && !hasIngredients) {
        query = `${cuisine} recipes`;
      } else if (!trimmedQuery && hasIngredients) {
        query = cuisine ? `${cuisine} ingredient based recipes` : "ingredient based recipes";
        mode = "ingredients_only";
      }

      if (trimmedQuery && hasIngredients) {
        mode = "query_with_ingredients";
      }

      const params = new URLSearchParams({ q: query, lang: language, mode });
      if (dietOverride) params.set("diet", dietOverride);
      if (hasIngredients) params.set("ingredients", selectedIngredients.join(","));

      setShowFiltersSheet(false);
      router.push(`/recipes?${params.toString()}`);
    },
    [searchQuery, selectedIngredients, selectedCuisine, language, router]
  );

  const handleVoiceSearch = useCallback(() => {
    const SpeechRecognition =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SpeechRecognition || isListening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = language === "en" ? "en-US" : language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setSearchQuery("");
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript: string = event.results[0][0].transcript;
      setIsListening(false);

      // Clear any previous typing animation
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);

      // Typing animation — reveal transcript character by character
      let i = 0;
      setSearchQuery("");
      typingTimerRef.current = setInterval(() => {
        i++;
        setSearchQuery(transcript.slice(0, i));
        if (i >= transcript.length) {
          clearInterval(typingTimerRef.current!);
          typingTimerRef.current = null;
          // Focus the input so user can edit
          const input = document.querySelector<HTMLInputElement>('input[data-voice-input]');
          input?.focus();
        }
      }, 35);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  }, [isListening, language]);

  const isSearchable = !!(searchQuery.trim() || selectedIngredients.length > 0 || selectedCuisine);

  return (
    <div className="min-h-screen flex flex-col">

      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-border-gray/15">
        <div className="w-full px-5 h-14 flex items-center gap-3">
          <span className="text-lg font-bold text-primary tracking-tight shrink-0">ChefQuest</span>
          <div className="flex-1" />

          <div className="relative hidden sm:flex items-center gap-1">
            <Languages size={14} className="text-text-medium shrink-0" strokeWidth={2} />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none bg-transparent text-sm font-medium text-text-medium hover:text-text-dark pr-4 focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
            <div className="absolute right-0 pointer-events-none">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" className="text-text-medium">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-gray/30 text-xs font-semibold text-text-medium hover:text-text-dark hover:border-border-gray/60 transition-colors shrink-0"
          >
            <User size={14} strokeWidth={2} />
          </button>
          <InstallPWA />
        </div>
      </header>

      {/* Main content */}
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

          {/* Search bar + filters button */}
          <div className="w-full space-y-3">
            <div className="flex items-center gap-0 bg-white rounded-2xl border border-border-gray/25 shadow-sm overflow-hidden pl-4">
              <Search size={18} className="text-text-medium shrink-0" strokeWidth={2} />
              <input
                data-voice-input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Quick pasta, Biryani…"
                className="flex-1 px-3 py-4 text-sm text-text-dark placeholder:text-text-medium/55 focus:outline-none bg-transparent"
                onKeyDown={(e) => { if (e.key === "Enter") handleUnifiedSearch(); }}
              />
              {/* Voice search */}
              <button
                onClick={handleVoiceSearch}
                title="Search by voice"
                className={`p-3 transition-all duration-150 shrink-0 ${
                  isListening ? "text-primary animate-pulse" : "text-text-medium hover:text-primary"
                }`}
              >
                {isListening
                  ? <MicOff size={18} strokeWidth={2} />
                  : <Mic size={18} strokeWidth={2} />}
              </button>
              <button
                onClick={() => handleUnifiedSearch()}
                disabled={!isSearchable}
                className="m-1.5 p-3 rounded-xl bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-dark active:scale-95 transition-all duration-150 shrink-0"
              >
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Filter pill — shows active filters or open sheet */}
            <div className="flex justify-center gap-2 flex-wrap">
              <button
                onClick={() => setShowFiltersSheet(true)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium shadow-sm active:scale-95 transition-all duration-150 ${
                  hasFilters
                    ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/15"
                    : "bg-white border-border-gray/30 text-text-dark hover:border-primary/40 hover:text-primary"
                }`}
              >
                <SlidersHorizontal size={14} strokeWidth={2.5} />
                {filterLabel ?? "Cuisine & Ingredients"}
              </button>

              {/* Clear filters if any active */}
              {hasFilters && (
                <button
                  onClick={() => { setSelectedCuisine(null); setSelectedIngredients([]); }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-border-gray/30 text-xs font-medium text-text-medium hover:text-text-dark hover:border-border-gray/60 transition-colors"
                >
                  <X size={12} strokeWidth={2.5} /> Clear
                </button>
              )}
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

          {/* Cuisine quick-chips — tap to select as filter */}
          <div className="w-full">
            <p className="text-xs font-semibold text-text-medium uppercase tracking-wider mb-3 text-left">
              Cuisine
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              {CUISINES.map(({ id, label }) => {
                const isSelected = selectedCuisine === label;
                return (
                  <button
                    key={id}
                    onClick={() => toggleCuisine(label)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-150 shadow-sm active:scale-95 ${
                      isSelected
                        ? "bg-primary text-white border-primary shadow-md"
                        : "bg-white border-border-gray/25 text-text-dark hover:border-primary/40 hover:text-primary hover:shadow-sm"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {selectedCuisine && (
              <p className="text-xs text-primary mt-2 text-left font-medium">
                {selectedCuisine} selected — add ingredients or search to refine, or tap the arrow to explore.
              </p>
            )}
          </div>

        </div>
      </main>

      {/* Filters Bottom Sheet */}
      {showFiltersSheet && (
        <div
          className="fixed inset-0 z-[120] bg-black/35 backdrop-blur-[1px]"
          onClick={() => setShowFiltersSheet(false)}
        >
          <div
            className="absolute inset-x-0 bottom-6 max-w-md mx-auto bg-white rounded-3xl border border-border-gray/20 shadow-2xl p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-primary">Cuisine &amp; Ingredients</h2>
                <p className="text-xs text-text-medium mt-0.5">
                  Combine cuisine, ingredients, and your search term freely.
                </p>
              </div>
              <button
                onClick={() => setShowFiltersSheet(false)}
                className="w-9 h-9 rounded-full border border-border-gray/30 text-text-medium hover:text-text-dark hover:border-border-gray/60 transition-colors flex items-center justify-center shrink-0"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Active context summary */}
            {(searchQuery.trim() || selectedCuisine || selectedIngredients.length > 0) && (
              <div className="mb-5 rounded-2xl border border-border-gray/30 bg-background-muted/35 p-3 space-y-1">
                {searchQuery.trim() && (
                  <p className="text-xs text-text-medium">
                    Search: <span className="font-semibold text-text-dark">&ldquo;{searchQuery.trim()}&rdquo;</span>
                  </p>
                )}
                {selectedCuisine && (
                  <p className="text-xs text-text-medium">
                    Cuisine: <span className="font-semibold text-primary">{selectedCuisine}</span>
                  </p>
                )}
                {selectedIngredients.length > 0 && (
                  <p className="text-xs text-text-medium">
                    Ingredients: <span className="font-semibold text-text-dark">{selectedIngredients.join(", ")}</span>
                  </p>
                )}
              </div>
            )}

            {/* Cuisine section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-text-medium uppercase tracking-wide">
                  Cuisine
                </p>
                {selectedCuisine && (
                  <button
                    onClick={() => setSelectedCuisine(null)}
                    className="text-xs font-medium text-text-medium hover:text-text-dark"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {CUISINES.map(({ id, label }) => {
                  const isActive = selectedCuisine === label;
                  return (
                    <button
                      key={id}
                      onClick={() => toggleCuisine(label)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        isActive
                          ? "bg-primary text-white border-primary"
                          : "bg-white border-border-gray/30 text-text-dark hover:border-primary hover:text-primary"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="my-5 border-t border-border-gray/15" />

            {/* Ingredients section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-text-medium uppercase tracking-wide">
                  Ingredients
                </p>
                {selectedIngredients.length > 0 && (
                  <button
                    onClick={() => setSelectedIngredients([])}
                    className="text-xs font-medium text-text-medium hover:text-text-dark"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  placeholder="Add ingredient (e.g., tomato)"
                  className="flex-1 px-4 py-3 rounded-xl border border-border-gray/30 text-sm text-text-dark placeholder:text-text-medium/60 focus:outline-none focus:border-primary/50"
                  onKeyDown={(e) => { if (e.key === "Enter") addIngredient(ingredientInput); }}
                />
                <button
                  onClick={() => addIngredient(ingredientInput)}
                  className="px-4 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-95 active:scale-95 transition-all"
                >
                  Add
                </button>
              </div>

              {selectedIngredients.length > 0 && (
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
              )}

              <div className="space-y-2">
                <p className="text-xs font-medium text-text-medium uppercase tracking-wide">
                  Popular
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_INGREDIENTS.map((item) => (
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

            {/* Search CTA */}
            <button
              onClick={() => handleUnifiedSearch()}
              disabled={!isSearchable}
              className="mt-6 w-full py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.98] transition-all"
            >
              {isSearchable ? "Search recipes" : "Select cuisine or add ingredients"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
