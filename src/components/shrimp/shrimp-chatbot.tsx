"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, X, ExternalLink } from 'lucide-react';

export function ShrimpChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your Shrimp Farming Assistant. I only use what you share (text, docs, images). If details are missing, I\'ll ask instead of guessing. What do you need help with?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble connecting. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const openGeminiChat = () => {
    window.open('https://gemini.google.com', '_blank');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 sm:p-4 shadow-lg hover:shadow-xl transition-all z-50"
        title="Open Shrimp Farming Assistant"
        aria-label="Open Shrimp Farming Assistant"
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-full max-w-sm sm:w-96 shadow-xl z-50 max-h-[90vh] flex flex-col">
      <CardHeader className="bg-blue-600 text-white rounded-t-lg flex flex-row items-center justify-between p-3 sm:p-4 flex-shrink-0">
        <CardTitle className="text-sm sm:text-base">🦐 Shrimp Assistant</CardTitle>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-blue-700 p-1 rounded"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4 flex-1 overflow-hidden flex flex-col">
        {/* Messages */}
        <div className="h-56 sm:h-64 overflow-y-auto space-y-3 bg-gray-50 rounded-lg p-2 sm:p-3 flex-shrink-0">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-3 py-2 rounded-lg max-w-xs text-xs sm:text-sm break-words ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-900 px-3 py-2 rounded-lg text-xs sm:text-sm">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 flex-shrink-0">
          <Input
            placeholder="Ask about farming..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="text-sm h-9 sm:h-10"
          />
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="gap-1 flex-shrink-0"
          >
            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {/* Gemini Link */}
        <Button
          variant="outline"
          size="sm"
          onClick={openGeminiChat}
          className="w-full gap-2 text-xs flex-shrink-0"
        >
          <ExternalLink className="h-3 w-3" />
          Open Gemini Chat
        </Button>

        {/* Quick Questions */}
        <div className="text-xs text-muted-foreground flex-shrink-0">
          <p className="font-semibold mb-2">Quick Questions:</p>
          <div className="flex flex-wrap gap-1">
            {[
              'FCR tips',
              'High ammonia?',
              'Disease signs',
              'Feeding schedule',
            ].map(q => (
              <Badge
                key={q}
                variant="outline"
                className="cursor-pointer hover:bg-blue-50 text-xs"
                onClick={() => {
                  setInput(q);
                  handleSendMessage();
                }}
              >
                {q}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
