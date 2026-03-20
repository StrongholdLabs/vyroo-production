import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";

interface ImageLightboxProps {
  images: { url: string; alt: string }[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex, open, onClose }: ImageLightboxProps) {
  const [current, setCurrent] = useState(initialIndex);

  useEffect(() => {
    setCurrent(initialIndex);
  }, [initialIndex]);

  const prev = useCallback(() => setCurrent((c) => (c > 0 ? c - 1 : images.length - 1)), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c < images.length - 1 ? c + 1 : 0)), [images.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, prev, next]);

  if (!open || images.length === 0) return null;

  const img = images[current];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      {/* Controls */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95"
      >
        <X size={20} />
      </button>

      <button
        onClick={() => {
          const a = document.createElement("a");
          a.href = img.url;
          a.download = img.alt || "image";
          a.target = "_blank";
          a.click();
        }}
        className="absolute top-4 right-16 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95"
      >
        <Download size={18} />
      </button>

      {/* Nav arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Image */}
      <div className="relative z-10 max-w-[85vw] max-h-[85vh]">
        <img
          src={img.url}
          alt={img.alt}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
      </div>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-6 z-10 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs tabular-nums">
          {current + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
