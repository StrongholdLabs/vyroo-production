import { Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { cn } from '@/lib/utils';

interface VoiceMicButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export function VoiceMicButton({ onTranscript, className }: VoiceMicButtonProps) {
  const { isListening, isSupported, toggle, interimTranscript } = useVoiceInput({
    onTranscript,
  });

  if (!isSupported) return null;

  return (
    <button
      onClick={toggle}
      className={cn(
        'relative p-2 transition-colors duration-150 rounded-lg active:scale-95',
        isListening
          ? 'text-red-500 hover:text-red-600'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent',
        className,
      )}
      title={isListening ? 'Stop listening' : 'Voice input'}
      aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
    >
      {/* Pulsing ring when listening */}
      {isListening && (
        <span
          className="absolute inset-0 rounded-lg border-2 border-red-500 animate-[pulse-ring_1.5s_ease-out_infinite]"
          aria-hidden="true"
        />
      )}

      {isListening ? <MicOff size={18} /> : <Mic size={18} />}

      <style>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
}
