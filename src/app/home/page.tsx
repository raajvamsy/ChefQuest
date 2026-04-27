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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  { id: "vegetarian", label: "Vegetarian", Icon: Leaf, query: "vegetarian recipes", diet: "veg" as const },
  { id: "quick-meals", label: "Quick Meals", Icon: Timer, query: "quick meals under 30 minutes", diet: "veg" as const },
  { id: "baking", label: "Baking", Icon: ChefHat, query: "baking recipes", diet: "veg" as const },
  { id: "smoothies", label: "Smoothies", Icon: GlassWater, query: "smoothie recipes", diet: "veg" as const },
];

export default function AppHome() {
  const router = useRouter();
  const [diet, setDiet] = useState<"veg" | "non-veg">("veg");
  const [language, setLanguage] = useState("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [showIngredientsSheet, setShowIngredientsSheet] = useState(false);
  const [ingredientInput, setIngredientInput] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

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
      diet: dietOverride ?? diet,
      lang: language,
      mode,
    });

    if (hasIngredients) {
      params.set("ingredients", selectedIngredients.join(","));
    }

    setShowIngredientsSheet(false);
    router.push(`/recipes?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-border-gray/15">
        <div className="max-w-screen-lg mx-auto px-5 h-14 flex items-center gap-3">

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

          {/* Diet toggle */}
          <div className="relative inline-flex items-center bg-background-muted border border-border-gray/25 rounded-full p-0.5 shrink-0">
            <div
              className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] bg-primary rounded-full transition-all duration-300 ease-out ${
                diet === "veg" ? "left-0.5" : "left-[calc(50%+2px)]"
              }`}
            />
            <button
              onClick={() => setDiet("veg")}
              className={`relative z-10 w-[58px] py-1.5 rounded-full text-xs font-semibold text-center transition-all duration-300 ${
                diet === "veg" ? "text-white" : "text-text-medium"
              }`}
            >
              Veg
            </button>
            <button
              onClick={() => setDiet("non-veg")}
              className={`relative z-10 w-[58px] py-1.5 rounded-full text-xs font-semibold text-center transition-all duration-300 ${
                diet === "non-veg" ? "text-white" : "text-text-medium"
              }`}
            >
              Non-Veg
            </button>
          </div>

          {/* Profile */}
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-gray/30 text-xs font-semibold text-text-medium hover:text-text-dark hover:border-border-gray/60 transition-colors shrink-0"
          >
            <User size={14} strokeWidth={2} />
            <span className="hidden sm:inline">Profile</span>
          </button>

          {/* Install PWA — inline in header */}
          <InstallPWA />
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex items-center justify-center min-h-[62vh] overflow-hidden">
        {/* Kitchen background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1920&q=60"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-105 blur-sm opacity-35 select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-background-light/55" />

        {/* Hero content */}
        <div className="relative z-10 w-full max-w-xl mx-auto px-6 py-16 flex flex-col items-center gap-6 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold text-primary leading-tight tracking-tight">
              What are you craving?
            </h1>
            <p className="text-text-medium text-base">
              Discover recipes tailored to your taste and time.
            </p>
          </div>

          {/* Search bar */}
          <div className="w-full flex items-center gap-0 bg-white rounded-2xl border border-border-gray/25 shadow-sm overflow-hidden pl-4">
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
            <button
              onClick={() => handleUnifiedSearch()}
              disabled={!searchQuery.trim() && selectedIngredients.length === 0}
              className="m-1.5 p-3 rounded-xl bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-dark active:scale-95 transition-all duration-150 shrink-0"
            >
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Sub-actions */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => setShowIngredientsSheet(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 border border-border-gray/30 text-sm font-medium text-text-dark shadow-sm hover:border-primary/40 hover:text-primary active:scale-95 transition-all duration-150"
            >
              <Plus size={14} strokeWidth={2.5} />
              {selectedIngredients.length > 0
                ? `${selectedIngredients.length} ingredients`
                : "By ingredients"}
            </button>
          </div>
        </div>
      </section>

      {/* Category tiles */}
      <section className="bg-white border-t border-border-gray/15 px-6 py-8">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-3">
          {CATEGORIES.map(({ id, label, Icon, query, diet: catDiet }) => (
            <button
              key={id}
              onClick={() => handleUnifiedSearch(query, catDiet)}
              className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-background-muted/60 border border-border-gray/20 hover:border-primary/30 hover:bg-primary/5 active:scale-95 transition-all duration-150 group"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-border-gray/25 flex items-center justify-center shadow-sm group-hover:border-primary/20 transition-colors">
                <Icon size={20} className="text-text-dark group-hover:text-primary transition-colors" strokeWidth={1.75} />
              </div>
              <span className="text-[10px] font-semibold text-text-medium uppercase tracking-wider leading-tight text-center">
                {label}
              </span>
            </button>
          ))}
        </div>
      </section>

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
