
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send } from "lucide-react";
import { useProjects, useCategories } from "@/hooks/use-database";
import { extractTransactionDetails, type ExtractTransactionDetailsInput, type ExtractTransactionDetailsOutput } from "@/ai/flows/extract-transaction-details";
import { Skeleton } from "./ui/skeleton";
import { z } from 'zod';
import { useUser } from "@/context/user-context";


interface VoiceTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDataFilled: (data: Record<string, any>) => void;
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

export function VoiceTransactionDialog({
  isOpen,
  onOpenChange,
  onDataFilled,
}: VoiceTransactionDialogProps) {
  const { user } = useUser();
  const { projects, loading: projectsLoading } = useProjects();
  const { categories, loading: categoriesLoading } = useCategories();

  const [isListening, setIsListening] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [transcript, setTranscript] = useState("");
  const [transactionState, setTransactionState] = useState<Record<string, any>>({});
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const recognitionRef = useRef<any>(null);
  const femaleVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    
    // Cancel any previous speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);

    // Find and set a female voice
    if (femaleVoiceRef.current) {
        utterance.voice = femaleVoiceRef.current;
    }

    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    const loadVoices = () => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            const femaleVoice = voices.find(
                voice => voice.name.includes('Female') && voice.lang.startsWith('en')
            ) || voices.find(
                voice => voice.lang.startsWith('en-US') || voice.lang.startsWith('en-GB')
            ) || null;
            femaleVoiceRef.current = femaleVoice;
        }
    };
    
    // Voices are loaded asynchronously
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices(); // Initial check
    }
  }, []);

  useEffect(() => {
    const initialGreeting = `Hello ${user}! I am your Finance Assistant. How may I help you?`;
    if (isOpen) {
      // Reset state when dialog opens
      setIsListening(false);
      setCurrentQuestion(initialGreeting);
      setTranscript("");
      setTransactionState({});
      setConversationHistory([initialGreeting]); // Start with initial greeting in history
      setIsProcessing(false);
      setIsComplete(false);
      setTimeout(() => speak(initialGreeting), 300);
    } else {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
        window.speechSynthesis.cancel();
    }
  }, [isOpen, speak, user]);
  
  useEffect(() => {
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser.");
      return;
    }
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(interimTranscript || finalTranscript);
    };
    
    recognition.onerror = (event: any) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
            console.error("Speech recognition error", event.error);
        }
        setIsListening(false);
    };

    recognition.onend = () => {
        setIsListening(false);
        if (finalTranscript) {
          processTranscript(finalTranscript);
          finalTranscript = '';
        }
    };

    return () => {
        if (recognition) {
            recognition.abort();
        }
    }
  }, []);

  const startListening = () => {
    if (isListening || !recognitionRef.current) return;
    setTranscript("");
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!isListening || !recognitionRef.current) return;
    recognitionRef.current.stop();
  };

  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    
    const availableProjectNames = projects.map(p => p.name);
    
    // Create a new history array for this specific call
    const currentHistory = [...conversationHistory, currentQuestion];

    try {
      const result = await extractTransactionDetails({
        currentState: transactionState,
        availableProjects: availableProjectNames,
        availableCategories: categories,
        utterance: text,
        conversationHistory: currentHistory
      });

      setTransactionState(result.updatedState);
      // Append the question we just asked AND the new question to the history
      setConversationHistory(prev => [...prev, currentQuestion, result.nextQuestion]);
      setCurrentQuestion(result.nextQuestion);
      
      if (result.nextQuestion.includes("I have all the details")) {
        setIsComplete(true);
        speak("I have all the details. Please review the form and save.");
      } else {
        speak(result.nextQuestion);
      }
    } catch (e) {
      console.error("AI processing error", e);
      const errorQuestion = "Sorry, I had trouble understanding that. Could you please repeat?";
      setCurrentQuestion(errorQuestion);
      setConversationHistory(prev => [...prev, currentQuestion, errorQuestion]);
      speak(errorQuestion);
    } finally {
      setIsProcessing(false);
      setTranscript("");
    }
  }, [transactionState, projects, categories, conversationHistory, currentQuestion, speak]);
  
  const handleFinalize = () => {
      const project = projects.find(p => p.name === transactionState.project);
      onDataFilled({
          ...transactionState,
          projectId: project?.id,
          date: transactionState.date || new Date().toISOString().split("T")[0]
      });
  };

  const loading = projectsLoading || categoriesLoading;

  if (loading) {
      return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Loading AI Assistant...</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </DialogContent>
        </Dialog>
      )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction by Voice</DialogTitle>
          <DialogDescription>
            Answer the questions to add your transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="py-8 text-center space-y-6">
            <p className="text-xl font-medium">{currentQuestion}</p>
            
            <div className="h-10 text-muted-foreground italic">
                {isListening ? (transcript || "Listening...") : (transcript || "...")}
            </div>

            <Button 
                size="icon" 
                className={`h-16 w-16 rounded-full ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-primary'}`}
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing || isComplete}
            >
                {isListening ? <MicOff /> : <Mic />}
            </Button>
        </div>
        
        {isComplete && (
            <DialogFooter>
                <Button onClick={handleFinalize} className="w-full">
                    Confirm and Fill Form
                </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
