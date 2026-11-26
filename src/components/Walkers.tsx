"use client";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/anim";

/**
 * Two characters walking in place, each holding a sign.
 * Layer order per character: back leg → body/head → front leg → SIGN → fingers.
 * The sign content is any image (flyer crop, logo, banner) — swap per event.
 */

const INK = "var(--ink)";
const SKIN = "#fdfaf5";
const SW = 3; // stroke width

type Look = {
  jacket: string;
  pants: string;
  flare: boolean;
  hair: "short" | "long";
  shades: boolean;
};

function Leg({ id, look }: { id: string; look: Look }) {
  const shin = look.flare
    ? "M-15,0 L15,0 L30,108 Q31,114 25,114 L-25,114 Q-31,114 -29,108 Z"
    : "M-15,0 L15,0 L14,110 L-14,110 Z";
  return (
    <g data-leg={id}>
      <path d="M-21,-6 Q0,-12 21,-6 L17,118 Q0,124 -17,118 Z" fill={look.pants} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <g data-knee transform="translate(0,116)">
        <path d={shin} fill={look.pants} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        {look.flare && <path d="M0,10 L3,104" stroke={INK} strokeWidth={2} strokeDasharray="8 7" fill="none" />}
        <g transform={`translate(${look.flare ? 2 : 0},${look.flare ? 112 : 108})`}>
          <path d="M-20,-4 L14,-6 Q34,-4 42,8 L42,14 L-20,14 Z" fill={INK} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <rect x={-20} y={11} width={62} height={5} rx={2} fill="#fff" stroke={INK} strokeWidth={2} />
          <path d="M2,-3 L10,6 M10,-4 L18,5" stroke="#fff" strokeWidth={2} />
        </g>
      </g>
    </g>
  );
}

function Fingers({ x, y, dir }: { x: number; y: number; dir: "side" | "top" }) {
  // little rounded fingers wrapping over the sign's edge
  const f = [0, 1, 2, 3];
  return (
    <g transform={`translate(${x},${y})`}>
      {f.map((i) =>
        dir === "side" ? (
          <rect key={i} x={-9} y={-20 + i * 10.5} width={18} height={11} rx={5.5} fill={SKIN} stroke={INK} strokeWidth={2.4} />
        ) : (
          <rect key={i} x={-21 + i * 10.5} y={-9} width={11} height={20} rx={5.5} fill={SKIN} stroke={INK} strokeWidth={2.4} />
        ),
      )}
    </g>
  );
}

