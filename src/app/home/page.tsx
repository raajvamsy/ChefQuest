"use client";

import BottomNav from "@/components/BottomNav";
import InstallPWA from "@/components/InstallPWA";
import { Search, Sparkles, ChefHat, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AppHome() {
  const router = useRouter();
  const [diet, setDiet] = useState<"veg" | "non-veg">("veg");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/recipes?q=${encodeURIComponent(query)}&diet=${diet}`);
    }
  };

  const quickSearches = [
    "Pasta",
    "Curry",
    "Salad",
    "Soup",
    "Dessert",
  ];

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

      <main className="max-w-md mx-auto px-6 pt-8 flex flex-col space-y-12">
        
        {/* Tagline */}
        <div className="text-center">
          <p className="text-text-medium text-base">
            Discover recipes tailored to your taste
          </p>
        </div>

        {/* Search Section */}
        <div className="space-y-5">
          {/* Diet Toggle - Moved above search */}
          <div className="flex justify-center">
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
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-text-medium group-focus-within:text-primary transition-colors">
              <Search size={20} strokeWidth={2} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes, ingredients, cuisines..."
              className="w-full py-5 pl-14 pr-5 rounded-2xl bg-white border border-border-gray/30 text-text-dark placeholder:text-text-medium/60 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(14,71,1,0.1)] transition-all duration-200"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(searchQuery);
                }
              }}
            />
          </div>

          {/* Quick Searches */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Sparkles size={16} className="text-primary" strokeWidth={2} />
              <span className="text-sm font-medium text-text-medium">Quick searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => handleSearch(search)}
                  className="px-5 py-2.5 rounded-full bg-white border border-border-gray/30 text-sm font-medium text-text-dark hover:border-primary hover:text-primary hover:shadow-sm active:scale-95 transition-all duration-200"
                >
                  {search}
                </button>
              ))}
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
    </div>
  );
}
