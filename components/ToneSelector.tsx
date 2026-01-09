
import React from 'react';
import { Tone } from '../types';

interface ToneSelectorProps {
  selectedTone: Tone;
  onSelect: (tone: Tone) => void;
}

const tones = [
  { id: Tone.CONVERSATIONAL, icon: '💬', desc: 'Natural' },
  { id: Tone.PROFESSIONAL, icon: '💼', desc: 'Formal' },
  { id: Tone.ACADEMIC, icon: '🎓', desc: 'Study' },
  { id: Tone.CREATIVE, icon: '🎨', desc: 'Vivid' },
  { id: Tone.CONCISE, icon: '⚡', desc: 'Short' },
];

export const ToneSelector: React.FC<ToneSelectorProps> = ({ selectedTone, onSelect }) => {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 pb-1">
      {tones.map((tone) => (
        <button
          key={tone.id}
          onClick={() => onSelect(tone.id)}
          className={`flex-1 min-w-[100px] p-3 rounded-2xl border-2 transition-all duration-200 text-center active:scale-95 flex flex-col items-center justify-center ${
            selectedTone === tone.id
              ? 'border-indigo-600 bg-white text-indigo-700 shadow-md ring-4 ring-indigo-50'
              : 'border-white bg-white text-slate-400 shadow-sm'
          }`}
        >
          <span className="text-2xl mb-1">{tone.icon}</span>
          <span className="font-bold text-[11px] uppercase tracking-tight leading-none mb-1">{tone.id}</span>
          <span className="text-[8px] opacity-60 font-bold uppercase">{tone.desc}</span>
        </button>
      ))}
    </div>
  );
};