function Person({
  look,
  sign,
  signSize,
  signAt,
  hands,
  idp,
}: {
  look: Look;
  sign: string;
  signSize: [number, number];
  signAt: [number, number, number];
  hands: { x: number; y: number; dir: "side" | "top" }[];
  idp: string;
}) {
  const [sw, sh] = signSize;
  return (
    <g>
      <ellipse data-shadow cx={10} cy={240} rx={70} ry={9} fill={INK} opacity={0.12} />
      <Leg id="back" look={look} />
      <g data-body>
        {/* torso */}
        <path d="M-40,-178 Q0,-198 42,-176 L50,10 Q0,18 -48,10 Z" fill={look.jacket} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M-6,-190 L4,-150 L14,-188" fill="none" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
        {/* neck + head */}
        <path d="M-9,-214 L11,-214 L12,-184 L-8,-184 Z" fill={SKIN} stroke={INK} strokeWidth={SW} />
        <g transform="translate(6,-246)">
          {look.hair === "long" && (
            <path d="M-30,-20 Q-44,10 -36,40 Q-40,64 -22,78 Q-30,52 -14,40 Q-22,14 -8,-6 Z" fill={INK} />
          )}
          <path d="M-26,-30 Q4,-50 28,-24 Q36,-8 34,8 Q40,14 34,18 Q32,34 18,38 L-8,38 Q-30,26 -30,0 Z" fill={SKIN} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          {look.hair === "short" ? (
            <path d="M-31,4 Q-40,-36 -6,-46 Q30,-52 38,-22 Q16,-30 -2,-20 Q-10,-6 -22,6 Z" fill={INK} />
          ) : (
            <path d="M-30,6 Q-42,-34 -8,-46 Q28,-54 36,-18 Q10,-30 -6,-16 Q-14,0 -28,10 Z" fill={INK} />
          )}
          {look.shades ? (
            <>
              <rect x={6} y={-6} width={26} height={11} rx={4} fill={INK} />
              <path d="M6,-2 L-14,-4" stroke={INK} strokeWidth={2.4} />
            </>
          ) : (
            <path d="M18,-2 Q22,-6 26,-2" stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          )}
          <path d="M14,20 Q20,25 27,19" stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <circle cx={-14} cy={8} r={6} fill={SKIN} stroke={INK} strokeWidth={2.2} />
        </g>
      </g>
      <Leg id="front" look={look} />
      {/* sign + hands ride with the body bob */}
      <g data-sign>
        <g transform={`translate(${signAt[0]},${signAt[1]}) rotate(${signAt[2]})`}>
          <g data-tilt>
            <clipPath id={`clip-${idp}`}>
              <rect x={-sw / 2 + 7} y={-sh / 2 + 7} width={sw - 14} height={sh - 14} rx={3} />
            </clipPath>
            <rect x={-sw / 2} y={-sh / 2} width={sw} height={sh} rx={6} fill="#fbfbfb" stroke={INK} strokeWidth={SW} />
            <image
              href={sign}
              x={-sw / 2 + 7}
              y={-sh / 2 + 7}
              width={sw - 14}
              height={sh - 14}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#clip-${idp})`}
            />
            {hands.map((h, i) => (
              <Fingers key={i} {...h} />
            ))}
          </g>
        </g>
      </g>
    </g>
  );
}

function Jebena() {
  return (
    <g>
      <ellipse cx={0} cy={58} rx={56} ry={7} fill={INK} opacity={0.12} />
      <path d="M-40,20 Q-44,-28 0,-30 Q44,-28 40,20 Q38,56 0,56 Q-38,56 -40,20 Z" fill="var(--primary)" stroke={INK} strokeWidth={SW} />
      <path d="M-10,-30 L-14,-86 Q0,-94 14,-86 L10,-30 Z" fill="var(--primary)" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M-18,-90 Q0,-100 18,-90" fill="none" stroke={INK} strokeWidth={SW} strokeLinecap="round" />
      <path d="M-40,10 Q-70,-6 -78,-40 L-70,-42 Q-62,-16 -38,-6" fill="var(--primary)" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M38,-10 Q66,-12 62,18 Q58,40 36,34" fill="none" stroke={INK} strokeWidth={SW} />
      <path d="M-22,10 Q0,22 22,10" fill="none" stroke="#fbfbfb" strokeWidth={3} strokeLinecap="round" />
      <g data-steam stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.7}>
        <path d="M-76,-54 q-10,-14 0,-28 q10,-14 0,-28" />
        <path d="M-62,-58 q-8,-12 0,-24 q8,-12 0,-24" />
      </g>
    </g>
  );
}

function Sini() {
  const cup = (x: number) => (
    <g transform={`translate(${x},0)`} key={x}>
      <path d="M-14,-24 L14,-24 L10,0 L-10,0 Z" fill="#fbfbfb" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M-6,-16 L-6,-8 M0,-18 L0,-6 M6,-16 L6,-8" stroke="var(--primary)" strokeWidth={3} strokeLinecap="round" />
    </g>
  );
  return (
    <g>
      <ellipse cx={0} cy={10} rx={78} ry={9} fill={INK} opacity={0.12} />
      <path d="M-74,0 L74,0 L66,10 L-66,10 Z" fill="var(--primary)" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {[-44, 0, 44].map(cup)}
      <g data-steam stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.6}>
        <path d="M-44,-32 q-7,-10 0,-20 q7,-10 0,-20" />
        <path d="M0,-32 q-7,-10 0,-20 q7,-10 0,-20" />
        <path d="M44,-32 q-7,-10 0,-20 q7,-10 0,-20" />
      </g>
    </g>
  );
}

