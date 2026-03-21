import { useState } from "react";
import { X, Settings, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useVoiceAgent } from "@/hooks/useVoiceAgent";
import { cn } from "@/lib/utils";

interface VoiceAgentOverlayProps {
  open: boolean;
  onClose: () => void;
  onTranscript?: (text: string) => void;
  aiResponse?: string;
}

export function VoiceAgentOverlay({
  open,
  onClose,
  onTranscript,
  aiResponse,
}: VoiceAgentOverlayProps) {
  const [showSettings, setShowSettings] = useState(false);

  const {
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    voiceSettings,
    setVoiceSettings,
    availableVoices,
  } = useVoiceAgent({
    onTranscript: (text) => {
      onTranscript?.(text);
    },
    continuous: true,
  });

  // Speak AI response when it arrives
  const handleSpeakResponse = () => {
    if (aiResponse) {
      speak(aiResponse);
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleClose = () => {
    stopListening();
    cancelSpeech();
    onClose();
  };

  if (!isSupported) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-2xl"
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
            <span className="text-sm font-medium text-foreground font-body">
              Voice Agent
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  showSettings
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                <Settings size={18} />
              </button>
              <button
                onClick={handleClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Settings panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-14 right-6 w-72 rounded-xl border border-border bg-card/90 backdrop-blur-lg p-4 shadow-xl space-y-4"
              >
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Voice Settings
                </h3>

                {/* Voice selector */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Voice
                  </label>
                  <select
                    value={voiceSettings.voice?.name || ""}
                    onChange={(e) => {
                      const voice = availableVoices.find(
                        (v) => v.name === e.target.value,
                      );
                      setVoiceSettings({ voice: voice || null });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  >
                    {availableVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rate slider */}
                <div>
                  <label className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Speed</span>
                    <span className="tabular-nums">{voiceSettings.rate.toFixed(1)}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceSettings.rate}
                    onChange={(e) =>
                      setVoiceSettings({ rate: parseFloat(e.target.value) })
                    }
                    className="w-full accent-primary"
                  />
                </div>

                {/* Pitch slider */}
                <div>
                  <label className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Pitch</span>
                    <span className="tabular-nums">{voiceSettings.pitch.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceSettings.pitch}
                    onChange={(e) =>
                      setVoiceSettings({ pitch: parseFloat(e.target.value) })
                    }
                    className="w-full accent-primary"
                  />
                </div>

                {/* Volume slider */}
                <div>
                  <label className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Volume</span>
                    <span className="tabular-nums">{Math.round(voiceSettings.volume * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={voiceSettings.volume}
                    onChange={(e) =>
                      setVoiceSettings({ volume: parseFloat(e.target.value) })
                    }
                    className="w-full accent-primary"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main content area */}
          <div className="flex flex-col items-center gap-8 max-w-lg px-6 w-full">
            {/* Pulsing circle / mic button */}
            <div className="relative">
              {/* Outer pulse rings when listening */}
              {isListening && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                    animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                    style={{
                      width: 120,
                      height: 120,
                      left: "50%",
                      top: "50%",
                      marginLeft: -60,
                      marginTop: -60,
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/20"
                    animate={{ scale: [1, 2.2], opacity: [0.3, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: 0.5,
                    }}
                    style={{
                      width: 120,
                      height: 120,
                      left: "50%",
                      top: "50%",
                      marginLeft: -60,
                      marginTop: -60,
                    }}
                  />
                </>
              )}

              {/* Speaking wave animation */}
              {isSpeaking && (
                <motion.div
                  className="absolute rounded-full bg-[hsl(var(--success))]/10"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    width: 140,
                    height: 140,
                    left: "50%",
                    top: "50%",
                    marginLeft: -70,
                    marginTop: -70,
                  }}
                />
              )}

              <motion.button
                onClick={handleToggleListening}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative w-[120px] h-[120px] rounded-full flex items-center justify-center transition-colors duration-300 shadow-lg",
                  isListening
                    ? "bg-primary text-primary-foreground shadow-primary/30"
                    : isSpeaking
                      ? "bg-[hsl(var(--success))] text-white shadow-[hsl(var(--success))]/30"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30",
                )}
              >
                {isListening ? (
                  <Mic size={36} />
                ) : isSpeaking ? (
                  <Volume2 size={36} />
                ) : (
                  <MicOff size={36} />
                )}
              </motion.button>
            </div>

            {/* Status text */}
            <div className="text-center">
              {isListening && !interimTranscript && !transcript && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground"
                >
                  Listening...
                </motion.p>
              )}
              {isSpeaking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-sm text-[hsl(var(--success))]"
                >
                  <span>Speaking</span>
                  <span className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1 bg-[hsl(var(--success))] rounded-full"
                        animate={{ height: [4, 12, 4] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </span>
                  <button
                    onClick={cancelSpeech}
                    className="ml-2 p-1 rounded-md hover:bg-accent transition-colors"
                    title="Stop speaking"
                  >
                    <VolumeX size={14} />
                  </button>
                </motion.div>
              )}
              {!isListening && !isSpeaking && (
                <p className="text-sm text-muted-foreground">
                  Tap to start listening
                </p>
              )}
            </div>

            {/* Transcript display */}
            <div className="w-full space-y-3 min-h-[80px]">
              {(transcript || interimTranscript) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card/50 backdrop-blur p-4"
                >
                  <p className="text-xs text-muted-foreground mb-1">You said:</p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {transcript}
                    {interimTranscript && (
                      <span className="text-muted-foreground italic">
                        {interimTranscript}
                      </span>
                    )}
                  </p>
                </motion.div>
              )}

              {/* AI response display */}
              {aiResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-primary/20 bg-primary/5 backdrop-blur p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-primary/70">Vyroo:</p>
                    {!isSpeaking && (
                      <button
                        onClick={handleSpeakResponse}
                        className="p-1 rounded-md text-primary/50 hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Read aloud"
                      >
                        <Volume2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {aiResponse}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Error display */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full px-4 py-2 rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive text-center"
              >
                {error}
              </motion.div>
            )}
          </div>

          {/* Bottom hint */}
          <div className="absolute bottom-6 left-0 right-0 text-center">
            <p className="text-xs text-muted-foreground/50">
              Press <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-[10px]">Esc</kbd> to close
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
