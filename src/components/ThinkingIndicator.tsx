import manusLogo from "@/assets/manus-logo.jpeg";

export function ThinkingIndicator() {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="relative flex-shrink-0">
        {/* Logo with glow animation */}
        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent thinking-logo-ring">
          <img src={manusLogo} alt="Vyroo" className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 pt-2">
        <span className="thinking-dot thinking-dot-1" />
        <span className="thinking-dot thinking-dot-2" />
        <span className="thinking-dot thinking-dot-3" />
        <span className="text-xs text-muted-foreground ml-2 thinking-text">Thinking</span>
      </div>
    </div>
  );
}
