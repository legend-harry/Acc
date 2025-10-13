
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Mic, MicOff, Send, Sparkles, User as UserIcon } from "lucide-react";
import { assistantFlow } from "@/ai/flows/assistant-flow";
import { useUser } from "@/context/user-context";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";

type Message = {
    role: 'user' | 'assistant' | 'system';
    content: string;
    isThinking?: boolean;
}

// Browser Speech API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;


export function AssistantDialog({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const { user } = useUser();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);


    const addMessage = (role: Message['role'], content: string) => {
        setMessages(prev => [...prev, { role, content }]);
    }

    const processUserInput = useCallback(async (text: string) => {
        if (!text.trim()) return;

        addMessage('user', text);
        setInputValue("");
        
        setMessages(prev => [...prev, { role: 'assistant', content: "Thinking...", isThinking: true }]);

        try {
            const history = messages.map(m => `${m.role}: ${m.content}`).join('\n');
            const response = await assistantFlow({ utterance: text, history, user });
            
            setMessages(prev => {
                const newMessages = [...prev];
                const thinkingMessageIndex = newMessages.findIndex(m => m.isThinking);
                if (thinkingMessageIndex !== -1) {
                    newMessages[thinkingMessageIndex] = { role: 'assistant', content: response.answer };
                }
                return newMessages;
            });

        } catch (error) {
            console.error("Assistant flow error:", error);
            const errorMessage = "Sorry, I encountered an error. Please try again.";
             setMessages(prev => {
                const newMessages = [...prev];
                const thinkingMessageIndex = newMessages.findIndex(m => m.isThinking);
                if (thinkingMessageIndex !== -1) {
                    newMessages[thinkingMessageIndex] = { role: 'assistant', content: errorMessage };
                } else {
                    newMessages.push({ role: 'assistant', content: errorMessage });
                }
                return newMessages;
            });
        }
    }, [messages, user]);

    useEffect(() => {
        if (isOpen) {
            setMessages([{ role: 'assistant', content: `Hi ${user}! How can I help you manage your finances today?` }]);
        }
    }, [isOpen, user]);
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);
    
    // --- Speech Recognition Logic ---
    useEffect(() => {
        if (!SpeechRecognition) return;

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setInputValue(interimTranscript + finalTranscript);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };
        
        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        return () => recognitionRef.current?.abort();
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setInputValue('');
            recognitionRef.current?.start();
        }
        setIsListening(!isListening);
    };

    const handleSend = () => {
        processUserInput(inputValue);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>AI Assistant</DialogTitle>
                    <DialogDescription>Your personal finance copilot.</DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
                    <div className="space-y-6">
                        {messages.map((msg, index) => (
                            <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' && 'justify-end')}>
                                {msg.role === 'assistant' && (
                                    <Avatar className="bg-primary/20 text-primary">
                                        <AvatarFallback><Sparkles className="h-5 w-5" /></AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "p-3 rounded-lg max-w-lg",
                                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                )}>
                                    {msg.isThinking ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                                        </div>
                                    ) : (
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                     <Avatar>
                                        <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                
                <DialogFooter className="p-4 border-t">
                    <div className="flex w-full items-center gap-2">
                        <Input 
                            placeholder="Type a message or use the mic..." 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <Button
                            size="icon"
                            variant={isListening ? "destructive" : "outline"}
                            onClick={toggleListening}
                            type="button"
                        >
                            {isListening ? <MicOff /> : <Mic />}
                        </Button>
                        <Button onClick={handleSend} type="button">
                            <Send />
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
