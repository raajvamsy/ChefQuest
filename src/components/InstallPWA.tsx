"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPWA() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      
      // Store the event for later use
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      // Hide the install button after app is installed
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    // Listen for the appinstalled event
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      return;
    }

    // Show the install prompt
    await installPrompt.prompt();

    // Wait for the user's response
    await installPrompt.userChoice;

    // Clear the prompt as it can only be used once
    setInstallPrompt(null);
    setIsInstallable(false);
  };

  // Don't render anything if app is not installable
  if (!isInstallable) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-primary hover:bg-primary-dark text-white shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 group shrink-0"
      aria-label="Install ChefQuest app"
      title="Install app"
    >
      <Download
        size={17}
        className="group-hover:animate-bounce"
        strokeWidth={2}
      />
    </button>
  );
}
