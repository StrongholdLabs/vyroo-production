import { useState, useRef, useCallback, useEffect } from 'react';

// Re-use the SpeechRecognition types from useVoiceInput
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice: SpeechSynthesisVoice | null;
}

const defaultVoiceSettings: VoiceSettings = {
  rate: 1,
  pitch: 1,
  volume: 1,
  voice: null,
};

export interface UseVoiceAgentReturn {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  cancelSpeech: () => void;
  voiceSettings: VoiceSettings;
  setVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  availableVoices: SpeechSynthesisVoice[];
}

export interface UseVoiceAgentOptions {
  onTranscript?: (text: string) => void;
  onSpeechEnd?: () => void;
  language?: string;
  continuous?: boolean;
}

export function useVoiceAgent(options: UseVoiceAgentOptions = {}): UseVoiceAgentReturn {
  const { onTranscript, onSpeechEnd, language = 'en-US', continuous = true } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [voiceSettings, setVoiceSettingsState] = useState<VoiceSettings>(defaultVoiceSettings);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onSpeechEndRef = useRef(onSpeechEnd);
  const shouldRestartRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onSpeechEndRef.current = onSpeechEnd;
  }, [onSpeechEnd]);

  const SpeechRecognitionAPI =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : undefined;

  const synthAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const isSupported = !!SpeechRecognitionAPI && synthAvailable;

  // Load available voices
  useEffect(() => {
    if (!synthAvailable) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      // Set default voice to first English voice if none selected
      if (!voiceSettings.voice && voices.length > 0) {
        const englishVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
        setVoiceSettingsState((prev) => ({ ...prev, voice: englishVoice }));
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synthAvailable]);

  const setVoiceSettings = useCallback((settings: Partial<VoiceSettings>) => {
    setVoiceSettingsState((prev) => ({ ...prev, ...settings }));
  }, []);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) return;

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    shouldRestartRef.current = true;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        setTranscript(finalText);
        setInterimTranscript('');
        onTranscriptRef.current?.(finalText);
      } else {
        setInterimTranscript(interimText);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');

      // Auto-restart if continuous mode and not explicitly stopped
      if (shouldRestartRef.current && continuous) {
        try {
          recognition.start();
        } catch {
          // Ignore restart errors
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Don't treat 'no-speech' as fatal in continuous mode
      if (event.error === 'no-speech' && continuous && shouldRestartRef.current) {
        return;
      }

      const errorMessages: Record<string, string> = {
        'not-allowed': 'Microphone access denied. Please allow microphone permissions.',
        'no-speech': 'No speech detected.',
        'audio-capture': 'No microphone found. Please check your audio input.',
        'network': 'Network error occurred.',
        'aborted': 'Voice input was cancelled.',
      };
      setError(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
      setIsListening(false);
      shouldRestartRef.current = false;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setError('Failed to start voice input. Please try again.');
    }
  }, [SpeechRecognitionAPI, language, continuous]);

  const speak = useCallback(
    (text: string) => {
      if (!synthAvailable) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;
      if (voiceSettings.voice) {
        utterance.voice = voiceSettings.voice;
      }
      utterance.lang = language;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        onSpeechEndRef.current?.();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [synthAvailable, voiceSettings, language],
  );

  const cancelSpeech = useCallback(() => {
    if (!synthAvailable) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [synthAvailable]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      recognitionRef.current?.abort();
      if (synthAvailable) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
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
  };
}
