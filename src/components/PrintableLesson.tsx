import React from 'react';
import { Lesson, Question } from '../types';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { 
  BookOpen, 
  Lightbulb, 
  Target, 
  CheckCircle2, 
  HelpCircle, 
  BrainCircuit,
  Calculator,
  FlaskConical,
  Globe,
  History,
  Languages,
  Palette,
  Dna,
  ArrowRight,
  Sparkles,
  Star,
  Quote
} from 'lucide-react';

interface PrintableLessonProps {
  lesson: Lesson;
}

const getCategoryTheme = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('math')) return {
    color: 'border-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    accent: 'bg-blue-600',
    light: 'bg-blue-100',
    icon: <Calculator className="w-12 h-12" />,
    mascot: '📐',
    pattern: 'radial-gradient(#2563eb 0.5px, transparent 0.5px)',
    flag: '🔢'
  };
  if (cat.includes('science') || cat.includes('physique') || cat.includes('svt') || cat.includes('bio')) return {
    color: 'border-emerald-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-900',
    accent: 'bg-emerald-600',
    light: 'bg-emerald-100',
    icon: <FlaskConical className="w-12 h-12" />,
    mascot: '🧪',
    pattern: 'radial-gradient(#059669 0.5px, transparent 0.5px)',
    flag: '🧬'
  };
  if (cat.includes('histoire')) return {
    color: 'border-amber-700',
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    accent: 'bg-amber-700',
    light: 'bg-amber-100',
    icon: <History className="w-12 h-12" />,
    mascot: '📜',
    pattern: 'radial-gradient(#b45309 0.5px, transparent 0.5px)',
    flag: '🏰'
  };
  if (cat.includes('géo')) return {
    color: 'border-cyan-600',
    bg: 'bg-cyan-50',
    text: 'text-cyan-900',
    accent: 'bg-cyan-600',
    light: 'bg-cyan-100',
    icon: <Globe className="w-12 h-12" />,
    mascot: '🌍',
    pattern: 'radial-gradient(#0891b2 0.5px, transparent 0.5px)',
    flag: '🗺️'
  };
  if (cat.includes('anglais') || cat.includes('langue')) return {
    color: 'border-indigo-600',
    bg: 'bg-indigo-50',
    text: 'text-indigo-900',
    accent: 'bg-indigo-600',
    light: 'bg-indigo-100',
    icon: <Languages className="w-12 h-12" />,
    mascot: '🗣️',
    pattern: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)',
    flag: '🇬🇧'
  };
  if (cat.includes('art')) return {
    color: 'border-pink-600',
    bg: 'bg-pink-50',
    text: 'text-pink-900',
    accent: 'bg-pink-600',
    light: 'bg-pink-100',
    icon: <Palette className="w-12 h-12" />,
    mascot: '🎨',
    pattern: 'radial-gradient(#db2777 0.5px, transparent 0.5px)',
    flag: '🖌️'
  };
  return {
    color: 'border-purple-600',
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    accent: 'bg-purple-600',
    light: 'bg-purple-100',
    icon: <BookOpen className="w-12 h-12" />,
    mascot: '🧠',
    pattern: 'radial-gradient(#9333ea 0.5px, transparent 0.5px)',
    flag: '📚'
  };
};

