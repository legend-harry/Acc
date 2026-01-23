
"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Download } from "lucide-react";

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check if the app is running in standalone mode
    if (typeof window !== 'undefined' && window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      // Optionally, send analytics event with outcome
      console.log(`User response to the install prompt: ${outcome}`);
      // We've used the prompt, and can't use it again, but we can listen for another one
      setDeferredPrompt(null);
    }
  };

  if (!isMounted || isStandalone || !deferredPrompt) {
    return null;
  }

  return (
    <Button onClick={handleInstallClick} variant="outline" size="sm">
      <Download className="mr-2 h-4 w-4" />
      Install App
    </Button>
  );
}
