"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export type Locale = 'en' | 'hi' | 'mr' | 'bn' | 'ta' | 'te' | 'kn' | 'ml';

interface LocaleContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

// ─────────────────────────────────────────────
// Translation strings — expand as needed
// ─────────────────────────────────────────────
const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  en: {
    welcome: "Welcome", login: "Login", logout: "Logout",
    dashboard: "Dashboard", warnings: "Warnings", map: "Live Map",
    chat: "VARSHA AI", community: "Community", subscribe: "Get Alerts",
    profile: "My Profile", notifications: "Notifications",
    rain_today: "Rainfall Today", people_at_risk: "People at Risk",
    ai_accuracy: "AI Accuracy", active_warnings: "Active Warnings",
    select_district: "Select Your District",
    crop_advisory: "Crop & Farm Advisory",
    evacuation: "Evacuation Routes",
    emergency: "Emergency Helplines",
  },
  hi: {
    welcome: "स्वागत", login: "लॉगिन", logout: "लॉगआउट",
    dashboard: "डैशबोर्ड", warnings: "चेतावनियां", map: "लाइव मानचित्र",
    chat: "वर्षा AI", community: "सामुदायिक", subscribe: "अलर्ट पाएं",
    profile: "मेरी प्रोफाइल", notifications: "सूचनाएं",
    rain_today: "आज की बारिश", people_at_risk: "खतरे में लोग",
    ai_accuracy: "AI सटीकता", active_warnings: "सक्रिय चेतावनियां",
    select_district: "अपना जिला चुनें",
    crop_advisory: "फसल सलाह",
    evacuation: "निकासी मार्ग",
    emergency: "आपातकालीन हेल्पलाइन",
  },
  mr: {
    welcome: "स्वागत", login: "लॉगिन", logout: "लॉगआउट",
    dashboard: "डॅशबोर्ड", warnings: "इशारे", map: "थेट नकाशा",
    chat: "वर्षा AI", community: "समुदाय", subscribe: "सावध राहा",
    profile: "माझी प्रोफाइल", notifications: "सूचना",
    rain_today: "आजचा पाऊस", people_at_risk: "धोक्यात लोक",
    ai_accuracy: "AI अचूकता", active_warnings: "सक्रिय इशारे",
    select_district: "आपला जिल्हा निवडा",
    crop_advisory: "पीक सल्ला",
    evacuation: "निर्वासन मार्ग",
    emergency: "आणीबाणी हेल्पलाइन",
  },
  bn: {
    welcome: "স্বাগতম", login: "লগইন", logout: "লগআউট",
    dashboard: "ড্যাশবোর্ড", warnings: "সতর্কবার্তা", map: "লাইভ ম্যাপ",
    chat: "বর্ষা AI", community: "সম্প্রদায়", subscribe: "সতর্কতা পান",
    profile: "আমার প্রোফাইল", notifications: "বিজ্ঞপ্তি",
    rain_today: "আজকের বৃষ্টি", people_at_risk: "ঝুঁকিতে মানুষ",
    ai_accuracy: "AI নির্ভুলতা", active_warnings: "সক্রিয় সতর্কতা",
    select_district: "আপনার জেলা নির্বাচন করুন",
    crop_advisory: "ফসল পরামর্শ",
    evacuation: "সরিয়ে নেওয়ার রাস্তা",
    emergency: "জরুরি হেল্পলাইন",
  },
  ta: {
    welcome: "வரவேற்கிறோம்", login: "உள்நுழை", logout: "வெளியேறு",
    dashboard: "டாஷ்போர்டு", warnings: "எச்சரிக்கைகள்", map: "நேரடி வரைபடம்",
    chat: "வர்ஷா AI", community: "சமூகம்", subscribe: "எச்சரிக்கை பெறுக",
    profile: "என் சுயவிவரம்", notifications: "அறிவிப்புகள்",
    rain_today: "இன்றைய மழை", people_at_risk: "ஆபத்தில் உள்ளவர்கள்",
    ai_accuracy: "AI துல்லியம்", active_warnings: "செயலில் உள்ள எச்சரிக்கைகள்",
    select_district: "உங்கள் மாவட்டத்தை தேர்ந்தெடுக்கவும்",
    crop_advisory: "பயிர் ஆலோசனை",
    evacuation: "வெளியேற்ற பாதைகள்",
    emergency: "அவசர உதவி",
  },
  te: {
    welcome: "స్వాగతం", login: "లాగిన్", logout: "లాగ్అవుట్",
    dashboard: "డాష్‌బోర్డ్", warnings: "హెచ్చరికలు", map: "లైవ్ మ్యాప్",
    chat: "వర్ష AI", community: "సమాజం", subscribe: "అలర్ట్‌లు పొందండి",
    profile: "నా ప్రొఫైల్", notifications: "నోటిఫికేషన్లు",
    rain_today: "నేటి వర్షం", people_at_risk: "ప్రమాదంలో ప్రజలు",
    ai_accuracy: "AI ఖచ్చితత్వం", active_warnings: "క్రియాశీల హెచ్చరికలు",
    select_district: "మీ జిల్లాను ఎంచుకోండి",
    crop_advisory: "పంట సలహా",
    evacuation: "తరలింపు మార్గాలు",
    emergency: "అత్యవసర హెల్ప్‌లైన్",
  },
  kn: {
    welcome: "ಸ್ವಾಗತ", login: "ಲಾಗಿನ್", logout: "ಲಾಗ್ ಔಟ್",
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", warnings: "ಎಚ್ಚರಿಕೆಗಳು", map: "ಲೈವ್ ನಕ್ಷೆ",
    chat: "ವರ್ಷ AI", community: "ಸಮುದಾಯ", subscribe: "ಎಚ್ಚರಿಕೆ ಪಡೆಯಿರಿ",
    profile: "ನನ್ನ ಪ್ರೊಫೈಲ್", notifications: "ಅಧಿಸೂಚನೆಗಳು",
    rain_today: "ಇಂದಿನ ಮಳೆ", people_at_risk: "ಅಪಾಯದಲ್ಲಿ ಜನರು",
    ai_accuracy: "AI ನಿಖರತೆ", active_warnings: "ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳು",
    select_district: "ನಿಮ್ಮ ಜಿಲ್ಲೆ ಆಯ್ಕೆಮಾಡಿ",
    crop_advisory: "ಬೆಳೆ ಸಲಹೆ",
    evacuation: "ಸ್ಥಳಾಂತರ ಮಾರ್ಗಗಳು",
    emergency: "ತುರ್ತು ಸಹಾಯವಾಣಿ",
  },
  ml: {
    welcome: "സ്വാഗതം", login: "ലോഗിൻ", logout: "ലോഗ് ഔട്ട്",
    dashboard: "ഡാഷ്‌ബോർഡ്", warnings: "മുന്നറിയിപ്പുകൾ", map: "തത്സമയ ഭൂപടം",
    chat: "വർഷ AI", community: "കമ്മ്യൂണിറ്റി", subscribe: "അലേർട്ടുകൾ നേടുക",
    profile: "എന്റെ പ്രൊഫൈൽ", notifications: "അറിയിപ്പുകൾ",
    rain_today: "ഇന്നത്തെ മഴ", people_at_risk: "അപകടത്തിലുള്ളവർ",
    ai_accuracy: "AI കൃത്യത", active_warnings: "സജീവ മുന്നറിയിപ്പുകൾ",
    select_district: "നിങ്ങളുടെ ജില്ല തിരഞ്ഞെടുക്കുക",
    crop_advisory: "വിള ഉപദേശം",
    evacuation: "ഒഴിപ്പിക്കൽ പാതകൾ",
    emergency: "അടിയന്തര ഹെൽപ്‌ലൈൻ",
  },
};

const LocaleContext = createContext<LocaleContextProps | undefined>(undefined);

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('en'); // ← ALWAYS English default

  useEffect(() => {
    // Read from localStorage ONLY after mount — default stays 'en' for first-time visitors
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('varshanetra_locale') as Locale | null;
      // Only restore if user explicitly changed it before
      if (stored && stored !== 'en') {
        setLocaleState(stored);
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('varshanetra_locale', newLocale);
    }
  };

  const t = (key: string): string => {
    return TRANSLATIONS[locale]?.[key] ?? TRANSLATIONS['en'][key] ?? key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = (): LocaleContextProps => {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within a LocaleProvider');
  return context;
};
