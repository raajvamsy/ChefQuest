import { ChefHat, Sparkles, Camera, Brain, Shield, Zap } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted">
      {/* Header */}
      <header className="border-b border-border-gray/20 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat size={32} className="text-primary" strokeWidth={2} />
            <h1 className="text-2xl font-bold text-primary">ChefQuest</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark transition-all active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-text-dark leading-tight">
            Your AI-Powered <span className="text-primary">Culinary Companion</span>
          </h2>
          <p className="text-lg md:text-xl text-text-medium leading-relaxed">
            Discover personalized recipes, get step-by-step cooking guidance, and enhance your 
            culinary skills with AI-powered assistance. ChefQuest makes cooking easier, smarter, 
            and more enjoyable.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="px-8 py-4 bg-primary text-white rounded-2xl font-semibold text-lg hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              Start Cooking
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 bg-white text-primary rounded-2xl font-semibold text-lg border-2 border-primary hover:bg-primary/5 transition-all active:scale-95"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-text-dark mb-4">
            Everything You Need to Cook Better
          </h3>
          <p className="text-lg text-text-medium max-w-2xl mx-auto">
            ChefQuest combines AI technology with practical cooking tools to help you create 
            amazing meals every time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-border-gray/30 rounded-2xl p-8 hover:border-primary/30 hover:shadow-lg transition-all">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Brain size={28} className="text-primary" strokeWidth={2} />
            </div>
            <h4 className="text-xl font-semibold text-text-dark mb-3">AI Recipe Generation</h4>
            <p className="text-text-medium leading-relaxed">
              Get personalized recipe recommendations based on your ingredients, dietary 
              preferences, and cooking skill level.
            </p>
          </div>

          <div className="bg-white border border-border-gray/30 rounded-2xl p-8 hover:border-primary/30 hover:shadow-lg transition-all">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Camera size={28} className="text-primary" strokeWidth={2} />
            </div>
            <h4 className="text-xl font-semibold text-text-dark mb-3">Visual Validation</h4>
            <p className="text-text-medium leading-relaxed">
              Use your camera to verify cooking steps with AI-powered image recognition. 
              Get instant feedback on your progress.
            </p>
          </div>

          <div className="bg-white border border-border-gray/30 rounded-2xl p-8 hover:border-primary/30 hover:shadow-lg transition-all">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-primary" strokeWidth={2} />
            </div>
            <h4 className="text-xl font-semibold text-text-dark mb-3">Smart Cooking Mode</h4>
            <p className="text-text-medium leading-relaxed">
              Follow interactive step-by-step instructions with built-in timers and smart 
              task adjustments based on your progress.
            </p>
          </div>

          <div className="bg-white border border-border-gray/30 rounded-2xl p-8 hover:border-primary/30 hover:shadow-lg transition-all">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ChefHat size={28} className="text-primary" strokeWidth={2} />
            </div>
            <h4 className="text-xl font-semibold text-text-dark mb-3">Recipe Collections</h4>
            <p className="text-text-medium leading-relaxed">
              Save your favorite recipes, organize them into collections, and access them 
              anytime, anywhere.
            </p>
          </div>

          <div className="bg-white border border-border-gray/30 rounded-2xl p-8 hover:border-primary/30 hover:shadow-lg transition-all">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Zap size={28} className="text-primary" strokeWidth={2} />
            </div>
            <h4 className="text-xl font-semibold text-text-dark mb-3">Dietary Preferences</h4>
            <p className="text-text-medium leading-relaxed">
              Filter recipes by vegetarian, non-vegetarian preferences, and get suggestions 
              tailored to your dietary needs.
            </p>
          </div>

          <div className="bg-white border border-border-gray/30 rounded-2xl p-8 hover:border-primary/30 hover:shadow-lg transition-all">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield size={28} className="text-primary" strokeWidth={2} />
            </div>
            <h4 className="text-xl font-semibold text-text-dark mb-3">Privacy First</h4>
            <p className="text-text-medium leading-relaxed">
              We only use Google OAuth for sign-in. No tracking, no ads, no data selling. 
              Your cooking journey is private.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24 bg-background-muted/50 rounded-3xl">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-text-dark mb-4">
            How ChefQuest Works
          </h3>
          <p className="text-lg text-text-medium">Simple, intuitive, and powered by AI</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto">
              1
            </div>
            <h4 className="text-xl font-semibold text-text-dark">Search & Discover</h4>
            <p className="text-text-medium">
              Search for recipes by ingredients, cuisine, or dietary preference. Our AI finds 
              the perfect match for you.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto">
              2
            </div>
            <h4 className="text-xl font-semibold text-text-dark">Cook with Guidance</h4>
            <p className="text-text-medium">
              Follow step-by-step instructions with AI visual validation to ensure perfect 
              results every time.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto">
              3
            </div>
            <h4 className="text-xl font-semibold text-text-dark">Save & Share</h4>
            <p className="text-text-medium">
              Save your favorites, track your cooking progress, and build your personal 
              recipe collection.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="bg-primary rounded-3xl p-12 md:p-16 text-center text-white">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Cooking?
          </h3>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join ChefQuest today and discover a smarter way to cook. Sign in with Google to 
            get started in seconds.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-white text-primary rounded-2xl font-semibold text-lg hover:bg-background-light transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-gray/30 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ChefHat size={24} className="text-primary" strokeWidth={2} />
              <span className="font-semibold text-text-dark">ChefQuest</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-text-medium">
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <a href="mailto:support@chefquest.com" className="hover:text-primary transition-colors">
                Contact
              </a>
            </div>
            <p className="text-sm text-text-medium">
              © 2025 ChefQuest. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
