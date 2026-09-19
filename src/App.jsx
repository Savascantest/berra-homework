import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, BookOpen, Brain, Check, CheckCircle2, ChevronRight,
  CircleHelp, GraduationCap, Lightbulb, Moon, RefreshCw, Sparkles, Star, Sun, Utensils,
} from 'lucide-react';

const unitIcons = [Utensils, BookOpen, Brain];
const unitColors = ['from-orange-500 to-rose-500', 'from-blue-600 to-indigo-600', 'from-emerald-600 to-teal-600'];

function lessonKey(hw) { return `berra-homework:${hw.id}`; }
function answerOf(item) { return Number.isInteger(item.answerIndex) ? item.options?.[item.answerIndex] : item.answer; }

function Question({ item, onResult }) {
  const [choice, setChoice] = useState(null);
  const answer = answerOf(item);
  const correct = choice === answer;
  function pick(option) {
    if (choice !== null) return;
    setChoice(option);
    onResult?.(item, option, option === answer);
  }
  return (
    <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h4 className="font-bold text-slate-900 dark:text-white mb-4">{item.prompt}</h4>
      <div className="grid gap-2">
        {item.options.map((option) => {
          const state = choice === null ? '' : option === answer ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300' : option === choice ? 'border-rose-500 bg-rose-50 dark:bg-rose-800/30 text-rose-800 dark:text-rose-300' : 'opacity-60';
          return <button key={option} onClick={() => pick(option)} className={`text-left rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-3 font-medium transition ${state}`}>{option}</button>;
        })}
      </div>
      {choice !== null && <div className={`mt-4 rounded-xl p-3 text-sm font-semibold ${correct ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300'}`}>{correct ? 'Correct — well done!' : `Try to remember: ${item.hint || `The correct answer is “${answer}”.`}`}</div>}
    </article>
  );
}

function QuestionSet({ items, onResult }) {
  return <div className="grid gap-4">{items.map((item, index) => <Question key={`${item.prompt}-${index}`} item={item} onResult={onResult} />)}</div>;
}

function Vocabulary({ words }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {words.map((word, index) => <button key={word.word} onClick={() => setOpen(open === index ? null : index)} className="text-left min-h-40 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:-translate-y-0.5 transition">
        <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Tap to review</span>
        <h3 className="text-xl font-black mt-2 text-slate-900 dark:text-white">{word.word}</h3>
        {open === index ? <div className="mt-4 space-y-2"><p className="text-slate-600 dark:text-slate-300">{word.meaning}</p><p className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-3 text-blue-900 dark:text-blue-200">{word.example}</p></div> : <p className="mt-4 text-slate-400">Show meaning and example</p>}
      </button>)}
    </div>
  );
}

function Grammar({ rules, remember, watchOut }) {
  return <div className="space-y-5">
    {rules.map((rule) => <article key={rule.title} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6"><h3 className="text-xl font-black text-slate-900 dark:text-white">{rule.title}</h3><p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">{rule.rule}</p><div className="mt-4 grid gap-2">{rule.examples.map((example) => <div key={example} className="rounded-xl bg-slate-100 dark:bg-slate-900 px-4 py-3 font-mono text-sm">{example}</div>)}</div></article>)}
    <div className="grid md:grid-cols-2 gap-4"><aside className="rounded-2xl border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-5"><strong className="text-emerald-800 dark:text-emerald-300">Remember</strong><p className="mt-2 text-emerald-900/80 dark:text-emerald-200/80">{remember}</p></aside><aside className="rounded-2xl border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30 p-5"><strong className="text-amber-900 dark:text-amber-300">Watch Out</strong><p className="mt-2 text-amber-900/80 dark:text-amber-200/80">{watchOut}</p></aside></div>
  </div>;
}

function Reading({ reading, onResult }) {
  return <div className="space-y-6"><article className="rounded-3xl border border-blue-100 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 p-6 md:p-8"><h3 className="text-2xl font-black text-slate-900 dark:text-white">{reading.title}</h3><p className="mt-5 leading-8 text-lg text-slate-700 dark:text-slate-300">{reading.text}</p></article><h3 className="text-xl font-black">Reading Check</h3><QuestionSet items={reading.questions} onResult={onResult} /></div>;
}

