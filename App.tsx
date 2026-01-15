
import React, { useState, useEffect, useRef } from 'react';
import { Tone, TransformationResult, SUPPORTED_LANGUAGES, Language } from './types';
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
  const [showInfo, setShowInfo] = useState(false);
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

  const clearAll = () => {
    if (confirm("Clear all text and history?")) {
      setInputText('');
      setOutputText('');
      setHistory([]);
      setError(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-10">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl">✨</div>
                <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Why Humanize AI?</h2>
                <p className="text-slate-500 mt-2 leading-relaxed">
                  We turn robotic AI drafts into natural, undetectable writing. Our <b>Cultural Engine</b> ensures your text sounds authentic in Urdu, Sindhi, Pashto, and more.
                </p>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-4">
                  <div className="text-indigo-600 font-bold">01.</div>
                  <div className="text-sm font-semibold text-slate-700">Bypass AI Detectors effortlessly.</div>
                </li>
                <li className="flex gap-4">
                  <div className="text-indigo-600 font-bold">02.</div>
                  <div className="text-sm font-semibold text-slate-700">12+ Global & Local Languages supported.</div>
                </li>
                <li className="flex gap-4">
                  <div className="text-indigo-600 font-bold">03.</div>
                  <div className="text-sm font-semibold text-slate-700">OCR & Voice input for hands-free editing.</div>
                </li>
              </ul>
              <button 
                onClick={() => setShowInfo(false)}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100"
              >
                Let's Start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div onClick={() => setShowInfo(true)} className="cursor-pointer">
          <h1 className="text-xl font-black text-slate-900 leading-none">Humanize <span className="text-indigo-600">AI</span></h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Ablisense.ai</p>
        </div>
        <div className="flex gap-1 items-center">
           <button onClick={() => setShowInfo(true)} className="px-2 text-indigo-600 font-bold text-sm">
             About
           </button>
           <button 
             onClick={clearAll} 
             title="Clear All"
             className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
             </svg>
           </button>
        </div>
      </header>

      <main className="p-4 space-y-6 flex-1">
        {/* Intro Hero Section for New Users */}
        {inputText === '' && !outputText && history.length === 0 && (
          <div className="px-2 py-4 space-y-1 text-center">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Make it <span className="text-indigo-600 underline decoration-indigo-200 decoration-4">Personal.</span></h2>
            <p className="text-base text-slate-500 font-medium">Transform robotic drafts into human stories.</p>
          </div>
        )}

        {/* Centralized Language Selection - Grid Style */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between px-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Target Language</span>
             <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase">{selectedLang.name}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang)}
                className={`flex items-center gap-2 px-3 py-3 rounded-2xl text-[11px] font-bold transition-all active:scale-95 border ${
                  selectedLang.code === lang.code 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                  : 'bg-slate-50 text-slate-600 border-transparent hover:border-slate-200'
                }`}
              >
                <span className="text-lg leading-none">{lang.flag}</span>
                <span className="truncate">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tone Selector */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-4">Writing Style</span>
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
            className="w-full min-h-[180px] p-6 focus:ring-0 border-none text-base font-medium text-slate-700 placeholder:text-slate-300 resize-none bg-transparent"
            placeholder="Paste your AI-generated content here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>

        {/* Primary Action Button */}
        <button 
          onClick={handleTransform} 
          disabled={isLoading || !inputText.trim()}
          className="w-full py-6 rounded-[28px] bg-indigo-600 text-white font-black text-xl shadow-2xl shadow-indigo-200 active:scale-95 transition-all disabled:opacity-40 disabled:shadow-none relative overflow-hidden"
        >
          {isLoading ? (
             <div className="flex items-center justify-center gap-3">
               <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
               <span className="tracking-widest">PROCESSING...</span>
             </div>
          ) : (
            <span className="tracking-tight">HUMANIZE TO {selectedLang.name.toUpperCase()}</span>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Output Card */}
        {(outputText || isLoading) && (
          <div className="bg-white rounded-[40px] shadow-xl border border-indigo-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="p-5 flex items-center justify-between border-b border-indigo-50 bg-indigo-50/30">
               <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Humanized Version</span>
               {outputText && !isLoading && (
                 <button 
                   onClick={() => copyToClipboard(outputText)} 
                   className="px-6 py-2.5 bg-white text-indigo-600 text-[11px] font-black rounded-2xl shadow-sm border border-indigo-100 active:bg-indigo-100 transition-colors uppercase"
                 >
                   Copy Text
                 </button>
               )}
            </div>
            <div 
              dir={isRTL ? 'rtl' : 'ltr'}
              className="p-7 min-h-[180px] relative"
            >
              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-5 bg-slate-100 rounded-full w-3/4"></div>
                  <div className="h-5 bg-slate-100 rounded-full w-full"></div>
                  <div className="h-5 bg-slate-100 rounded-full w-5/6"></div>
                  <div className="h-5 bg-slate-100 rounded-full w-2/3"></div>
                </div>
              ) : (
                <p className="text-slate-900 leading-relaxed text-lg font-medium whitespace-pre-wrap selection:bg-indigo-100">
                  {outputText}
                </p>
              )}
            </div>
          </div>
        )}

        {/* History Section */}
        {history.length > 0 && (
          <div className="pt-8">
            <div className="flex justify-between items-center mb-5 px-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recent History</h3>
              <button 
                onClick={() => setHistory([])}
                className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-500 p-1"
              >
                Clear History
              </button>
            </div>
            <div className="space-y-4">
              {history.map((item, i) => (
                <div 
                  key={i} 
                  className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer hover:border-indigo-200"
                  onClick={() => {
                    setInputText(item.originalText);
                    setOutputText(item.humanizedText);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">
                      {item.language || 'English'}
                    </span>
                    <span className="text-[10px] text-slate-300 font-bold">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm line-clamp-3 font-medium leading-relaxed italic">"{item.humanizedText}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-12 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] text-center px-10">
        &copy; {new Date().getFullYear()} Humanize AI <br/>
        <div className="h-px bg-slate-200 w-12 mx-auto my-4"></div>
        <span className="text-slate-300 font-bold">Ablisense.ai Solution</span>
      </footer>
    </div>
  );
};

export default App;
