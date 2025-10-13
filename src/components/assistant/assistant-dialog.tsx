
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Mic, Send, Sparkles, User as UserIcon, X, Minus, MicOff } from "lucide-react";
import { assistantFlow } from "@/ai/flows/assistant-flow";
import { useUser } from "@/context/user-context";
import { useTransactions } from "@/hooks/use-database";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { useSpeech } from "@/hooks/use-speech";

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
    const { transactions: allTransactions, loading: transactionsLoading } = useTransactions();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const { speak, cancel } = useSpeech();
    const [voiceMode, setVoiceMode] = useState(false);

    const addMessage = (role: Message['role'], content: string, isThinking = false) => {
        setMessages(prev => [...prev, { role, content, isThinking }]);
        if (voiceMode && role === 'assistant' && !isThinking) {
            speak(content);
        }
    }

    const processUserInput = useCallback(async (text: string) => {
        if (!text.trim()) return;

        addMessage('user', text);
        setInputValue("");
        
        addMessage('assistant', "Thinking...", true);

        try {
            const history = messages.map(m => `${m.role}: ${m.content}`).join('\\n');
            const transactionData = JSON.stringify(allTransactions, null, 2);
            
            const response = await assistantFlow({ utterance: text, history, user, transactionData });
            
            setMessages(prev => {
                const newMessages = [...prev];
                const thinkingMessageIndex = newMessages.findIndex(m => m.isThinking);
                if (thinkingMessageIndex !== -1) {
                    newMessages[thinkingMessageIndex] = { role: 'assistant', content: response.answer };
                }
                if (voiceMode) speak(response.answer);
                return newMessages;
            });

        } catch (error) {
            console.error("Assistant flow error:", error);
            const errorMessage = "Sorry, I encountered an issue. Please try again.";
             setMessages(prev => {
                const newMessages = [...prev];
                const thinkingMessageIndex = newMessages.findIndex(m => m.isThinking);
                if (thinkingMessageIndex !== -1) {
                    newMessages[thinkingMessageIndex] = { role: 'assistant', content: errorMessage };
                } else {
                    newMessages.push({ role: 'assistant', content: errorMessage });
                }
                if (voiceMode) speak(errorMessage);
                return newMessages;
            });
        }
    }, [messages, user, speak, voiceMode, allTransactions]);

    useEffect(() => {
        if (isOpen) {
            const welcomeMessage = `Hi ${user}! How can I help you manage your finances today?`;
            setMessages([{ role: 'assistant', content: welcomeMessage }]);
            if (voiceMode) {
                speak(welcomeMessage);
            }
        } else {
            cancel(); // Stop speaking if dialog is closed
        }
    }, [isOpen, user, speak, cancel, voiceMode]);
    
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
             if (finalTranscript) {
                processUserInput(finalTranscript);
            }
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };
        
        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        return () => recognitionRef.current?.abort();
    }, [processUserInput]);

    const toggleListening = () => {
        if (!voiceMode) setVoiceMode(true);
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            cancel(); // Stop any current speech synthesis
            setInputValue('');
            recognitionRef.current?.start();
        }
        setIsListening(!isListening);
    };

    const handleSend = () => {
        setVoiceMode(false);
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
                            disabled={!SpeechRecognition}
                        >
                            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                        <Button onClick={handleSend} type="button" disabled={transactionsLoading}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