export default function PrintableLesson({ lesson }: PrintableLessonProps) {
  const theme = getCategoryTheme(lesson.category);
  
  // Select 10 random questions for the exercise sheet
  const exerciseQuestions = [...lesson.questions]
    .sort(() => 0.5 - Math.random())
    .slice(0, 10);

  return (
    <div className="print-content bg-white text-black font-sans leading-relaxed">
      {/* Page 1: Lesson Sheet */}
      <div className="print-page p-12 relative">
        {/* Decorative corner */}
        <div className={`absolute top-0 right-0 w-32 h-32 ${theme.accent} opacity-10 rounded-bl-full`}></div>
        
        <div className={`relative border-8 ${theme.color} p-8 mb-10 rounded-[40px] shadow-[12px_12px_0_rgba(0,0,0,1)] bg-white`}>
          <div className="absolute -top-6 -left-6 w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white rotate-[-10deg] shadow-lg">
            {theme.icon}
          </div>
          
          <div className="flex justify-between items-start relative z-10 pl-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-black text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-md">
                  {lesson.level}
                </span>
                <span className={`${theme.text} font-black uppercase tracking-[0.3em] text-xs flex items-center gap-2`}>
                  {theme.flag} {lesson.category}
                </span>
              </div>
              <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-none mb-2 drop-shadow-sm">
                {lesson.title}
              </h1>
            </div>
            <div className="text-right shrink-0">
              <div className="text-4xl mb-2">{theme.mascot}</div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">Anglix Academy</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 mb-6">
          <div className="col-span-8 space-y-6">
            <div className={`${theme.bg} border-4 border-black p-6 rounded-[32px] relative`}>
              {/* Mascot Bubble */}
              <div className="absolute -top-10 right-4 flex items-end gap-2">
                <div className="bg-white border-2 border-black p-2 rounded-xl rounded-br-none shadow-md text-[10px] font-bold italic max-w-[120px]">
                  C'est parti ! {theme.mascot}
                </div>
                <div className="text-2xl mb-1">🦁</div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className={`${theme.accent} p-1.5 rounded-lg text-white`}>
                  <Sparkles size={16} />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tight">Le Cours du Jour</h3>
              </div>
              
              <div className="prose prose-slate max-w-none prose-p:my-2 prose-headings:mb-2 prose-headings:mt-4 prose-strong:bg-yellow-200 prose-strong:px-1 prose-strong:rounded prose-li:marker:text-black">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{lesson.explanation}</ReactMarkdown>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border-4 border-black border-dashed rounded-[32px] bg-gray-50">
              <Quote className="text-gray-300 shrink-0" size={32} />
              <p className="italic font-black text-lg text-center flex-1">
                "Chaque petit pas te rapproche de ton <span className="underline decoration-4 decoration-yellow-400">objectif</span> !"
              </p>
            </div>
          </div>

          <div className="col-span-4 space-y-6">
            <div className={`border-4 border-black p-5 rounded-[32px] ${theme.light} shadow-[6px_6px_0_rgba(0,0,0,1)]`}>
              <div className="flex items-center gap-2 mb-3">
                <Target className={theme.text} size={20} />
                <h4 className="font-black text-base uppercase italic">Tes Défis</h4>
              </div>
              <ul className="space-y-3">
                {['Comprendre le concept', 'Mémoriser les clés', 'Réussir le quiz'].map((obj, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-white border-2 border-black rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <ArrowRight size={10} />
                    </div>
                    <span className="font-bold text-xs leading-tight">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-4 border-black p-5 rounded-[32px] bg-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-20">
                <Star size={32} className="fill-current" />
              </div>
              <p className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest flex items-center gap-2">
                <Palette size={12} /> Zone Créative
              </p>
              <div 
                className="h-40 w-full border-2 border-gray-100 rounded-2xl"
                style={{ backgroundImage: theme.pattern, backgroundSize: '20px 20px' }}
              ></div>
              <p className="text-[10px] font-bold text-gray-400 mt-2 text-center italic">Dessine tes schémas !</p>
            </div>
          </div>
        </div>

        {/* Footer decoration */}
        <div className="flex items-center justify-between py-6 border-t-4 border-black">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border border-black"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Qualité Premium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 border border-black"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Fiche Officielle</span>
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">Anglix Academy v2.0</p>
        </div>
      </div>

      {/* Page 2: Exercises */}
      <div className="print-page page-break-before p-12 relative">
        <div className={`absolute top-0 left-0 w-full h-4 ${theme.accent}`}></div>
        
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white">
                <BrainCircuit size={28} />
              </div>
              <h2 className="text-5xl font-black uppercase italic tracking-tighter">Mission : Action !</h2>
            </div>
            <p className="font-black text-gray-400 uppercase tracking-[0.3em] text-sm ml-1">Entraîne-toi comme un pro</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="bg-black text-white px-8 py-4 rounded-[24px] text-center shadow-xl rotate-[2deg]">
              <p className="text-[10px] font-black uppercase opacity-60 mb-1 tracking-widest">Note Finale</p>
              <p className="text-4xl font-black italic">/ 10</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10">
          {exerciseQuestions.map((q, i) => (
            <div key={q.id || `ex-${i}`} className="relative pl-16 group break-inside-avoid">
              {/* Question Number Badge */}
              <div className={`absolute left-0 top-0 w-12 h-12 border-4 border-black ${theme.light} rounded-2xl flex items-center justify-center font-black text-xl italic shadow-[4px_4px_0_rgba(0,0,0,1)]`}>
                {i + 1}
              </div>
              
              <div className="mb-6">
                <p className="font-black text-xl leading-tight mb-2">{q.text}</p>
                <div className={`h-1.5 w-24 ${theme.accent} rounded-full opacity-30`}></div>
              </div>

              {q.diagram && (
                <div className="mb-6 p-4 bg-white border-4 border-black rounded-2xl flex justify-center items-center overflow-hidden max-w-[250px]">
                  <div 
                    className="w-full h-auto"
                    dangerouslySetInnerHTML={{ __html: q.diagram }} 
                  />
                </div>
              )}
              
              {q.type === 'qcm' || q.type === 'true_false' ? (
                <div className="grid grid-cols-2 gap-6">
                  {q.options?.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 border-4 border-black rounded-2xl bg-white hover:bg-gray-50 transition-all">
                      <div className="w-6 h-6 border-4 border-black rounded-lg shrink-0"></div>
                      <span className="font-black text-sm uppercase tracking-tight">{opt}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 relative">
                  <div className="w-full h-16 bg-gray-50 border-4 border-black border-dashed rounded-[24px] flex items-center px-6">
                    <span className="text-gray-300 font-black italic uppercase tracking-widest text-xs">Écris ta réponse ici...</span>
                  </div>
                  {/* Decorative arrow */}
                  <div className="absolute -right-8 -bottom-4 text-4xl opacity-20 rotate-[-15deg]">✍️</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Motivation Mascot */}
        <div className="absolute bottom-12 right-12 flex items-center gap-4">
          <div className="bg-black text-white p-4 rounded-3xl rounded-br-none font-black italic text-sm shadow-lg">
            Tu gères ! Continue ! 🚀
          </div>
          <div className="text-5xl">🐯</div>
        </div>
      </div>

      {/* Page 3: Corrections */}
      <div className="print-page page-break-before p-12">
        <div className={`bg-black text-white p-10 rounded-[48px] mb-12 relative overflow-hidden shadow-2xl`}>
          <div className="absolute top-[-20px] right-[-20px] text-9xl opacity-10 rotate-12">🏆</div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-green-500 p-3 rounded-2xl border-4 border-white">
                <CheckCircle2 size={32} className="text-white" />
              </div>
              <h2 className="text-5xl font-black uppercase italic tracking-tighter">Le Labo des Réponses</h2>
            </div>
            <p className="font-black text-green-400 uppercase tracking-[0.4em] text-sm ml-2">Analyse tes résultats et progresse</p>
          </div>
        </div>

        <div className="columns-2 gap-10 space-y-8">
          {exerciseQuestions.map((q, i) => (
            <div key={q.id || `corr-${i}`} className={`break-inside-avoid ${theme.bg} p-6 rounded-[32px] border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)]`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 bg-black text-white rounded-xl flex items-center justify-center text-sm font-black italic">{i + 1}</span>
                <p className="font-black text-xs uppercase tracking-tight truncate">{q.text}</p>
              </div>
              
              <div className="bg-white p-4 rounded-2xl border-2 border-green-500 mb-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-green-500 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-bl-lg">Correct</div>
                <p className="font-black text-base text-green-800">
                  { (q.type === 'qcm' || q.type === 'true_false') 
                      ? q.options?.[Number(q.correctAnswer)] 
                      : q.correctAnswer
                  }
                </p>
              </div>
              
              {q.explanation && (
                <div className="bg-white/50 p-3 rounded-xl border-2 border-black border-dotted">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb size={12} className="text-amber-500" />
                    <p className="text-[9px] font-black uppercase text-gray-500">Le tips d'Anglix</p>
                  </div>
                  <p className="text-[11px] font-bold text-gray-700 italic leading-tight">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 text-center relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-black -z-10"></div>
          <div className="inline-block bg-white border-4 border-black px-12 py-6 rounded-full shadow-xl">
            <p className="font-black text-2xl uppercase italic tracking-tighter flex items-center gap-4">
              <Sparkles className="text-yellow-500" />
              T'es un champion ! À demain !
              <Sparkles className="text-yellow-500" />
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        @media screen {
          .print-only { display: none !important; }
        }
        @media print {
          @page { size: A4; margin: 10mm; }
          body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; }
          body * { visibility: hidden !important; }
          .print-only, .print-only * { visibility: visible !important; display: block !important; }
          .print-only { position: absolute; left: 0; top: 0; width: 100%; }
          .page-break-before { page-break-before: always; }
          .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
          .print-page { 
            width: 100%;
            min-height: 270mm;
            position: relative;
            background: white;
            padding: 10mm;
            margin-bottom: 20mm;
          }
          .prose { max-width: none !important; font-size: 14px; }
          .prose h1, .prose h2, .prose h3 { font-weight: 900; text-transform: uppercase; font-style: italic; margin-top: 1em; margin-bottom: 0.5em; }
          .prose p { margin-bottom: 0.8em; line-height: 1.5; }
          .prose strong { 
            background-color: #fef08a; 
            padding: 0 4px; 
            border-radius: 4px;
            font-weight: 900;
          }
          .prose ul { list-style-type: none; padding-left: 0; }
          .prose li { position: relative; padding-left: 1.5em; margin-bottom: 0.5em; }
          .prose li::before { 
            content: '→'; 
            position: absolute; 
            left: 0; 
            font-weight: 900; 
            color: black; 
          }
          
          /* Revision Sheet Print Styles */
          .revision-def {
            background-color: #fef2f2 !important;
            border-left: 4px solid #ef4444 !important;
            padding: 10px !important;
            margin: 10px 0 !important;
            border-radius: 0 8px 8px 0 !important;
            font-weight: bold !important;
          }
          .revision-def::before { content: "🔴 DÉFINITION : "; display: block; font-size: 8px; font-weight: 900; text-transform: uppercase; margin-bottom: 2px; }

          .revision-formula {
            background-color: #eff6ff !important;
            border-left: 4px solid #3b82f6 !important;
            padding: 10px !important;
            margin: 10px 0 !important;
            border-radius: 0 8px 8px 0 !important;
            font-family: monospace !important;
            font-weight: bold !important;
          }
          .revision-formula::before { content: "🔵 FORMULE : "; display: block; font-size: 8px; font-weight: 900; text-transform: uppercase; margin-bottom: 2px; }

          .revision-example {
            background-color: #f0fdf4 !important;
            border-left: 4px solid #22c55e !important;
            padding: 10px !important;
            margin: 10px 0 !important;
            border-radius: 0 8px 8px 0 !important;
            font-weight: bold !important;
            font-style: italic !important;
          }
          .revision-example::before { content: "🟢 EXEMPLE : "; display: block; font-size: 8px; font-weight: 900; text-transform: uppercase; margin-bottom: 2px; }

          .revision-tip {
            background-color: #fefce8 !important;
            border-left: 4px solid #eab308 !important;
            padding: 10px !important;
            margin: 10px 0 !important;
            border-radius: 0 8px 8px 0 !important;
            font-weight: bold !important;
          }
          .revision-tip::before { content: "🟡 ASTUCE / PIÈGE : "; display: block; font-size: 8px; font-weight: 900; text-transform: uppercase; margin-bottom: 2px; }
        }
      `}} />
    </div>
  );
}
