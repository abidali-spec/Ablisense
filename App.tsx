
import React, { useState, useEffect, useRef } from 'react';
import { Tone, TransformationResult, SUPPORTED_LANGUAGES } from './types';
import { humanizeText, extractTextFromImage, fixSpellingAndGrammar } from './services/geminiService';
import { ToneSelector } from './components/ToneSelector';
import { CameraScanner } from './components/CameraScanner';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [selectedTone, setSelectedTone] = useState<Tone>(Tone.CONVERSATIONAL);
  const [selectedLang, setSelectedLang] = useState(SUPPORTED_LANGUAGES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpellingLoading, setIsSpellingLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TransformationResult[]>([]);
  
  const recognitionRef = useRef<any>(null);

  const isRTL = ['ur', 'sd', 'ar', 'ps', 'bal'].includes(selectedLang.code);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      setError("Voice input not supported on this device.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setError(null);
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleTransform = async () => {
    if (!inputText.trim()) return setError('Please enter some text first.');
    setIsLoading(true);
    setError(null);
    try {
      const result = await humanizeText(inputText, selectedTone, selectedLang.name);
      setOutputText(result);
      setHistory(prev => [{
        originalText: inputText,
        humanizedText: result,
        timestamp: Date.now(),
        language: selectedLang.name
      }, ...prev].slice(0, 5));
      
      // Auto-scroll to result on mobile
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixSpelling = async () => {
    if (!inputText.trim()) return;
    setIsSpellingLoading(true);
    try {
      const fixed = await fixSpellingAndGrammar(inputText);
      setInputText(fixed);
    } catch(e) {
      setError("Grammar fix failed.");
    } finally {
      setIsSpellingLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Use a native-like feedback if possible, or simple alert
    const btn = document.activeElement as HTMLElement;
    const originalText = btn.innerText;
    btn.innerText = "COPIED!";
    setTimeout(() => { if(btn) btn.innerText = originalText; }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-2xl mx-auto pb-10">
      {isScanning && (
        <CameraScanner 
          onCapture={async (img) => {
            setIsScanning(false);
            setIsLoading(true);
            try {
              const text = await extractTextFromImage(img);
              if (text) setInputText(prev => prev ? `${prev}\n\n${text}` : text);
            } catch(e:any) { 
              setError(e.message); 
            } finally { 
              setIsLoading(false); 
            }
          }} 
          onClose={() => setIsScanning(false)} 
        />
      )}

      {/* App Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 leading-none">Humanize <span className="text-indigo-600">AI</span></h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Ablisense Global</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setInputText('')} className="p-2 text-slate-400 hover:text-slate-600">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
             </svg>
           </button>
        </div>
      </header>

      <main className="p-4 space-y-6 flex-1">
        {/* Language Selection - Horizontal Scroll */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Output Language</span>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all active:scale-95 ${
                  selectedLang.code === lang.code 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'bg-white text-slate-600 border border-slate-100'
                }`}
              >
                <span>{lang.flag}</span> {lang.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tone Selector */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Select Style</span>
          <ToneSelector selectedTone={selectedTone} onSelect={setSelectedTone} />
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-slate-50">
             <span className="text-[10px] font-bold text-slate-400 uppercase">Input text</span>
             <div className="flex gap-1">
                <button onClick={() => setIsScanning(true)} className="p-2 bg-slate-50 rounded-xl active:bg-slate-100 transition-colors">
                  <span className="text-lg">📷</span>
                </button>
                <button onClick={toggleVoiceInput} className={`p-2 rounded-xl transition-colors ${isListening ? 'bg-red-500 animate-pulse text-white' : 'bg-slate-50'}`}>
                  <span className="text-lg">🎤</span>
                </button>
                <button 
                  onClick={handleFixSpelling} 
                  disabled={isSpellingLoading || !inputText.trim()} 
                  className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-xl border border-emerald-100 uppercase disabled:opacity-30"
                >
                  {isSpellingLoading ? '...' : '✨ Fix'}
                </button>
             </div>
          </div>
          <textarea
            className="w-full min-h-[180px] p-5 focus:ring-0 border-none text-base font-medium text-slate-700 placeholder:text-slate-300 resize-none bg-transparent"
            placeholder="Paste your AI-generated content here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>

        {/* Primary Action Button */}
        <button 
          onClick={handleTransform} 
          disabled={isLoading || !inputText.trim()}
          className="w-full py-5 rounded-[24px] bg-indigo-600 text-white font-black text-lg shadow-2xl shadow-indigo-200 active:scale-95 transition-all disabled:opacity-40 disabled:shadow-none relative overflow-hidden"
        >
          {isLoading ? (
             <div className="flex items-center justify-center gap-3">
               <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
               <span>HUMANIZING...</span>
             </div>
          ) : (
            <span>{selectedLang.code === 'en' ? 'HUMANIZE NOW' : `CONVERT TO ${selectedLang.name.toUpperCase()}`}</span>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 text-center animate-bounce">
            ⚠️ {error}
          </div>
        )}

        {/* Output Card */}
        {(outputText || isLoading) && (
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 flex items-center justify-between border-b border-slate-50">
               <span className="text-[10px] font-bold text-indigo-600 uppercase">Humanized Version</span>
               {outputText && !isLoading && (
                 <button 
                   onClick={() => copyToClipboard(outputText)} 
                   className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-xl active:bg-indigo-100 transition-colors uppercase"
                 >
                   Copy Result
                 </button>
               )}
            </div>
            <div 
              dir={isRTL ? 'rtl' : 'ltr'}
              className="p-5 min-h-[150px] relative"
            >
              {isLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-100 rounded w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                </div>
              ) : (
                <p className="text-slate-800 leading-relaxed text-base font-medium whitespace-pre-wrap">
                  {outputText}
                </p>
              )}
            </div>
          </div>
        )}

        {/* History Section */}
        {history.length > 0 && (
          <div className="pt-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-4 px-2 tracking-widest">Recent History</h3>
            <div className="space-y-3">
              {history.map((item, i) => (
                <div 
                  key={i} 
                  className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm active:scale-[0.98] transition-transform"
                  onClick={() => {
                    setInputText(item.originalText);
                    setOutputText(item.humanizedText);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                      {item.language || 'English'}
                    </span>
                    <span className="text-[9px] text-slate-300 font-bold">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs line-clamp-2 font-medium italic">"{item.humanizedText}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-10 text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center">
        &copy; {new Date().getFullYear()} Humanize AI <br/>
        <span className="text-slate-300 font-normal">Created by Ablisense Global</span>
      </footer>
    </div>
  );
};

export default App;
