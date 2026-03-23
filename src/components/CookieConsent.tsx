import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "vyroo-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      // Small delay so the banner slides in after page load
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleChoice = (choice: "accepted" | "declined") => {
    localStorage.setItem(STORAGE_KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg",
        "rounded-lg border border-border bg-card p-4 shadow-lg",
        "flex items-center gap-4 text-sm",
        "animate-in slide-in-from-bottom-4 duration-300 ease-out"
      )}
    >
      <p className="flex-1 text-muted-foreground">
        We use cookies to improve your experience.{" "}
        <Link to="/cookies" className="underline text-foreground hover:text-primary">
          Learn more
        </Link>
      </p>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => handleChoice("declined")}
          className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          Decline
        </button>
        <button
          onClick={() => handleChoice("accepted")}
          className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
