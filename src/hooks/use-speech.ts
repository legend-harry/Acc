
"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

export function useSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
            const updateVoices = () => {
                const availableVoices = synthRef.current?.getVoices() || [];
                setVoices(availableVoices);
                
                // Find a soft, female, English voice
                const femaleVoice = availableVoices.find(voice => 
                    voice.lang.startsWith('en') && 
                    voice.name.includes('Female')
                ) || availableVoices.find(voice => voice.lang.startsWith('en') && voice.name.includes('Google') && !voice.name.includes('Male')) 
                   || availableVoices.find(voice => voice.lang.startsWith('en')) 
                   || null;
                   
                setSelectedVoice(femaleVoice);
            };

            updateVoices();
            if (synthRef.current?.onvoiceschanged !== undefined) {
                synthRef.current.onvoiceschanged = updateVoices;
            }
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (!text || !text.trim() || !synthRef.current) return;
        
        // Cancel any ongoing speech
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance.onerror', event.error);
            setIsSpeaking(false);
        };

        synthRef.current.speak(utterance);
    }, [selectedVoice]);

    const cancel = useCallback(() => {
        if (synthRef.current?.speaking) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    }, []);

    return { isSpeaking, speak, cancel };
}

    