import BottomNav from "@/components/BottomNav";
import { Search } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-background-light pb-24">
      <main className="max-w-md mx-auto px-6 pt-12 flex flex-col items-center space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">ChefQuest</h1>
          <p className="text-text-medium">What would you like to cook today?</p>
        </div>

        {/* Hero Image */}
        <div className="w-full aspect-square relative rounded-[20px] overflow-hidden shadow-lg bg-background-muted flex items-center justify-center group">
          {/* Placeholder for user-generated image */}
          {/* <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col items-center justify-center text-primary/40 p-6 text-center">
            <span className="text-sm font-medium">Hero Image Placeholder</span>
            <span className="text-xs mt-2">Place 'hero-veg-dish.png' in public folder</span>
          </div> */}

          {/* Actual Image Component - Uncomment when image is ready */}

          <Image
            src="/veg-dish.png"
            alt="Delicious Vegetarian Dish"
            fill
            className="object-cover"
            priority
          />

        </div>

        {/* Search Bar */}
        <div className="w-full relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-primary">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search for recipes..."
            className="w-full py-4 pl-12 pr-4 rounded-[14px] bg-background-muted text-text-dark placeholder:text-text-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
          />
        </div>

        {/* Empty Space / Content Area */}
        <div className="w-full flex-1 min-h-[100px]">
          {/* Additional content can go here */}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
