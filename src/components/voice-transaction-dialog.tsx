
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
  const { projects, loading: projectsLoading } = useProjects();
  const { categories, loading: categoriesLoading } = useCategories();

  const [isListening, setIsListening] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("Let's start with the transaction details. What was it for?");
  const [transcript, setTranscript] = useState("");
  const [transactionState, setTransactionState] = useState<Record<string, any>>({});
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const recognitionRef = useRef<any>(null);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setIsListening(false);
      setCurrentQuestion("Let's start with the transaction details. What was it for?");
      setTranscript("");
      setTransactionState({});
      setConversationHistory([]);
      setIsProcessing(false);
      setIsComplete(false);
      setTimeout(() => speak(currentQuestion), 300);
    } else {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        window.speechSynthesis.cancel();
    }
  }, [isOpen, speak]);
  
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

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const finalTranscript = event.results[i][0].transcript;
          setTranscript(finalTranscript);
          stopListening();
          processTranscript(finalTranscript);
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
    };
    
    recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        stopListening();
    };

    recognition.onend = () => {
        setIsListening(false);
    };

    return () => {
        if (recognition) {
            recognition.stop();
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
    setIsListening(false);
    recognitionRef.current.stop();
  };

  const processTranscript = async (text: string) => {
      if (!text.trim()) return;
      setIsProcessing(true);
      
      const availableProjectNames = projects.map(p => p.name);
      
      try {
          const result = await extractTransactionDetails({
              currentState: transactionState,
              availableProjects: availableProjectNames,
              availableCategories: categories,
              utterance: text,
              conversationHistory: conversationHistory
          });

          setTransactionState(result.updatedState);
          setCurrentQuestion(result.nextQuestion);
          setConversationHistory(prev => [...prev, currentQuestion]);
          
          if (result.nextQuestion.includes("I have all the details")) {
              setIsComplete(true);
              speak("I have all the details. Please review the form and save.");
          } else {
              speak(result.nextQuestion);
          }
      } catch (e) {
          console.error("AI processing error", e);
          speak("Sorry, I had trouble understanding that. Could you please repeat?");
      } finally {
          setIsProcessing(false);
          setTranscript("");
      }
  };
  
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
