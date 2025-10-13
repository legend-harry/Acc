
"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

export function useSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (!text || !text.trim() || !synthRef.current) return;
        
        // Cancel any ongoing speech
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance.onerror', event);
            setIsSpeaking(false);
        };

        synthRef.current.speak(utterance);
    }, []);

    const cancel = useCallback(() => {
        if (synthRef.current?.speaking) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    }, []);

    return { isSpeaking, speak, cancel };
}
