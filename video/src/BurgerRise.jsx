import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing} from "remotion";

/*
  "برغر La Ruche" — levitating burger, 60 fps, 1080×1350.
    0–2 s     the burger lifts off the slate, the lettuce flutters
    2–5 s     the cheese melts: the slice sags and thick drips run down the patty
    5–9 s     dense steam rises from the meat
    9–11 s    the burger comes back down onto the slate (impact at 10.6 s)
    11–12.5 s title
  Layers (public/burger/, all cut from plate.jpg at x 214, y 466):
    table.jpg        background without the burger
    burger-base.png  burger with the lettuce removed (dark leafy shadow inside)
    lettuce.png      lettuce alone, animated with a moving displacement
    cheese.png       melted cheese alone, stretched to make it sag
    cheese-tex.jpg   real cheese texture used to fill the drips
*/
export const RISE_FPS = 60;
export const RISE_DURATION = Math.round(12.5 * RISE_FPS);

const W = 1080, H = 1350;
const PW = 1164, PH = 1300, K = Math.max(W / PW, H / PH);
const CAM = {fx: 582, fy: 690};
const CUT = {x: 214, y: 466, w: 748, h: 623};
const toX = px => W / 2 + (px - CAM.fx) * K;
const toY = py => H / 2 + (py - CAM.fy) * K;
const B = {left: toX(CUT.x), top: toY(CUT.y), w: CUT.w * K, h: CUT.h * K};
const BX = B.left + B.w / 2, BY = B.top + B.h;

const GOLD = "linear-gradient(100deg,#8A6420 0%,#E9C46A 22%,#FFF1BF 34%,#D4A646 48%,#9C7428 66%,#F2D27C 82%,#B8892E 100%)";
const ar = {fontFamily: "Cairo", direction: "rtl"};
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"};
const rnd = i => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
const lerp = (t, a, b, from, to, easing) => interpolate(t, [a, b], [from, to], {...clamp, easing});

// timeline (seconds)
const T = {liftEnd: 2, cheese: [2, 5], steam: [5, 9], fall: 9, impact: 10.6, title: 10.95};

const Fonts = () => (
  <style>{`
    @font-face{font-family:Cairo;src:url(${staticFile("burger/Cairo-arabic.woff2")}) format("woff2");font-weight:200 1000;unicode-range:U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFF}
    @font-face{font-family:Cairo;src:url(${staticFile("burger/Cairo-latin.woff2")}) format("woff2");font-weight:200 1000}
    @font-face{font-family:"Kaushan Script";src:url(${staticFile("KaushanScript.woff2")}) format("woff2")}
  `}</style>
);

/* ---------- the burger's motion ---------- */
const LIFT = 300;
const hover = t => -LIFT + Math.sin((t - T.liftEnd) * 1.6) * 8;
function pose(t) {
  if (t < T.liftEnd) {
    const p = Easing.out(Easing.back(1.15))(t / T.liftEnd);
    return {y: -LIFT * p, s: 1 + 0.1 * Math.min(1, p), r: -Math.sin(Math.min(1, t / T.liftEnd) * Math.PI) * 2.5, sx: 1, sy: 1};
  }
  if (t < T.fall) return {y: hover(t), s: 1.1, r: Math.sin((t - T.liftEnd) * 1.1) * 1.2, sx: 1, sy: 1};
  if (t < T.impact) {
    const p = (t - T.fall) / (T.impact - T.fall), y0 = hover(T.fall), r0 = Math.sin((T.fall - T.liftEnd) * 1.1) * 1.2;
    return {y: y0 * (1 - p * p), s: 1.1 - 0.1 * p, r: r0 * (1 - p), sx: 1 - 0.02 * p, sy: 1 + 0.03 * p};
  }
  const u = Math.min(1, (t - T.impact) / 0.45);
  const squash = Math.max(0, 1 - u * 3.2);
  return {y: -26 * Math.sin(u * Math.PI) * (u > 0.12 ? 1 : 0), s: 1, r: 0, sx: 1 + 0.06 * squash, sy: 1 - 0.08 * squash};
}

