"use client";
import { useEffect } from "react";

export function AsciiBackground({ className }: { className?: string }) {
  useEffect(() => {
    const embedScript = document.createElement("script");
    embedScript.type = "text/javascript";
    embedScript.textContent = `
      !function(){
        if(!window.UnicornStudio){
          window.UnicornStudio={isInitialized:!1};
          var i=document.createElement("script");
          i.src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.33/dist/unicornStudio.umd.js";
          i.onload=function(){
            window.UnicornStudio.isInitialized||(UnicornStudio.init(),window.UnicornStudio.isInitialized=!0)
          };
          (document.head || document.body).appendChild(i)
        }
      }();
    `;
    document.head.appendChild(embedScript);

    const style = document.createElement("style");
    style.textContent = `
      [data-us-project] { position: relative !important; overflow: hidden !important; }
      [data-us-project] canvas { clip-path: inset(0 0 10% 0) !important; }
      [data-us-project] * { pointer-events: none !important; }
      [data-us-project] a[href*="unicorn"],
      [data-us-project] button[title*="unicorn"],
      [data-us-project] div[title*="Made with"],
      [data-us-project] .unicorn-brand,
      [data-us-project] [class*="brand"],
      [data-us-project] [class*="credit"],
      [data-us-project] [class*="watermark"] {
        display: none !important; visibility: hidden !important; opacity: 0 !important;
        position: absolute !important; left: -9999px !important; top: -9999px !important;
      }
    `;
    document.head.appendChild(style);

    const hideBranding = () => {
      document.querySelectorAll("[data-us-project] *").forEach((el) => {
        const text = (el.textContent || "").toLowerCase();
        const href = ((el as HTMLElement).getAttribute?.("href") || "").toLowerCase();
        if (text.includes("made with") || text.includes("unicorn") || href.includes("unicorn.studio")) {
          try { (el as HTMLElement).remove(); } catch {}
        }
      });
    };

    hideBranding();
    const interval = setInterval(hideBranding, 100);
    setTimeout(hideBranding, 1000);
    setTimeout(hideBranding, 3000);

    return () => {
      clearInterval(interval);
      try { document.head.removeChild(embedScript); } catch {}
      try { document.head.removeChild(style); } catch {}
    };
  }, []);

  return (
    <div className={className}>
      {/* Desktop: UnicornStudio animation */}
      <div className="absolute inset-0 w-full h-full hidden md:block opacity-40">
        <div
          data-us-project="OMzqyUv6M3kSnv0JeAtC"
          style={{ width: "100%", height: "100%", minHeight: "100vh" }}
        />
      </div>

      {/* Mobile: subtle star field */}
      <div
        className="absolute inset-0 w-full h-full md:hidden opacity-20"
        style={{
          backgroundImage: [
            "radial-gradient(1px 1px at 20% 30%, white, transparent)",
            "radial-gradient(1px 1px at 60% 70%, white, transparent)",
            "radial-gradient(1px 1px at 50% 50%, white, transparent)",
            "radial-gradient(1px 1px at 80% 10%, white, transparent)",
            "radial-gradient(1px 1px at 90% 60%, white, transparent)",
            "radial-gradient(1px 1px at 33% 80%, white, transparent)",
            "radial-gradient(1px 1px at 15% 60%, white, transparent)",
            "radial-gradient(1px 1px at 70% 40%, white, transparent)",
          ].join(", "),
        }}
      />
    </div>
  );
}
