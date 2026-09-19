'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';

type SR = {
  lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null; onend: (() => void) | null;
};
const ctor = () => {
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

/** Browser speech recognition. Hidden where unsupported; typing always works. */
export function VoiceButton({ lang, onTranscript }: { lang: string; onTranscript: (text: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const rec = useRef<SR | null>(null);
  // Browser-only API: must be read after hydration, not during render.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSupported(Boolean(ctor())), []);

  function toggle() {
    if (listening) return rec.current?.stop();
    const C = ctor();
    if (!C) return;
    const r = new C();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => onTranscript(Array.from(e.results, (x) => x[0].transcript).join(' ').trim());
    r.onerror = r.onend = () => setListening(false);
    rec.current = r;
    r.start();
    setListening(true);
  }

  return (
    <button type="button" onClick={toggle} disabled={!supported} aria-pressed={listening}
      title={supported ? undefined : 'Voice input is not supported in this browser'}
      className={`flex min-h-13 flex-1 items-center justify-center gap-2 rounded-2xl border text-[15px] font-bold transition disabled:opacity-40 ${
        listening ? 'border-high bg-high-wash text-high' : 'border-line bg-raised text-ink hover:bg-paper'}`}>
      {listening ? <span className="size-2.5 animate-pulse rounded-full bg-high" /> : <Icon name="mic" size={19} />}
      {listening ? 'Listening… tap to stop' : 'Speak'}
    </button>
  );
}
