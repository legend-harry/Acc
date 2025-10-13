"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Mic, Send, Sparkles, User as UserIcon, X, Minus } from "lucide-react";
import { assistantFlow } from "@/ai/flows/assistant-flow";
import { useUser } from "@/context/user-context";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

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
    const [isExpanded, setIsExpanded] = useState(true);

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
            const errorMessage = "Thinking for a better answer...";
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
        if (scrollAreaRef.current && isExpanded) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isExpanded]);
    
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }
    
    if (!isOpen) return null;

    return (
        <div className={cn(
            "fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out",
            isExpanded ? "w-[440px] h-[70vh]" : "w-[440px] h-auto"
        )}>
            <Card className="h-full flex flex-col shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                    <div onClick={() => setIsExpanded(true)} className="cursor-pointer">
                        <CardTitle>AI Assistant</CardTitle>
                        <CardDescription>Your personal finance copilot.</CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpanded(!isExpanded)}>
                            <Minus className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                
                {isExpanded ? (
                    <>
                        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
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
                    </>
                ) : (
                    <CardContent className="p-4" onClick={() => setIsExpanded(true)}>
                         <p className="text-sm text-muted-foreground truncate">
                           {messages[messages.length - 1].content}
                        </p>
                    </CardContent>
                )}
                
                <CardFooter className="p-4 border-t">
                    <div className="flex w-full items-center gap-2">
                        <Input 
                            placeholder="Type a message..." 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onClick={() => !isExpanded && setIsExpanded(true)}
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
                </CardFooter>
            </Card>
        </div>
    )
}
