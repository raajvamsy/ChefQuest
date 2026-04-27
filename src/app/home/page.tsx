"use client";

import BottomNav from "@/components/BottomNav";
import InstallPWA from "@/components/InstallPWA";
import { Search, Sparkles, ChefHat, Zap, Languages, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

export default function AppHome() {
  const router = useRouter();
  const [diet, setDiet] = useState<"veg" | "non-veg">("veg");
  const [language, setLanguage] = useState("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [showIngredientsSheet, setShowIngredientsSheet] = useState(false);
  const [ingredientInput, setIngredientInput] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  const suggestedIngredients = [
    "Onion",
    "Tomato",
    "Garlic",
    "Ginger",
    "Egg",
    "Potato",
    "Rice",
    "Milk",
    "Cheese",
    "Spinach",
  ];

  const quickSearches = ["Pasta", "Curry", "Salad", "Soup", "Dessert"];

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

  const handleUnifiedSearch = (queryOverride?: string) => {
    const trimmedQuery = (queryOverride ?? searchQuery).trim();
    const hasIngredients = selectedIngredients.length > 0;
    if (!trimmedQuery && !hasIngredients) return;

    let query = trimmedQuery;
    let mode = "query_only";

    if (!trimmedQuery && hasIngredients) {
      // Keep a stable neutral query; ingredient constraints are passed separately.
      query = "ingredient based recipes";
      mode = "ingredients_only";
    } else if (trimmedQuery && hasIngredients) {
      mode = "query_with_ingredients";
    }

    const params = new URLSearchParams({
      q: query,
      diet,
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
    <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted pb-24">
      {/* PWA Install Button */}
      <InstallPWA />
      
      {/* Sticky Header */}
      <div className="sticky top-0 bg-gradient-to-b from-background-light to-background-light/95 backdrop-blur-sm border-b border-border-gray/20 z-40 shadow-sm">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h1 className="text-2xl font-bold text-primary tracking-tight">ChefQuest</h1>
            <div className="w-1 h-6 bg-primary rounded-full" />
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-6 pt-8 flex flex-col space-y-4">
        
        {/* Tagline */}
        <div className="text-center">
          <p className="text-text-medium text-base">
            Discover recipes tailored to your taste
          </p>
        </div>

        {/* Search Setup */}
        <div className="space-y-5">
          {/* Diet Toggle & Language Selector */}
          <div className="flex flex-col items-center gap-4">
            {/* Diet Toggle */}
            <div className="relative inline-flex items-center bg-white border border-border-gray/30 rounded-full p-1 shadow-sm">
              {/* Sliding background */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-full transition-all duration-300 ease-out shadow-sm ${
                  diet === "veg" ? "left-1" : "left-[calc(50%+3px)]"
                }`}
              />

              <button
                onClick={() => setDiet("veg")}
                className={`relative z-10 w-28 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  diet === "veg"
                    ? "text-white"
                    : "text-text-medium hover:text-text-dark"
                }`}
              >
                Vegetarian
              </button>
              <button
                onClick={() => setDiet("non-veg")}
                className={`relative z-10 w-28 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  diet === "non-veg"
                    ? "text-white"
                    : "text-text-medium hover:text-text-dark"
                }`}
              >
                Non-Veg
              </button>
            </div>

            {/* Language Selector */}
            <div className="relative inline-flex items-center bg-white border border-border-gray/30 rounded-2xl px-4 py-2.5 shadow-sm">
              <Languages size={18} className="text-primary mr-2" strokeWidth={2} />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="appearance-none bg-transparent text-sm font-medium text-text-dark pr-8 focus:outline-none cursor-pointer"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 pointer-events-none">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-text-medium">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative group flex-1">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-text-medium group-focus-within:text-primary transition-colors">
                  <Search size={20} strokeWidth={2} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dish"
                  className="w-full py-4 pl-14 pr-5 rounded-2xl bg-white border border-border-gray/30 text-text-dark placeholder:text-text-medium/60 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(14,71,1,0.1)] transition-all duration-200"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnifiedSearch();
                    }
                  }}
                />
              </div>
              <button
                onClick={() => handleUnifiedSearch()}
                disabled={!searchQuery.trim() && selectedIngredients.length === 0}
                className="px-4 py-4 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-45 disabled:cursor-not-allowed"
              >
                Search
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Sparkles size={16} className="text-primary" strokeWidth={2} />
                <span className="text-sm font-medium text-text-medium">Popular searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handleUnifiedSearch(search)}
                    className="px-5 py-2.5 rounded-full bg-white border border-border-gray/30 text-sm font-medium text-text-dark hover:border-primary hover:text-primary hover:shadow-sm active:scale-95 transition-all duration-200"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="space-y-4 pb-8">
          <h2 className="text-sm font-semibold text-text-medium uppercase tracking-wide px-1">
            Why ChefQuest?
          </h2>
          <div className="grid gap-3">
            <div className="bg-white border border-border-gray/30 rounded-2xl p-5 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ChefHat size={20} className="text-primary" strokeWidth={2} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-text-dark">AI-Powered Recipes</h3>
                  <p className="text-sm text-text-medium leading-relaxed">
                    Get personalized recipes based on your ingredients and preferences
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-border-gray/30 rounded-2xl p-5 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap size={20} className="text-primary" strokeWidth={2} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-text-dark">Quick & Easy</h3>
                  <p className="text-sm text-text-medium leading-relaxed">
                    Find recipes that match your cooking time and skill level
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      <BottomNav />

      {/* Ingredients Quick Action */}
      <button
        onClick={() => {
          setShowIngredientsSheet(true);
        }}
        className="fixed bottom-32 right-6 z-[110] bg-primary text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 flex items-center gap-2"
      >
        <Plus size={18} strokeWidth={2.5} />
        <span className="text-sm font-semibold">
          {selectedIngredients.length > 0 ? `${selectedIngredients.length}` : "Ingredients"}
        </span>
      </button>

      {/* Ingredients Bottom Sheet */}
      {showIngredientsSheet && (
        <div
          className="fixed inset-0 z-[120] bg-black/35 backdrop-blur-[1px]"
          onClick={() => {
            setShowIngredientsSheet(false);
          }}
        >
          <div
            className="absolute inset-x-0 bottom-24 max-w-md mx-auto bg-white rounded-3xl border border-border-gray/20 shadow-2xl p-6 max-h-[72vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-primary">Add Ingredients</h2>
                <p className="text-xs text-text-medium mt-0.5">Use ingredients only, or combine with home search.</p>
              </div>
              <button
                onClick={() => {
                  setShowIngredientsSheet(false);
                }}
                className="w-9 h-9 rounded-full border border-border-gray/30 text-text-medium hover:text-text-dark hover:border-border-gray/60 transition-colors flex items-center justify-center"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-border-gray/30 bg-background-muted/35 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-dark">
                  Selected ingredients: <span className="text-primary">{selectedIngredients.length}</span>
                </p>
              </div>
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
                    if (e.key === "Enter") {
                      addIngredient(ingredientInput);
                    }
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
                <p className="text-xs font-medium text-text-medium uppercase tracking-wide">Popular ingredients</p>
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