/* ---------- table: kept sharp, with a slow 60 fps dolly, light sweep and salt glints ---------- */
const SALT = [[182,1035],[229,1040],[93,1043],[124,1047],[595,1060],[666,1061],[529,1068],[153,1070],[228,1070],[471,1070],[695,1071],[765,1073],
  [87,1074],[802,1075],[735,1079],[405,1082],[551,1089],[326,1091],[276,1094],[601,1101],[372,1106],[809,1107],[897,1107],[855,1112],[690,1114],
  [651,1115],[463,1116],[405,1118],[774,1119],[505,1120],[722,1120],[578,1126],[610,1139],[206,1183],[268,1215]];
const Table = ({t, shake}) => {
  const lifted = Math.max(0, -pose(t).y / LIFT);
  const dolly = 1.02 + 0.035 * (t / 12.5);
  const drift = Math.sin(t * 0.6) * 6;
  const sweep = ((t - 0.5) / 3.2) % 1;                 // a soft light passes over the slate every 3.2 s
  return (
    <AbsoluteFill style={{transform: `translate(${shake.x + drift}px,${shake.y}px) scale(${dolly})`, transformOrigin: "50% 80%"}}>
      <Img src={staticFile("burger/table.jpg")} style={{position: "absolute", width: PW * K, height: PH * K, left: W / 2 - CAM.fx * K, top: H / 2 - CAM.fy * K,
        filter: `brightness(${1 - 0.22 * lifted}) contrast(1.05) saturate(1.05)`}} />
      <div style={{position: "absolute", left: -300 + sweep * (W + 600), top: toY(1000), width: 260, height: 260, mixBlendMode: "screen",
        background: "radial-gradient(closest-side, rgba(255,214,150,.22), transparent)", transform: "scaleY(.45)"}} />
      {SALT.map(([x, y], i) => {
        const tw = Math.pow(Math.max(0, Math.sin(t * (1.6 + rnd(i) * 2.2) + i * 1.7)), 14);
        return <div key={i} style={{position: "absolute", left: toX(x) - 9, top: toY(y) - 9, width: 18, height: 18, opacity: tw,
          background: "radial-gradient(closest-side, #fff, rgba(255,240,200,.4) 40%, transparent)", transform: `rotate(45deg) scale(${0.6 + tw})`}} />;
      })}
    </AbsoluteFill>
  );
};

const Spot = ({t}) => {
  const p = pose(t), lifted = Math.max(0, -p.y / LIFT);
  return <AbsoluteFill style={{pointerEvents: "none", mixBlendMode: "screen",
    background: `radial-gradient(40% 32% at 50% ${(BY - B.h / 2 + p.y) / H * 100}%, rgba(255,200,110,${0.1 + 0.16 * lifted}), transparent 70%)`}} />;
};

const Shadow = ({t}) => {
  const p = pose(t), lifted = Math.min(1, Math.max(0, -p.y / LIFT));
  return <div style={{position: "absolute", left: BX - 330, top: BY - 50, width: 660, height: 90, borderRadius: "50%",
    background: "radial-gradient(closest-side, rgba(0,0,0,.9), transparent)", opacity: 0.92 - 0.62 * lifted,
    transform: `scale(${(1 - 0.35 * lifted) * p.sx}, ${1 - 0.3 * lifted})`, filter: `blur(${4 + 14 * lifted}px)`}} />;
};

