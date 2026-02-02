import { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Volume2, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { VoiceCommand, VoiceResponse } from '@chorechamp/types';

// Speech Recognition types for Web API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface VoiceCommandInterfaceProps {
  householdId: string;
  onCommandProcessed?: (command: VoiceCommand, response: VoiceResponse) => void;
}

interface CommandHistoryItem {
  id: string;
  command: VoiceCommand;
  response: VoiceResponse;
  timestamp: Date;
}

export function VoiceCommandInterface({
  householdId,
  onCommandProcessed,
}: VoiceCommandInterfaceProps) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  }, []);

  const processCommand = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setIsProcessing(true);
      setError(null);

      try {
        const result = await apiClient.processVoiceCommand(
          householdId,
          text,
          sessionId || undefined
        );

        setSessionId(result.sessionId);

        const historyItem: CommandHistoryItem = {
          id: crypto.randomUUID(),
          command: result.command,
          response: result.response,
          timestamp: new Date(),
        };

        setHistory((prev) => [...prev, historyItem]);
        setInput('');

        if (result.response.spokenResponse) {
          speak(result.response.spokenResponse);
        }

        onCommandProcessed?.(result.command, result.response);
      } catch (err) {
        console.error('Failed to process command:', err);
        setError(err instanceof Error ? err.message : 'Failed to process command');
      } finally {
        setIsProcessing(false);
      }
    },
    [householdId, sessionId, speak, onCommandProcessed]
  );

  const startListening = useCallback(() => {
    const win = window as Window & {
      SpeechRecognition?: new () => ISpeechRecognition;
      webkitSpeechRecognition?: new () => ISpeechRecognition;
    };

    if (!win.webkitSpeechRecognition && !win.SpeechRecognition) {
      setError('Speech recognition is not supported in your browser');
      return;
    }

    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      let transcript = '';
      for (let i = 0; i < results.length; i++) {
        transcript += results[i][0].transcript;
      }
      setInput(transcript);

      if (results[0].isFinal) {
        processCommand(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [processCommand]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCommand(input);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Mic className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                Voice Assistant
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ask about chores, points, or get help
              </p>
            </div>
          </div>

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg"
            >
              <Volume2 className="w-5 h-5 animate-pulse" />
            </button>
          )}
        </div>
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Start by speaking or typing a command</p>
            <p className="text-sm mt-1">
              Try saying "What are my chores today?"
            </p>
          </div>
        )}

        {history.map((item) => (
          <div key={item.id} className="space-y-2">
            {/* User message */}
            <div className="flex justify-end">
              <div className="max-w-[80%] bg-indigo-600 text-white rounded-lg px-4 py-2">
                <p>{item.command.rawText}</p>
                <p className="text-xs text-indigo-200 mt-1">
                  {item.command.intent.replace(/_/g, ' ')} ({Math.round(item.command.confidence * 100)}%)
                </p>
              </div>
            </div>

            {/* Assistant response */}
            <div className="flex justify-start">
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  item.response.success
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}
              >
                <p>{item.response.message}</p>

                {item.response.suggestions && item.response.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.response.suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => processCommand(suggestion)}
                        className="text-xs bg-white dark:bg-gray-600 px-2 py-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-500"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <div ref={historyEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={`p-3 rounded-full transition-colors ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? 'Listening...' : 'Type a command or click the mic'}
            disabled={isProcessing || isListening}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

