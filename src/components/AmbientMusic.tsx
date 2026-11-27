"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Soft background piano, played live in the browser with the Web Audio API — no audio file to
 * download and nothing to license. Original loop: Dmaj7 – Bm7 – Gmaj7 – A at 66 bpm, a quiet
 * arpeggio with a simple melody on alternate rounds, through a little room reverb.
 *
 * Browsers only allow sound after a tap, so it starts when the envelope is opened
 * (the "invite:open" event). The button bottom-right turns it on/off; the choice is remembered.
 */

export const startMusicEvent = "invite:open";

const BPM = 66;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// [bass, chord tones for the arpeggio (MIDI)]
const CHORDS: [number, number[]][] = [
  [38, [62, 66, 69, 73]], // Dmaj7
  [35, [62, 66, 69, 71]], // Bm7
  [43, [62, 66, 67, 71]], // Gmaj7
  [45, [61, 64, 69, 73]], // A
];
const ARP = [0, 1, 2, 3, 2, 1, 2, 3]; // eighth notes
// melody per bar: [MIDI, beat, length in beats]
const MELODY: [number, number, number][][] = [
  [[78, 0, 1.5], [76, 1.5, 1], [73, 2.5, 1.5]],
  [[74, 0, 1.5], [73, 1.5, 1], [71, 2.5, 1.5]],
  [[71, 0, 1.5], [74, 1.5, 1], [78, 2.5, 1.5]],
  [[76, 0, 1.5], [73, 1.5, 1], [69, 2.5, 1.5]],
];
const LOOP = BAR * CHORDS.length;
const VOLUME = 0.55;
const OFF_KEY = "music-off";

function reverbImpulse(ctx: AudioContext, seconds = 2.6) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  return buf;
}

export default function AmbientMusic() {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const engine = useRef<{ ctx: AudioContext; master: GainNode; bus: GainNode; timer: number; next: number; round: number } | null>(null);

  const note = (freq: number, start: number, length: number, vol: number) => {
    const e = engine.current!;
    // a few soft partials with a quick attack and a long fade: an electric-piano-like tone
    [[1, 1, 0], [2, 0.3, 3], [3, 0.1, -4], [4, 0.04, 2]].forEach(([mult, level, detune]) => {
      const osc = e.ctx.createOscillator();
      const g = e.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq * mult;
      osc.detune.value = detune;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(vol * level, start + 0.012);
      g.gain.exponentialRampToValueAtTime(vol * level * 0.35, start + 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, start + length);
      osc.connect(g).connect(e.bus);
      osc.start(start);
      osc.stop(start + length + 0.05);
    });
  };

  const scheduleLoop = (t0: number, round: number) => {
    CHORDS.forEach(([bass, tones], bar) => {
      const b = t0 + bar * BAR;
      note(midi(bass), b, BAR * 1.1, 0.05);
      ARP.forEach((idx, step) => note(midi(tones[idx]), b + step * (BEAT / 2), 2.6, 0.026));
      if (round % 2 === 1) MELODY[bar].forEach(([m, beat, len]) => note(midi(m), b + beat * BEAT, len * BEAT + 1.2, 0.03));
    });
  };

  const ensureEngine = () => {
    if (engine.current) return engine.current;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    const bus = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass"; tone.frequency.value = 2600; tone.Q.value = 0.5;
    const verb = ctx.createConvolver();
    verb.buffer = reverbImpulse(ctx);
    const wet = ctx.createGain(); wet.gain.value = 0.35;
    bus.connect(tone);
    tone.connect(master);
    tone.connect(verb).connect(wet).connect(master);
    master.connect(ctx.destination);
    engine.current = { ctx, master, bus, timer: 0, next: 0, round: 0 };
    return engine.current;
  };

  const play = () => {
    const e = ensureEngine();
    e.ctx.resume().catch(() => {});
    e.master.gain.cancelScheduledValues(e.ctx.currentTime);
    e.master.gain.setTargetAtTime(VOLUME, e.ctx.currentTime, 0.8); // gentle fade in
    if (!e.timer) {
      e.next = e.ctx.currentTime + 0.1;
      const tick = () => {
        // keep one loop scheduled ahead so it never gaps
        while (e.next < e.ctx.currentTime + 1.5) { scheduleLoop(e.next, e.round++); e.next += LOOP; }
      };
      tick();
      e.timer = window.setInterval(tick, 500);
    }
    setOn(true);
  };

  const stop = () => {
    const e = engine.current;
    setOn(false);
    if (!e) return;
    e.master.gain.cancelScheduledValues(e.ctx.currentTime);
    e.master.gain.setTargetAtTime(0.0001, e.ctx.currentTime, 0.25);
    window.clearInterval(e.timer);
    e.timer = 0;
    window.setTimeout(() => { if (!engine.current?.timer) e.ctx.suspend().catch(() => {}); }, 1200);
  };

  useEffect(() => {
    setReady(true);
    const onOpen = () => {
      let off = false;
      try { off = localStorage.getItem(OFF_KEY) === "1"; } catch {}
      if (!off) play();
    };
    window.addEventListener(startMusicEvent, onOpen);
    // pause while the tab/app is in the background
    const onVis = () => {
      const e = engine.current;
      if (!e || !e.timer) return;
      if (document.hidden) e.ctx.suspend().catch(() => {});
      else e.ctx.resume().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener(startMusicEvent, onOpen);
      document.removeEventListener("visibilitychange", onVis);
      const e = engine.current;
      if (e) { window.clearInterval(e.timer); e.ctx.close().catch(() => {}); engine.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    try { localStorage.setItem(OFF_KEY, on ? "1" : "0"); } catch {}
    if (on) stop(); else play();
  };

  if (!ready) return null;
  return (
    <button type="button" className={`music-toggle${on ? " is-on" : ""}`} onClick={toggle}
      aria-pressed={on} aria-label={on ? "Turn music off" : "Turn music on"} title={on ? "Music off" : "Music on"}>
      <span className="music-bars" aria-hidden><i /><i /><i /><i /></span>
    </button>
  );
}