/* ---------- lettuce flutter: a noise field slides back and forth and bends the leaves ---------- */
function lettuceAmp(t) {
  if (t < T.liftEnd) return 4 + 20 * Math.sin(Math.min(1, t / T.liftEnd) * Math.PI) + 6 * (t / T.liftEnd);
  if (t < T.fall) return 9 + 3 * Math.sin(t * 2.3);
  if (t < T.impact) return 9 + 12 * ((t - T.fall) / (T.impact - T.fall));
  return 22 * Math.exp(-(t - T.impact) * 4.5) * Math.abs(Math.cos((t - T.impact) * 18));
}
const LettuceFilter = ({t}) => {
  const dx = Math.sin(t * 5.3) * 22 + Math.sin(t * 2.1) * 12, dy = Math.cos(t * 4.1) * 10;
  return (
    <svg width="0" height="0" style={{position: "absolute"}}>
      <filter id="salade" x="-12%" y="-40%" width="124%" height="180%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.03 0.07" numOctaves="2" seed="4" result="bruit" />
        <feOffset in="bruit" dx={dx} dy={dy} result="vent" />
        <feDisplacementMap in="SourceGraphic" in2="vent" scale={lettuceAmp(t)} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
};

/* ---------- cheese: the slice sags, drips filled with the real cheese texture ---------- */
const DRIPS = [
  {x: 120, y: 290, len: 70, w: 30, at: 2.0, drop: false, bend: 3},
  {x: 217, y: 309, len: 104, w: 38, at: 2.3, drop: true, bend: -4},
  {x: 325, y: 324, len: 56, w: 26, at: 2.7, drop: false, bend: 2},
  {x: 411, y: 279, len: 128, w: 42, at: 2.15, drop: true, bend: 5},
  {x: 495, y: 280, len: 86, w: 32, at: 2.55, drop: false, bend: -3},
  {x: 627, y: 296, len: 62, w: 28, at: 2.85, drop: true, bend: 2},
];
function dripState(d, t, i) {
  const u = t - d.at;
  if (u <= 0) return null;
  // viscous flow: fast start, slows down, keeps creeping a little
  const grow = 1 - Math.exp(-u * 1.9);
  const len = d.len * grow + u * 3;
  const sway = Math.sin(t * 2.6 + i) * 1.4;
  const neckK = 1 - 0.38 * Math.min(1, len / d.len);
  return {len, bend: d.bend + sway, neck: d.w * 0.3 * neckK, bulb: d.w * 0.3 + Math.min(len, 90) * 0.075};
}
const dripPath = (x, y, s, w) => {
  const L = Math.max(s.len, 2), r = w / 2, xb = x + s.bend * (L / 60), yb = y + L, n = s.neck, b = s.bulb;
  return `M${x - r * 1.6} ${y - 12} C${x - r} ${y + 4} ${x - n * 1.3} ${y + L * 0.35} ${xb - n} ${yb - b * 1.15}
    C${xb - b * 1.2} ${yb - b * 0.45} ${xb - b * 1.02} ${yb + b * 0.92} ${xb} ${yb + b}
    C${xb + b * 1.02} ${yb + b * 0.92} ${xb + b * 1.2} ${yb - b * 0.45} ${xb + n} ${yb - b * 1.15}
    C${x + n * 1.3} ${y + L * 0.35} ${x + r} ${y + 4} ${x + r * 1.6} ${y - 12} Z`;
};
const Drips = ({t}) => (
  <>
    {DRIPS.map((d, i) => {
      const s = dripState(d, t, i);
      if (!s) return null;
      const path = dripPath(d.x, d.y, s, d.w).replace(/\s+/g, " ");   // CSS path() needs one line
      const xb = d.x + s.bend * (s.len / 60), tipY = d.y + s.len + s.bulb;
      const fade = `linear-gradient(180deg, transparent ${d.y - 16}px, #000 ${d.y + 8}px)`;
      // drop that pinches off and falls, with a thin thread for a moment
      const td = t - (d.at + 1.6);
      const dropY = tipY + 8 + 1100 * td * td;
      return (
        <div key={i} style={{position: "absolute", inset: 0, WebkitMaskImage: fade, maskImage: fade, filter: "drop-shadow(0 4px 3px rgba(60,25,0,.55))"}}>
          <div style={{position: "absolute", inset: 0, clipPath: `path('${path}')`}}>
            <Img src={staticFile("burger/cheese-tex.jpg")} style={{position: "absolute", left: d.x - 200, top: d.y - 20 - (t - d.at) * 14, width: 400, height: 360}} />
            {/* rounded volume: darker edges, warm core, soft sheen */}
            <div style={{position: "absolute", left: xb - d.w, top: d.y - 20, width: d.w * 2, height: s.len + s.bulb * 2 + 40,
              background: "linear-gradient(90deg, rgba(150,60,0,.55), rgba(255,170,30,0) 30%, rgba(255,245,200,.35) 52%, rgba(255,170,30,0) 68%, rgba(140,55,0,.6))"}} />
          </div>
          <svg width={CUT.w} height={CUT.h} style={{position: "absolute", inset: 0, overflow: "visible"}}>
            <path d={`M${d.x - d.w * 0.28} ${d.y + 4} Q${d.x - d.w * 0.18} ${d.y + s.len * 0.45} ${xb - s.neck * 0.5} ${d.y + s.len * 0.8}`}
              stroke="rgba(255,252,230,.55)" strokeWidth={Math.max(1.5, d.w * 0.07)} strokeLinecap="round" fill="none" />
            <ellipse cx={xb - s.bulb * 0.35} cy={tipY - s.bulb * 0.55} rx={s.bulb * 0.2} ry={s.bulb * 0.3} fill="rgba(255,253,235,.85)" />
            {d.drop && td > 0 && td < 0.55 && (
              <g opacity={1 - td / 0.55}>
                {td < 0.09 && <line x1={xb} y1={tipY - 2} x2={xb} y2={dropY} stroke="#F5AE22" strokeWidth={2.5 * (1 - td / 0.09)} />}
                <ellipse cx={xb} cy={dropY} rx={d.w * 0.2} ry={d.w * (0.26 + td * 0.6)} fill="#F7B12A" />
                <ellipse cx={xb - d.w * 0.06} cy={dropY - d.w * 0.08} rx={d.w * 0.05} ry={d.w * 0.08} fill="rgba(255,255,240,.8)" />
              </g>
            )}
          </svg>
        </div>
      );
    })}
  </>
);

/* ---------- dense steam ---------- */
const SOURCES = [
  {x: 85, y: 330, h: 560}, {x: 660, y: 318, h: 580}, {x: 210, y: 252, h: 640}, {x: 495, y: 252, h: 660}, {x: 380, y: 262, h: 700},
  {x: 300, y: 20, h: 560}, {x: 440, y: 0, h: 600}, {x: 585, y: 30, h: 540}, {x: 140, y: 290, h: 520}, {x: 600, y: 290, h: 560},
  {x: 250, y: 120, h: 520}, {x: 520, y: 110, h: 540},
];
const Steam = ({t, layer}) => {
  const env = lerp(t, T.steam[0] - 0.2, T.steam[0] + 0.6, 0, 1) * lerp(t, T.steam[1] - 0.7, T.steam[1] + 0.1, 1, 0);
  if (env <= 0) return null;
  const tt = t - T.steam[0] + 0.2;
  const back = layer === "back";
  return (
    <svg width={CUT.w} height={CUT.h} style={{position: "absolute", inset: 0, overflow: "visible", mixBlendMode: "screen"}}>
      <defs>
        <filter id={`vapeur-${layer}`} x="-100%" y="-120%" width="300%" height="340%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="3" seed={back ? 11 : 7} result="b" />
          <feOffset in="b" dx={Math.sin(t * 0.9) * 30} dy={-t * 40 % 200} result="m" />
          <feDisplacementMap in="SourceGraphic" in2="m" scale="60" />
          <feGaussianBlur stdDeviation={back ? 10 : 6} />
        </filter>
      </defs>
      <g filter={`url(#vapeur-${layer})`} opacity={env * (back ? 0.85 : 0.55)}>
        {/* soft billows rising and swelling */}
        {Array.from({length: back ? 14 : 18}).map((_, i) => {
          const id = i + (back ? 100 : 0), s = SOURCES[id % SOURCES.length];
          const life = 1.6 + rnd(id) * 1.2, u = ((tt + rnd(id + 1) * life) % life) / life;
          const y = s.y - u * s.h * 0.85, x = s.x + Math.sin(u * 5 + id) * (20 + u * 50);
          const rr = 24 + u * 90 * (0.7 + rnd(id + 2) * 0.6);
          return <circle key={`p${id}`} cx={x} cy={y} r={rr} fill="#fff" opacity={Math.sin(u * Math.PI) * (back ? 0.38 : 0.26)} />;
        })}
        {/* long wisps */}
        {SOURCES.flatMap((s, i) => [0, 1].map(k => {
          const id = i * 2 + k + (back ? 50 : 0);
          const rise = Math.min(1, (tt - rnd(id) * 0.6) / 1.0);
          if (rise <= 0) return null;
          const len = s.h * (0.6 + 0.4 * rnd(id + 3)) * rise;
          const pts = [];
          for (let y = 0; y <= len; y += 12) pts.push(`${s.x + k * 22 + Math.sin(y * 0.02 - tt * 2.6 + id) * (10 + y * 0.1)},${s.y - y}`);
          return (
            <g key={id}>
              <linearGradient id={`v-${layer}-${id}`} gradientUnits="userSpaceOnUse" x1="0" y1={s.y} x2="0" y2={s.y - len}>
                <stop offset="0" stopColor="#fff" stopOpacity={0.1} /><stop offset=".22" stopColor="#fff" stopOpacity={back ? 0.7 : 0.5} /><stop offset="1" stopColor="#fff" stopOpacity={0} />
              </linearGradient>
              <polyline points={pts.join(" ")} fill="none" stroke={`url(#v-${layer}-${id})`} strokeWidth={(back ? 30 : 18) + rnd(id + 5) * (back ? 40 : 26)} strokeLinecap="round" />
            </g>
          );
        }))}
      </g>
    </svg>
  );
};

/* ---------- the burger, built from its layers ---------- */
const Burger = ({t, shake}) => {
  const p = pose(t);
  const sag = lerp(t, T.cheese[0], T.cheese[1], 0, 1, Easing.out(Easing.quad));
  return (
    <div style={{position: "absolute", left: B.left + shake.x, top: B.top + shake.y, width: B.w, height: B.h, transformOrigin: "50% 100%",
      transform: `translateY(${p.y}px) rotate(${p.r}deg) scale(${p.s * p.sx}, ${p.s * p.sy})`}}>
      <div style={{position: "absolute", left: 0, top: 0, width: CUT.w, height: CUT.h, transformOrigin: "0 0", transform: `scale(${B.w / CUT.w})`}}>
        <Steam t={t} layer="back" />
        <Img src={staticFile("burger/burger-base.png")} style={{position: "absolute", inset: 0, width: CUT.w, height: CUT.h, filter: "drop-shadow(0 18px 30px rgba(0,0,0,.55))"}} />
        <Img src={staticFile("burger/lettuce.png")} style={{position: "absolute", inset: 0, width: CUT.w, height: CUT.h, filter: "url(#salade)"}} />
        <Img src={staticFile("burger/cheese.png")} style={{position: "absolute", inset: 0, width: CUT.w, height: CUT.h, transformOrigin: "50% 250px",
          transform: `scaleY(${1 + 0.05 * sag}) translateY(${sag * 3}px)`}} />
        <Drips t={t} />
        <Steam t={t} layer="front" />
      </div>
    </div>
  );
};

/* ---------- motion-design layers ---------- */
const RiseRings = ({t}) => {
  if (t > 2.6) return null;
  const p = pose(t);
  return [0, 0.45, 0.9, 1.35].map((d, i) => {
    const u = (t - d) / 1.1;
    if (u < 0 || u > 1) return null;
    return <div key={i} style={{position: "absolute", left: BX - 300, top: BY + p.y * 0.35 - 40, width: 600, height: 80, borderRadius: "50%",
      border: "3px solid #E9C46A", opacity: (1 - u) * 0.85, transform: `scale(${0.6 + u * 0.95})`, boxShadow: "0 0 18px rgba(233,196,106,.6)"}} />;
  });
};

// light streaks below the burger while it lifts off (wind)
const LiftStreaks = ({t}) => {
  if (t > 2.2) return null;
  const p = pose(t), k = Math.sin(Math.min(1, t / 2) * Math.PI);
  return Array.from({length: 12}).map((_, i) => {
    const x = B.left + 80 + rnd(i + 30) * (B.w - 160);
    const y = BY + p.y + 10 + ((t * 700 + rnd(i) * 220) % 220);
    return <div key={i} style={{position: "absolute", left: x, top: y, width: 3, height: 50 + 90 * rnd(i + 2), borderRadius: 2,
      background: "linear-gradient(rgba(255,231,163,.8), transparent)", opacity: k}} />;
  });
};

const Orbit = ({t, front}) => {
  const env = lerp(t, 1.6, 2.4, 0, 1) * lerp(t, T.fall - 0.4, T.fall + 0.2, 1, 0);
  if (env <= 0) return null;
  const p = pose(t);
  const cx = BX, cy = BY - B.h * 0.55 + p.y, rx = 470, ry = 95;
  const arc = front ? `M${cx - rx} ${cy} A${rx} ${ry} 0 0 0 ${cx + rx} ${cy}` : `M${cx - rx} ${cy} A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`;
  return (
    <svg width={W} height={H} style={{position: "absolute", inset: 0, pointerEvents: "none", opacity: env}}>
      <path d={arc} fill="none" stroke="#E9C46A" strokeWidth={front ? 2.5 : 1.5} strokeDasharray="14 12" strokeDashoffset={-t * 80} opacity={front ? 0.8 : 0.4} />
      {[0, 1, 2].map(i => {
        const a = t * 1.3 + (i * Math.PI * 2) / 3;
        if ((Math.sin(a) > 0) !== front) return null;
        return <circle key={i} cx={cx + Math.cos(a) * rx} cy={cy + Math.sin(a) * ry} r={front ? 9 : 6} fill="#FFE7A3" style={{filter: "drop-shadow(0 0 10px #FFB347)"}} />;
      })}
    </svg>
  );
};

const FallLines = ({t}) => {
  if (t < T.fall || t > T.impact + 0.1) return null;
  const p = pose(t), speed = (t - T.fall) / (T.impact - T.fall);
  return Array.from({length: 14}).map((_, i) => {
    const x = B.left + 60 + rnd(i) * (B.w - 120);
    const len = 60 + 160 * speed * rnd(i + 2);
    const y = B.top + p.y - 30 - rnd(i + 4) * 120 - ((t * 900 + rnd(i) * 300) % 200);
    return <div key={i} style={{position: "absolute", left: x, top: y, width: 3, height: len, borderRadius: 2,
      background: "linear-gradient(transparent, rgba(255,231,163,.85))", opacity: speed}} />;
  });
};

const Impact = ({t}) => {
  const u = t - T.impact;
  if (u < 0 || u > 1.2) return null;
  const wave = Math.min(1, u / 0.6);
  return (
    <>
      <div style={{position: "absolute", left: BX - 360, top: BY - 45, width: 720, height: 90, borderRadius: "50%", border: "4px solid #F2D27C",
        opacity: (1 - wave) * 0.9, transform: `scale(${0.7 + wave * 0.8})`, boxShadow: "0 0 30px rgba(242,210,124,.7)"}} />
      {Array.from({length: 46}).map((_, i) => {
        const side = rnd(i) > 0.5 ? 1 : -1;
        const vx = side * (120 + rnd(i + 1) * 520), vy = -(260 + rnd(i + 2) * 620);
        const x = BX + side * (180 + rnd(i + 3) * 120) + vx * u, y = BY - 20 + vy * u + 1400 * u * u;
        const size = 3 + rnd(i + 4) * 7;
        return <div key={i} style={{position: "absolute", left: x, top: y, width: size, height: size, borderRadius: rnd(i + 5) > 0.5 ? "50%" : 2,
          background: rnd(i + 6) > 0.45 ? "#F4F1EA" : "#F2C14E", opacity: Math.max(0, 1 - u / 1.1), transform: `rotate(${u * 400 * side}deg)`}} />;
      })}
    </>
  );
};

const Embers = ({t, count = 60}) => (
  <AbsoluteFill style={{pointerEvents: "none"}}>
    {Array.from({length: count}).map((_, i) => {
      const burst = t > T.impact && t < T.impact + 1 ? 1 + (T.impact + 1 - t) * 1.5 : 1;
      const speed = (110 + rnd(i) * 260) * burst, size = 2 + rnd(i + 7) * 5;
      const y = H + 40 - ((t * speed + rnd(i + 3) * 1600) % (H + 120));
      const x = rnd(i + 11) * W + Math.sin(t * (2 + rnd(i) * 2) + i) * 26;
      const flick = 0.45 + 0.55 * Math.abs(Math.sin(t * (6 + rnd(i + 5) * 8) + i));
      return <div key={i} style={{position: "absolute", left: x, top: y, width: size, height: size * 1.8, borderRadius: size,
        background: rnd(i + 9) > 0.5 ? "#FFB347" : "#FFD27A", opacity: flick * interpolate(y, [0, 300], [0, 1], clamp),
        boxShadow: `0 0 ${size * 3}px ${size}px rgba(255,140,40,.5)`}} />;
    })}
  </AbsoluteFill>
);

/* ---------- captions (bottom) and final title (top) ---------- */
const PHASES = [
  {a: 0.15, b: T.liftEnd, t: "لحظة التحضير"},
  {a: T.cheese[0], b: T.cheese[1], t: "جبنة شيدر ذائبة"},
  {a: T.steam[0], b: T.steam[1], t: "ساخن من الشواية"},
  {a: T.fall, b: T.title, t: "جاهز على طاولتك"},
];
const Caption = ({t}) => (
  <>
    {PHASES.map(ph => {
      const inn = lerp(t, ph.a, ph.a + 0.35, 0, 1, Easing.out(Easing.cubic));
      const out = lerp(t, ph.b - 0.25, ph.b, 0, 1);
      if (inn <= 0 || out >= 1) return null;
      return (
        <div key={ph.t} style={{position: "absolute", top: 1160, width: "100%", display: "grid", justifyItems: "center", gap: 12,
          opacity: inn * (1 - out), transform: `translateY(${(1 - inn) * 30 - out * 20}px)`}}>
          <div style={{...ar, fontSize: 64, fontWeight: 900, color: "transparent", backgroundImage: GOLD, backgroundSize: "250% 100%",
            backgroundPosition: `${(t * 90) % 250}% 50%`, WebkitBackgroundClip: "text", backgroundClip: "text", filter: "drop-shadow(0 4px 12px rgba(0,0,0,.8))"}}>{ph.t}</div>
          <div style={{width: 280, height: 3, background: "rgba(233,196,106,.25)", borderRadius: 2, overflow: "hidden"}}>
            <div style={{width: "100%", height: "100%", background: "#E9C46A", transformOrigin: "right", transform: `scaleX(${lerp(t, ph.a, ph.b, 0, 1)})`}} />
          </div>
        </div>
      );
    })}
  </>
);

const Title = ({t}) => {
  const p = lerp(t, T.title, T.title + 0.5, 0, 1, Easing.out(Easing.cubic));
  if (p <= 0) return null;
  return (
    <div style={{position: "absolute", top: 110, width: "100%", display: "grid", justifyItems: "center", gap: 4}}>
      <div style={{clipPath: `inset(0 0 0 ${(1 - p) * 100}%)`, ...ar, fontSize: 128, fontWeight: 900, lineHeight: 1.25, color: "transparent",
        backgroundImage: GOLD, backgroundSize: "250% 100%", backgroundPosition: `${(t * 100) % 250}% 50%`, WebkitBackgroundClip: "text", backgroundClip: "text",
        filter: "drop-shadow(0 6px 14px rgba(0,0,0,.8))"}}>
        برغر <span style={{fontFamily: "Kaushan Script", fontWeight: 400, direction: "ltr", unicodeBidi: "isolate", marginRight: 14}}>La Ruche</span>
      </div>
      <div style={{...ar, fontSize: 34, fontWeight: 700, color: "#F6F1E6", opacity: lerp(t, T.title + 0.35, T.title + 0.75, 0, 1), direction: "ltr"}}>Les Mureaux · 01 30 04 94 76</div>
    </div>
  );
};

const Frame = ({t}) => {
  const d = lerp(t, 0, 1.2, 0, 1, Easing.inOut(Easing.cubic)), per = 2 * (W - 60 + H - 60);
  return (
    <svg width={W} height={H} style={{position: "absolute", inset: 0, pointerEvents: "none"}}>
      <rect x="30" y="30" width={W - 60} height={H - 60} fill="none" stroke="#C9A24A" strokeWidth="2" strokeDasharray={per} strokeDashoffset={per * (1 - d)} opacity=".85" />
    </svg>
  );
};

export const BurgerRise = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const t = f / fps;
  const k = t >= T.impact && t < T.impact + 0.35 ? (T.impact + 0.35 - t) / 0.35 : 0;
  const shake = {x: Math.sin(t * 95) * 12 * k, y: Math.cos(t * 120) * 9 * k};
  const flash = t >= T.impact ? lerp(t, T.impact, T.impact + 0.25, 0.16, 0) : 0;
  return (
    <AbsoluteFill style={{background: "#060607", overflow: "hidden"}}>
      <Fonts />
      <LettuceFilter t={t} />
      <Table t={t} shake={shake} />
      <Spot t={t} />
      <Shadow t={t} />
      <RiseRings t={t} />
      <LiftStreaks t={t} />
      <Orbit t={t} front={false} />
      <FallLines t={t} />
      <Burger t={t} shake={shake} />
      <Orbit t={t} front />
      <Impact t={t} />
      <Embers t={t} />
      <AbsoluteFill style={{pointerEvents: "none", background: "radial-gradient(85% 70% at 50% 55%, transparent 55%, rgba(0,0,0,.7) 100%)"}} />
      <Caption t={t} />
      <Title t={t} />
      <Frame t={t} />
      <AbsoluteFill style={{background: "#000", opacity: lerp(t, 0, 0.35, 1, 0), pointerEvents: "none"}} />
      <AbsoluteFill style={{background: "#FFE9B0", opacity: flash, mixBlendMode: "screen", pointerEvents: "none"}} />
    </AbsoluteFill>
  );
};
