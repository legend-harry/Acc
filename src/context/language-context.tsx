'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';

export type SupportedLanguage = 'en' | 'te' | 'hi' | 'ta' | 'mr' | 'kn' | 'bn';

export const SUPPORTED_LANGUAGES: Array<{ code: SupportedLanguage; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'Telugu' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'mr', label: 'Marathi' },
  { code: 'kn', label: 'Kannada' },
  { code: 'bn', label: 'Bengali' },
];

type LanguageContextType = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (text: string) => string;
  translateText: (text: string, options?: { html?: boolean }) => Promise<string>;
  translateBatch: (texts: string[], options?: { html?: boolean }) => Promise<string[]>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const translationCache = new Map<string, string>();
const TRANSLATION_CACHE_KEY = 'translation-cache-v1';

const frequentWordDictionary: Record<string, Partial<Record<SupportedLanguage, string>>> = {
  Language: { te: 'భాష', hi: 'भाषा', ta: 'மொழி', mr: 'भाषा', kn: 'ಭಾಷೆ', bn: 'ভাষা' },
  Home: { te: 'హోమ్', hi: 'होम', ta: 'முகப்பு', mr: 'मुख्यपृष्ठ', kn: 'ಮುಖಪುಟ', bn: 'হোম' },
  'Cash Flow': { te: 'నగదు ప్రవాహం', hi: 'नकदी प्रवाह', ta: 'பணப் போக்கு', mr: 'रोख प्रवाह', kn: 'ನಗದು ಪ್ರವಾಹ', bn: 'নগদ প্রবাহ' },
  Budget: { te: 'బడ్జెట్', hi: 'बजट', ta: 'பட்ஜெட்', mr: 'अंदाजपत्रक', kn: 'ಬಜೆಟ್', bn: 'বাজেট' },
  Manage: { te: 'నిర్వహణ', hi: 'प्रबंधन', ta: 'மேலாண்மை', mr: 'व्यवस्थापन', kn: 'ನಿರ್ವಹಣೆ', bn: 'ব্যবস্থাপনা' },
  Reports: { te: 'రిపోర్టులు', hi: 'रिपोर्ट्स', ta: 'அறிக்கைகள்', mr: 'अहवाल', kn: 'ವರದಿಗಳು', bn: 'রিপোর্ট' },
  Aqua: { te: 'ఆక్వా', hi: 'एक्वा', ta: 'அக்வா', mr: 'अक्वा', kn: 'ಅಕ್ವಾ', bn: 'অ্যাকুয়া' },
  Appearance: { te: 'దృశ్యం', hi: 'दिखावट', ta: 'தோற்றம்', mr: 'दृश्य', kn: 'ರೂಪ', bn: 'দেখন' },
  Light: { te: 'లైట్', hi: 'लाइट', ta: 'ஒளி', mr: 'लाइट', kn: 'ಬೆಳಕು', bn: 'লাইট' },
  Dark: { te: 'డార్క్', hi: 'डार्क', ta: 'இருள்', mr: 'डार्क', kn: 'ಡಾರ್ಕ್', bn: 'ডার্ক' },
  System: { te: 'సిస్టమ్', hi: 'सिस्टम', ta: 'அமைப்பு', mr: 'सिस्टम', kn: 'ಸಿಸ್ಟಮ್', bn: 'সিস্টেম' },
  'Special Theme': { te: 'ప్రత్యేక థీమ్', hi: 'स्पेशल थीम', ta: 'சிறப்பு தீம்', mr: 'विशेष थीम', kn: 'ವಿಶೇಷ ಥೀಮ್', bn: 'বিশেষ থিম' },
  'Add Transaction': { te: 'లావాదేవీ జోడించండి', hi: 'लेनदेन जोड़ें', ta: 'பரிவர்த்தனை சேர்க்க', mr: 'व्यवहार जोडा', kn: 'ವಹಿವಾಟು ಸೇರಿಸಿ', bn: 'লেনদেন যোগ করুন' },
  'Search data...': { te: 'డేటా వెతకండి...', hi: 'डेटा खोजें...', ta: 'தரவைத் தேடுங்கள்...', mr: 'डेटा शोधा...', kn: 'ಡೇಟಾ ಹುಡುಕಿ...', bn: 'ডেটা খুঁজুন...' },
  'Search transactions...': { te: 'లావాదేవీలు వెతకండి...', hi: 'लेनदेन खोजें...', ta: 'பரிவர்த்தனைகளைத் தேடுங்கள்...', mr: 'व्यवहार शोधा...', kn: 'ವಹಿವಾಟು ಹುಡುಕಿ...', bn: 'লেনদেন খুঁজুন...' },
  'All Projects': { te: 'అన్ని ప్రాజెక్టులు', hi: 'सभी प्रोजेक्ट', ta: 'அனைத்து திட்டங்கள்', mr: 'सर्व प्रकल्प', kn: 'ಎಲ್ಲಾ ಯೋಜನೆಗಳು', bn: 'সব প্রকল্প' },
  'Select a Project': { te: 'ఒక ప్రాజెక్ట్ ఎంచుకోండి', hi: 'एक प्रोजेक्ट चुनें', ta: 'ஒரு திட்டத்தை தேர்ந்தெடுக்கவும்', mr: 'प्रकल्प निवडा', kn: 'ಒಂದು ಯೋಜನೆಯನ್ನು ಆರಿಸಿ', bn: 'একটি প্রকল্প নির্বাচন করুন' },
  'Switch Project': { te: 'ప్రాజెక్ట్ మార్చండి', hi: 'प्रोजेक्ट बदलें', ta: 'திட்டத்தை மாற்று', mr: 'प्रकल्प बदला', kn: 'ಯೋಜನೆ ಬದಲಿಸಿ', bn: 'প্রকল্প বদলান' },
  'Profile & Settings': { te: 'ప్రొఫైల్ & సెట్టింగ్స్', hi: 'प्रोफाइल और सेटिंग्स', ta: 'சுயவிவரம் & அமைப்புகள்', mr: 'प्रोफाइल आणि सेटिंग्स', kn: 'ಪ್ರೊಫೈಲ್ & ಸೆಟ್ಟಿಂಗ್ಗಳು', bn: 'প্রোফাইল ও সেটিংস' },
};