export default function Walkers({ left, right }: { left: string; right: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const people = Array.from(svg.querySelectorAll<SVGGElement>("[data-person]"));
    const rigs = people.map((p, i) => ({
      phase: i * Math.PI * 0.85,
      front: p.querySelector<SVGGElement>('[data-leg="front"]')!,
      back: p.querySelector<SVGGElement>('[data-leg="back"]')!,
      fk: p.querySelector<SVGGElement>('[data-leg="front"] [data-knee]')!,
      bk: p.querySelector<SVGGElement>('[data-leg="back"] [data-knee]')!,
      body: p.querySelector<SVGGElement>("[data-body]")!,
      sign: p.querySelector<SVGGElement>("[data-sign]")!,
      tilt: p.querySelector<SVGGElement>("[data-tilt]")!,
      shadow: p.querySelector<SVGEllipseElement>("[data-shadow]")!,
    }));
    const steam = Array.from(svg.querySelectorAll<SVGGElement>("[data-steam]"));

    const pose = (t: number) => {
      const w = Math.PI * 2 * 0.85; // ~0.85 strides per second
      rigs.forEach((r) => {
        const a = w * t + r.phase;
        const s = Math.sin(a);
        const thigh = 26 * s;
        // knee bends while the leg swings forward
        const kneeF = Math.max(0, 46 * Math.sin(a + Math.PI / 2)) ;
        const kneeB = Math.max(0, 46 * Math.sin(a - Math.PI / 2));
        r.front.setAttribute("transform", `rotate(${-thigh})`);
        r.back.setAttribute("transform", `rotate(${thigh})`);
        r.fk.setAttribute("transform", `translate(0,116) rotate(${kneeF * 0.9})`);
        r.bk.setAttribute("transform", `translate(0,116) rotate(${kneeB * 0.9})`);
        const bob = -7 * Math.abs(Math.cos(a));
        r.body.setAttribute("transform", `translate(0,${bob})`);
        r.sign.setAttribute("transform", `translate(0,${bob * 1.15})`);
        r.tilt.setAttribute("transform", `rotate(${1.8 * Math.sin(a * 2 + 0.6)})`);
        r.shadow.setAttribute("rx", String(66 + 6 * Math.abs(Math.sin(a))));
      });
      steam.forEach((g, i) => {
        g.setAttribute("transform", `translate(0,${-((t * 22 + i * 9) % 14)})`);
        g.setAttribute("opacity", String(0.35 + 0.35 * Math.abs(Math.sin(t * 1.6 + i))));
      });
    };

    if (prefersReducedMotion()) {
      pose(0.3);
      return;
    }
    let raf = 0;
    let running = false;
    const start = performance.now();
    const loop = (now: number) => {
      pose((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) {
        running = true;
        raf = requestAnimationFrame(loop);
      } else if (!e.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(svg);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const man: Look = { jacket: "var(--primary)", pants: "#fbfbfb", flare: false, hair: "short", shades: true };
  const woman: Look = { jacket: "#fbfbfb", pants: "var(--primary)", flare: true, hair: "long", shades: false };

  return (
    <svg ref={ref} viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Two people walking, carrying the invitation">
      <g transform="translate(205,548)"><Jebena /></g>
      <g transform="translate(1010,560)"><Sini /></g>
      <g data-person transform="translate(445,318)">
        <Person
          idp="l"
          look={man}
          sign={left}
          signSize={[250, 222]}
          signAt={[36, -96, -4]}
          hands={[
            { x: 125, y: 30, dir: "side" },
            { x: -125, y: -18, dir: "side" },
          ]}
        />
      </g>
      <g data-person transform="translate(775,318)">
        <Person
          idp="r"
          look={woman}
          sign={right}
          signSize={[262, 194]}
          signAt={[30, -104, 3]}
          hands={[
            { x: 70, y: -97, dir: "top" },
            { x: 131, y: 34, dir: "side" },
          ]}
        />
      </g>
    </svg>
  );
}
