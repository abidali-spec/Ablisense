
export enum Tone {
  CONVERSATIONAL = 'Conversational',
  PROFESSIONAL = 'Professional',
  ACADEMIC = 'Academic',
  CREATIVE = 'Creative',
  CONCISE = 'Concise'
}

export interface TransformationResult {
  originalText: string;
  humanizedText: string;
  timestamp: number;
  language?: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'en-pk', name: 'English (Pakistan)', flag: '🇵🇰' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'sd', name: 'Sindhi', flag: '🇵🇰' },
  { code: 'pa', name: 'Punjabi', flag: '🇵🇰' },
  { code: 'ps', name: 'Pashto', flag: '🇵🇰' },
  { code: 'bal', name: 'Balochi', flag: '🇵🇰' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
];