function Listening({ listening, onResult }) {
  const [shown, setShown] = useState(false);
  function play() { if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(listening.script)); } }
  return <div className="space-y-6"><article className="rounded-3xl border border-violet-100 dark:border-slate-700 bg-gradient-to-br from-violet-50 to-white dark:from-slate-800 dark:to-slate-900 p-6 md:p-8"><h3 className="text-2xl font-black">{listening.title}</h3><p className="mt-3 text-slate-600 dark:text-slate-300">Listen once or twice, then answer. You can reveal the script after your first try.</p><div className="mt-5 flex flex-wrap gap-3"><button onClick={play} className="rounded-xl bg-violet-600 px-4 py-3 font-bold text-white">Play listening</button><button onClick={() => setShown(!shown)} className="rounded-xl border border-violet-300 px-4 py-3 font-bold text-violet-800 dark:text-violet-200">{shown ? 'Hide script' : 'Show script'}</button></div>{shown && <p className="mt-5 leading-8 text-lg text-slate-700 dark:text-slate-300">{listening.script}</p>}</article><h3 className="text-xl font-black">Listening Check</h3><QuestionSet items={listening.questions} onResult={onResult}/></div>;
}

function GuidedTask({ task, type }) {
  const title = type === 'writing' ? 'Writing' : 'Speaking';
  return <article className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6"><h3 className="text-2xl font-black">{task.title || title}</h3><p className="mt-4 leading-8 text-lg text-slate-700 dark:text-slate-300">{task.prompt}</p>{task.support?.length > 0 && <div className="mt-5 rounded-2xl bg-slate-50 dark:bg-slate-900 p-5"><strong>Useful language</strong><ul className="mt-3 list-disc space-y-2 pl-5">{task.support.map((line) => <li key={line}>{line}</li>)}</ul></div>}<p className="mt-5 text-sm font-semibold text-slate-500">This is a self-study task: draft or say your answer, then review it with the support above.</p></article>;
}

