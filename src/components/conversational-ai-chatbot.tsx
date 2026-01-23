/**
 * Conversational AI Chat Assistant
 * Unified natural language interface for farm operations
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  Send,
  Mic,
  Loader2,
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface SuggestedQuery {
  icon: string;
  text: string;
  category: string;
}

export function ConversationalAIChatbot({ isOpen = false, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isOpen_, setIsOpen_] = useState(isOpen);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestedQueries: SuggestedQuery[] = [
    { icon: '📊', text: 'Why is my feed conversion ratio high?', category: 'Analytics' },
    { icon: '💧', text: 'What should I do about this dead shrimp I found?', category: 'Issues' },
    { icon: '🐠', text: 'Show me ponds that need attention today', category: 'Monitoring' },
    { icon: '💰', text: 'How can I reduce my production costs?', category: 'Optimization' },
    { icon: '📈', text: 'What are the best practices for my farm size?', category: 'Knowledge' },
    { icon: '⚠️', text: 'My water quality is degrading - what now?', category: 'Emergency' },
  ];

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (query: string = input) => {
    if (!query.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, conversationHistory: messages }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestedNextQuestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get AI response',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        variant: 'destructive',
        title: 'Not Supported',
        description: 'Voice input is not supported in your browser',
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to recognize speech',
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');

      setInput(transcript);
    };

    recognition.start();
  };

  if (!isOpen_) {
    return (
      <Button
        onClick={() => setIsOpen_(true)}
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 p-0 shadow-lg"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-lg z-50 flex flex-col">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">Farm Assistant</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen_(false);
              onClose?.();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="space-y-4 h-full flex flex-col justify-between">
            <div>
              <h3 className="font-medium mb-3">What can I help with?</h3>
              <div className="space-y-2">
                {suggestedQueries.map((query, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(query.text)}
                    className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{query.icon}</span>
                      <div>
                        <p className="font-medium text-foreground line-clamp-2">{query.text}</p>
                        <p className="text-xs text-muted-foreground">{query.category}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs rounded-lg p-3 ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-muted text-foreground rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(suggestion)}
                          className="block w-full text-left text-xs p-2 rounded bg-background/50 hover:bg-background transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-lg p-3 rounded-bl-none">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-3 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Ask anything about your farm..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
          />
          <Button
            size="sm"
            variant={isListening ? 'destructive' : 'outline'}
            onClick={handleVoiceInput}
            disabled={isLoading}
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Powered by AI • Always available for guidance
        </p>
      </div>
    </Card>
  );
}