function getCacheKey(language: SupportedLanguage, textType: 'plain' | 'html', text: string) {
  return `${language}:${textType}:${text}`;
}

function hydrateCacheFromStorage() {
  if (typeof window === 'undefined') {
    return;
  }
  const raw = window.localStorage.getItem(TRANSLATION_CACHE_KEY);
  if (!raw) {
    return;
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    Object.entries(parsed).forEach(([key, value]) => translationCache.set(key, value));
  } catch {
    // Ignore corrupted cache and continue
  }
}

function persistCacheToStorage() {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const serialized = JSON.stringify(Object.fromEntries(translationCache));
    window.localStorage.setItem(TRANSLATION_CACHE_KEY, serialized);
  } catch {
    // Ignore quota/storage errors
  }
}

function isTextWorthTranslating(text: string) {
  const trimmed = text.trim();
  return trimmed.length > 0 && /\p{L}/u.test(trimmed);
}

function shouldSkipElement(element: Element) {
  return element.closest('[data-no-translate],script,style,noscript,svg,textarea,input,select,option,code,pre,kbd,samp') !== null;
}

const originalTextCache = new WeakMap<Text, string>();
const originalAttributeCache = new WeakMap<Element, Map<string, string>>();

function isSupportedLanguage(value: string): value is SupportedLanguage {
  return SUPPORTED_LANGUAGES.some((language) => language.code === value);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const translationRunId = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedLanguage = window.localStorage.getItem('app-language');
    if (storedLanguage && isSupportedLanguage(storedLanguage)) {
      setLanguageState(storedLanguage);
    }

    hydrateCacheFromStorage();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('app-language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr';
  }, [language]);

  const t = useCallback((text: string) => {
    if (language === 'en') {
      return text;
    }
    const dictionaryTranslation = frequentWordDictionary[text]?.[language];
    const cacheKey = getCacheKey(language, 'plain', text);
    const cachedTranslation = translationCache.get(cacheKey);

    const translatedText = dictionaryTranslation ?? cachedTranslation;
    if (!translatedText) {
      return text;
    }

    if (!cachedTranslation) {
      translationCache.set(cacheKey, translatedText);
      persistCacheToStorage();
    }
    return translatedText;
  }, [language]);

  const translateBatch = useCallback(async (texts: string[], options?: { html?: boolean }) => {
    if (language === 'en') {
      return texts;
    }

    const textType = options?.html ? 'html' : 'plain';
    const fallbackFromDictionary = (text: string) => {
      if (textType !== 'plain') {
        return undefined;
      }
      return frequentWordDictionary[text]?.[language];
    };

    const results = texts.map((text) => {
      const cacheKey = getCacheKey(language, textType, text);
      return translationCache.get(cacheKey) ?? fallbackFromDictionary(text);
    });

    const missingTexts = texts.filter((text, index) => !results[index]);
    const missingIndexes = texts
      .map((text, index) => (!results[index] ? index : -1))
      .filter((index) => index >= 0);

    if (missingTexts.length > 0) {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: missingTexts,
          to: language,
          textType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation request failed with status ${response.status}`);
      }

      const data = (await response.json()) as { translations?: string[] };
      const translatedTexts = data.translations ?? missingTexts;

      missingIndexes.forEach((originalIndex, translatedIndex) => {
        const translatedText = translatedTexts[translatedIndex] ?? texts[originalIndex];
        const cacheKey = getCacheKey(language, textType, texts[originalIndex]);
        translationCache.set(cacheKey, translatedText);
        results[originalIndex] = translatedText;
      });

      persistCacheToStorage();
    }

    return results.map((text, index) => text ?? texts[index]);
  }, [language]);

  const translateText = useCallback(async (text: string, options?: { html?: boolean }) => {
    const [translatedText] = await translateBatch([text], options);
    return translatedText ?? text;
  }, [translateBatch]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    let disposed = false;
    let debounceTimer: number | undefined;

    const translateDom = async () => {
      if (disposed) {
        return;
      }

      const elements = Array.from(document.body.querySelectorAll('*')).filter((element) => !shouldSkipElement(element));
      const textNodes: Array<{ node: Text; original: string }> = [];
      const textValues: string[] = [];

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let currentNode = walker.nextNode();
      while (currentNode) {
        const textNode = currentNode as Text;
        const parentElement = textNode.parentElement;

        if (parentElement && !shouldSkipElement(parentElement)) {
          const originalText = originalTextCache.get(textNode) ?? textNode.nodeValue ?? '';
          if (!originalTextCache.has(textNode)) {
            originalTextCache.set(textNode, originalText);
          }

          if (isTextWorthTranslating(originalText)) {
            textNodes.push({ node: textNode, original: originalText });
            textValues.push(originalText);
          }
        }

        currentNode = walker.nextNode();
      }

      const elementsWithAttributes: Array<{ element: Element; attribute: 'placeholder' | 'title' | 'aria-label' | 'alt'; original: string }> = [];
      const attributeValues: string[] = [];

      elements.forEach((element) => {
        (['placeholder', 'title', 'aria-label', 'alt'] as const).forEach((attribute) => {
          const value = element.getAttribute(attribute);
          if (!value || !isTextWorthTranslating(value)) {
            return;
          }

          let cachedAttributes = originalAttributeCache.get(element);
          if (!cachedAttributes) {
            cachedAttributes = new Map();
            originalAttributeCache.set(element, cachedAttributes);
          }

          if (!cachedAttributes.has(attribute)) {
            cachedAttributes.set(attribute, value);
          }

          elementsWithAttributes.push({ element, attribute, original: cachedAttributes.get(attribute) ?? value });
          attributeValues.push(cachedAttributes.get(attribute) ?? value);
        });
      });

      if (textValues.length === 0 && attributeValues.length === 0) {
        return;
      }

      const translatedTextValues = textValues.length > 0 ? await translateBatch(textValues) : [];
      const translatedAttributeValues = attributeValues.length > 0 ? await translateBatch(attributeValues) : [];

      if (disposed) {
        return;
      }

      translationRunId.current += 1;

      textNodes.forEach(({ node, original }, index) => {
        const translated = translatedTextValues[index] ?? original;
        if (node.nodeValue !== translated) {
          node.nodeValue = translated;
        }
      });

      elementsWithAttributes.forEach(({ element, attribute, original }, index) => {
        const translated = translatedAttributeValues[index] ?? original;
        if (element.getAttribute(attribute) !== translated) {
          element.setAttribute(attribute, translated);
        }
      });
    };

    const scheduleTranslateDom = () => {
      if (disposed) {
        return;
      }

      if (debounceTimer !== undefined) {
        window.clearTimeout(debounceTimer);
      }

      debounceTimer = window.setTimeout(() => {
        void translateDom();
      }, 120);
    };

    scheduleTranslateDom();

    const observer = new MutationObserver(() => scheduleTranslateDom());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });

    return () => {
      disposed = true;
      if (debounceTimer !== undefined) {
        window.clearTimeout(debounceTimer);
      }
      observer.disconnect();
    };
  }, [language, translateBatch]);

  const value = useMemo<LanguageContextType>(() => ({
    language,
    setLanguage: setLanguageState,
    t,
    translateText,
    translateBatch,
  }), [language, t, translateBatch, translateText]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
}