function Test({ title, items, onComplete, onResult }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const score = items.reduce((total, item, index) => total + (answers[index] === answerOf(item) ? 1 : 0), 0);
  return <div className="space-y-6"><div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-5"><h3 className="text-xl font-black">{title}</h3><p className="mt-1 text-slate-600 dark:text-slate-300">Answer every question, then submit for immediate feedback. This is practice, not a pass/fail test.</p></div><div className="grid gap-4">{items.map((item, index) => <article key={`${item.prompt}-${index}`} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5"><h4 className="font-bold mb-4">{index + 1}. {item.prompt}</h4><div className="grid gap-2">{item.options.map((option) => <button disabled={submitted} key={option} onClick={() => setAnswers((current) => ({ ...current, [index]: option }))} className={`text-left rounded-xl border px-4 py-3 ${answers[index] === option ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40' : 'border-slate-200 dark:border-slate-600'} ${submitted && option === answerOf(item) ? '!border-emerald-500 !bg-emerald-50 dark:!bg-emerald-950/30' : ''}`}>{option}</button>)}</div>{submitted && answers[index] !== answerOf(item) && <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">Correct answer: {answerOf(item)}</p>}</article>)}</div>{submitted ? <div className="rounded-3xl bg-slate-900 text-white p-8 text-center"><Star className="mx-auto text-amber-400" size={42}/><h3 className="mt-3 text-3xl font-black">{score} / {items.length}</h3><p className="mt-2 text-slate-300">Review the highlighted answers and try again if needed.</p><button onClick={() => { setAnswers({}); setSubmitted(false); }} className="mt-5 rounded-xl bg-white text-slate-900 px-5 py-3 font-bold"><RefreshCw className="inline mr-2" size={16}/>Try Again</button></div> : <button disabled={Object.keys(answers).length !== items.length} onClick={() => { setSubmitted(true); items.forEach((item, index) => onResult?.(item, answers[index], answers[index] === answerOf(item))); onComplete(score); }} className="w-full rounded-2xl bg-amber-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 px-6 py-4 font-black text-white">Check My Practice</button>}</div>;
}

function UnitView({ unit, onBack, progress, onComplete, onResult }) {
  const tabs = [['notes', 'Lesson Notes'], ['vocabulary', 'Vocabulary'], ['grammar', 'Grammar'], ['practice', 'Practice'], ['reading', 'Reading'], ['listening', 'Listening'], ['writing', 'Writing'], ['speaking', 'Speaking'], ['test', 'Formative Challenge']].filter(([id]) => Array.isArray(unit[id]) ? unit[id].length : Boolean(unit[id]));
  const [tab, setTab] = useState(tabs[0]?.[0]);
  return <div><button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"><ArrowLeft size={17}/>Back to Dashboard</button><div className={`rounded-3xl bg-gradient-to-r ${unitColors[unit.number - 1]} p-7 text-white shadow-lg`}><span className="text-sm font-black uppercase tracking-widest opacity-80">Unit {unit.number}</span><h2 className="mt-2 text-3xl md:text-4xl font-black">{unit.title}</h2><p className="mt-2 text-white/85">{unit.tagline}</p></div><nav className="mt-6 flex gap-2 overflow-x-auto pb-2">{tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold ${tab === id ? 'bg-slate-900 text-white dark:bg-blue-600' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>{label}{progress.completed?.[`${unit.id}:${id}`] && <Check size={14} className="inline ml-2"/>}</button>)}</nav><section className="mt-6">
    {tab === 'notes' && <div className="space-y-4"><div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 p-5"><Lightbulb className="text-blue-600"/><h3 className="mt-2 text-xl font-black">What we covered</h3></div>{unit.notes.map((note, index) => <div key={note} className="flex gap-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5"><span className="shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 grid place-items-center font-black">{index + 1}</span><p className="leading-7 text-slate-700 dark:text-slate-300">{note}</p></div>)}</div>}
    {tab === 'vocabulary' && <Vocabulary words={unit.vocabulary}/>} {tab === 'grammar' && <Grammar rules={unit.grammar} remember={unit.remember} watchOut={unit.watchOut}/>} {tab === 'practice' && <QuestionSet items={unit.practice} onResult={onResult}/>} {tab === 'reading' && <Reading reading={unit.reading} onResult={onResult}/>} {tab === 'listening' && <Listening listening={unit.listening} onResult={onResult}/>} {tab === 'writing' && <GuidedTask task={unit.writing} type="writing"/>} {tab === 'speaking' && <GuidedTask task={unit.speaking} type="speaking"/>} {tab === 'test' && <Test title={`Unit ${unit.number} Formative Challenge`} items={unit.test} onResult={onResult} onComplete={(score) => onComplete(`${unit.id}:test`, score)}/>} {tab !== 'test' && <button onClick={() => onComplete(`${unit.id}:${tab}`, null)} className="mt-8 w-full rounded-2xl bg-blue-600 hover:bg-blue-700 px-6 py-4 font-black text-white">{progress.completed?.[`${unit.id}:${tab}`] ? 'Section Complete ✓' : 'Mark Section as Complete'}</button>}</section></div>;
}

export default function App() {
  const [hw, setHw] = useState(null), [archive, setArchive] = useState([]), [error, setError] = useState(''), [view, setView] = useState('dashboard'), [dark, setDark] = useState(false), [progress, setProgress] = useState({ completed: {}, scores: {}, mistakes: [] });
  function loadPackage(lesson) { setError(''); setView('dashboard'); fetch(`${import.meta.env.BASE_URL}homeworks/${lesson.path}`).then((response) => { if (!response.ok) throw new Error('package missing'); return response.json(); }).then(setHw).catch(() => setError('The homework package could not be loaded.')); }
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}homeworks/index.json`).then((response) => response.json()).then((index) => { setArchive(index.lessons || []); if (!index.lessons?.length) throw new Error('archive empty'); loadPackage(index.lessons[0]); }).catch(() => setError('The homework package could not be loaded.')); }, []);
  useEffect(() => { if (!hw) return; try { const saved = JSON.parse(localStorage.getItem(lessonKey(hw)) || 'null'); if (saved) setProgress(saved); const mode = localStorage.getItem('berra-homework:dark') === 'true'; setDark(mode); document.documentElement.classList.toggle('dark', mode); } catch {} }, [hw]);
  function save(update) { setProgress((current) => { const next = typeof update === 'function' ? update(current) : update; localStorage.setItem(lessonKey(hw), JSON.stringify(next)); return next; }); }
  function complete(key, score) { save((current) => ({ ...current, completed: { ...current.completed, [key]: true }, scores: { ...current.scores, [key]: score } })); }
  function result(item, choice, correct) { if (correct || !choice) return; save((current) => { const existing = current.mistakes.find((mistake) => mistake.prompt === item.prompt); const mistakes = existing ? current.mistakes.map((mistake) => mistake.prompt === item.prompt ? { ...mistake, count: mistake.count + 1 } : mistake) : [...current.mistakes, { prompt: item.prompt, answer: answerOf(item), count: 1 }]; return { ...current, mistakes }; }); }
  function toggleDark() { const next = !dark; setDark(next); localStorage.setItem('berra-homework:dark', String(next)); document.documentElement.classList.toggle('dark', next); }
  const trackable = useMemo(() => (hw?.units || []).reduce((total, unit) => total + ['notes', 'vocabulary', 'grammar', 'practice', 'reading', 'listening', 'writing', 'speaking', 'test'].filter((key) => Array.isArray(unit[key]) ? unit[key].length : Boolean(unit[key])).length, 0) + (hw?.finalQuiz?.length ? 1 : 0), [hw]);
  const completion = useMemo(() => trackable ? Math.round((Object.values(progress.completed).filter(Boolean).length / trackable) * 100) : 0, [progress, trackable]);
  if (error) return <main className="min-h-screen grid place-items-center"><AlertTriangle/><p>{error}</p></main>;
  if (!hw) return <main className="min-h-screen grid place-items-center"><Sparkles className="animate-pulse"/><p>Preparing your homework…</p></main>;
  const activeUnit = hw.units.find((unit) => view === unit.id);
  return <div className="min-h-screen bg-stone-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors"><header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur"><div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between"><button onClick={() => setView('dashboard')} className="flex items-center gap-3"><span className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-blue-600 text-white grid place-items-center"><GraduationCap size={22}/></span><span className="font-black hidden sm:block">Berra's Homework Workspace</span></button><div className="flex items-center gap-3"><span className="text-sm font-bold text-slate-500">{completion}% complete</span><button onClick={toggleDark} className="rounded-xl border border-slate-200 dark:border-slate-700 p-2">{dark ? <Sun size={19}/> : <Moon size={19}/>}</button></div></div></header><main className="max-w-6xl mx-auto px-4 py-8">
    {activeUnit ? <UnitView unit={activeUnit} onBack={() => setView('dashboard')} progress={progress} onComplete={complete} onResult={result}/> : view === 'final' && hw.finalQuiz?.length ? <div><button onClick={() => setView('dashboard')} className="mb-6 inline-flex gap-2 font-bold text-slate-500"><ArrowLeft size={17}/>Back</button><Test title="Final Formative Practice" items={hw.finalQuiz} onResult={result} onComplete={(score) => complete('final', score)}/></div> : view === 'review' ? <div><button onClick={() => setView('dashboard')} className="mb-6 inline-flex gap-2 font-bold text-slate-500"><ArrowLeft size={17}/>Back</button><h2 className="text-3xl font-black">Mistake Review</h2><p className="mt-2 text-slate-500">Your difficult questions stay here in this browser.</p><div className="mt-6 grid gap-4">{progress.mistakes.length ? [...progress.mistakes].sort((a,b) => b.count-a.count).map((mistake) => <article key={mistake.prompt} className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5"><span className="text-xs font-black uppercase text-rose-500">Missed {mistake.count} time(s)</span><h3 className="mt-2 font-bold">{mistake.prompt}</h3><p className="mt-2 text-emerald-600 dark:text-emerald-400">Correct: {mistake.answer}</p></article>) : <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-6">No mistakes recorded yet.</div>}</div></div> : <div className="space-y-8"><section className="rounded-[2rem] bg-slate-900 text-white p-8 md:p-12 relative overflow-hidden"><div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-blue-500/20 blur-2xl"></div><span className="text-xs font-black uppercase tracking-[.2em] text-blue-300">Homework · {hw.dateLabel}</span><h1 className="mt-3 text-4xl md:text-6xl font-black font-serif">{hw.title}</h1><p className="mt-4 text-lg text-slate-300 max-w-2xl">{hw.subtitle}</p><div className="mt-7 h-3 rounded-full bg-slate-700 overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 transition-all" style={{ width: `${completion}%` }}/></div></section>{archive.length > 1 && <label className="block text-sm font-bold text-slate-600 dark:text-slate-300">Choose homework <select value={hw.id} onChange={(event) => loadPackage(archive.find((lesson) => lesson.id === event.target.value))} className="ml-2 rounded-lg border p-2 text-slate-900">{archive.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.date} — {lesson.title}</option>)}</select></label>}<div className="grid md:grid-cols-3 gap-5">{hw.units.map((unit, index) => { const Icon = unitIcons[index % unitIcons.length]; return <button key={unit.id} onClick={() => setView(unit.id)} className="text-left rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg transition"><span className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${unitColors[index % unitColors.length]} text-white grid place-items-center`}><Icon size={23}/></span><span className="mt-5 block text-xs font-black uppercase tracking-widest text-slate-400">Unit {unit.number}</span><h2 className="mt-2 text-2xl font-black">{unit.title}</h2><p className="mt-3 text-slate-500 dark:text-slate-400">{unit.tagline}</p><span className="mt-6 flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">Open unit <ChevronRight size={17}/></span></button>})}</div><div className="grid md:grid-cols-2 gap-5">{hw.finalQuiz?.length && <button onClick={() => setView('final')} className="rounded-3xl bg-gradient-to-r from-amber-400 to-orange-500 text-white p-7 text-left"><Star size={30}/><h2 className="mt-3 text-2xl font-black">Final Formative Practice</h2><p className="mt-2 text-white/85">{hw.finalQuiz.length} questions for review and retry.</p></button>}<button onClick={() => setView('review')} className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-7 text-left"><RefreshCw className="text-rose-500" size={30}/><h2 className="mt-3 text-2xl font-black">Mistake Review</h2><p className="mt-2 text-slate-500">Revisit the questions that need more attention.</p></button></div></div>}
  </main></div>;
}
