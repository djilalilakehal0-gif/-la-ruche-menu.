import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing} from "remotion";

/*
  "برغر La Ruche" — levitating burger, 60 fps, 1080×1350.
    0–4 s    the burger rises
    4–7 s    cheese drips down over the patty
    7–11 s   steam rises from the meat
    11–13 s  the burger comes back down onto the slate
    13–14 s  title
  Layers: public/burger/table.jpg (background without burger) and
  public/burger/burger-cut.png (the burger alone, cut out of plate.jpg at 239,466).
*/
export const RISE_FPS = 60;
export const RISE_DURATION = 14 * RISE_FPS;

const W = 1080, H = 1350;
const PW = 1164, PH = 1300, K = Math.max(W / PW, H / PH);
const CAM = {fx: 582, fy: 690};
const CUT = {x: 239, y: 466, w: 704, h: 623};                 // burger-cut.png in plate pixels
const toX = px => W / 2 + (px - CAM.fx) * K;
const toY = py => H / 2 + (py - CAM.fy) * K;
const B = {left: toX(CUT.x), top: toY(CUT.y), w: CUT.w * K, h: CUT.h * K};   // burger on screen at rest
const BX = B.left + B.w / 2, BY = B.top + B.h;                               // bottom centre of the burger

const GOLD = "linear-gradient(100deg,#8A6420 0%,#E9C46A 22%,#FFF1BF 34%,#D4A646 48%,#9C7428 66%,#F2D27C 82%,#B8892E 100%)";
const ar = {fontFamily: "Cairo", direction: "rtl"};
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"};
const rnd = i => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
const lerp = (t, a, b, from, to, easing) => interpolate(t, [a, b], [from, to], {...clamp, easing});

const Fonts = () => (
  <style>{`
    @font-face{font-family:Cairo;src:url(${staticFile("burger/Cairo-arabic.woff2")}) format("woff2");font-weight:200 1000;unicode-range:U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFF}
    @font-face{font-family:Cairo;src:url(${staticFile("burger/Cairo-latin.woff2")}) format("woff2");font-weight:200 1000}
    @font-face{font-family:"Kaushan Script";src:url(${staticFile("KaushanScript.woff2")}) format("woff2")}
  `}</style>
);

/* ---------- the burger's motion (seconds → offset, scale, tilt, squash) ---------- */
const LIFT = 300;
const hover = t => -LIFT + Math.sin((t - 4) * 1.6) * 8;
function pose(t) {
  if (t < 4) {
    const p = Easing.inOut(Easing.cubic)(t / 4);
    return {y: -LIFT * p, s: 1 + 0.1 * p, r: -Math.sin(p * Math.PI) * 2.2, sx: 1, sy: 1};
  }
  if (t < 11) return {y: hover(t), s: 1.1, r: Math.sin((t - 4) * 1.1) * 1.2, sx: 1, sy: 1};
  if (t < 12.2) {                                   // falls with gravity
    const p = (t - 11) / 1.2, y0 = hover(11), r0 = Math.sin(7 * 1.1) * 1.2;
    return {y: y0 * (1 - p * p), s: 1.1 - 0.1 * p, r: r0 * (1 - p), sx: 1 - 0.02 * p, sy: 1 + 0.03 * p};
  }
  const u = Math.min(1, (t - 12.2) / 0.45);        // impact: squash, small bounce, settle
  const squash = Math.max(0, 1 - u * 3.2);
  return {y: -26 * Math.sin(u * Math.PI) * (u > 0.12 ? 1 : 0), s: 1, r: 0, sx: 1 + 0.06 * squash, sy: 1 - 0.08 * squash};
}

/* ---------- background, light and shadow ---------- */
const Table = ({t, shake}) => {
  const lifted = -pose(t).y / LIFT;
  return (
    <AbsoluteFill style={{transform: `translate(${shake.x}px,${shake.y}px) scale(${1.02 + 0.03 * lifted})`}}>
      <Img src={staticFile("burger/table.jpg")} style={{position: "absolute", width: PW * K, height: PH * K, left: W / 2 - CAM.fx * K, top: H / 2 - CAM.fy * K,
        filter: `blur(${5 * lifted}px) brightness(${1 - 0.3 * lifted})`}} />
    </AbsoluteFill>
  );
};

const Spot = ({t}) => {
  const p = pose(t), lifted = -p.y / LIFT;
  return <AbsoluteFill style={{pointerEvents: "none", mixBlendMode: "screen",
    background: `radial-gradient(40% 32% at 50% ${(BY - B.h / 2 + p.y) / H * 100}%, rgba(255,200,110,${0.1 + 0.18 * lifted}), transparent 70%)`}} />;
};

const Shadow = ({t}) => {
  const p = pose(t), lifted = Math.min(1, -p.y / LIFT);
  return <div style={{position: "absolute", left: BX - 330, top: BY - 50, width: 660, height: 90, borderRadius: "50%",
    background: "radial-gradient(closest-side, rgba(0,0,0,.85), transparent)", opacity: 0.9 - 0.65 * lifted,
    transform: `scale(${(1 - 0.35 * lifted) * p.sx}, ${1 - 0.3 * lifted})`, filter: `blur(${4 + 14 * lifted}px)`}} />;
};

/* ---------- cheese drips (drawn in burger-cut pixel space, so they move with the burger) ---------- */
const DRIPS = [
  {x: 95, y: 290, len: 62, w: 26, at: 4.0, drop: false, bend: 3},
  {x: 192, y: 309, len: 98, w: 34, at: 4.3, drop: true, bend: -4},
  {x: 300, y: 324, len: 48, w: 22, at: 4.7, drop: false, bend: 2},
  {x: 386, y: 279, len: 122, w: 38, at: 4.15, drop: true, bend: 5},
  {x: 470, y: 280, len: 80, w: 28, at: 4.55, drop: false, bend: -3},
  {x: 602, y: 296, len: 56, w: 24, at: 4.85, drop: true, bend: 2},
];
// organic drip: wide shoulder melting out of the cheese, narrowing body, round drop at the tip
const dripPath = (x, y, len, w, bend) => {
  const L = Math.max(len, 2), r = w / 2, neck = w * 0.27, bulb = w * 0.36 + Math.min(L, 60) * 0.06;
  const xb = x + bend * (L / 60), yb = y + L;
  return `M${x - r * 1.5} ${y - 10}
          C${x - r} ${y + 2} ${x - neck * 1.2} ${y + L * 0.35} ${xb - neck} ${yb - bulb * 1.1}
          C${xb - bulb * 1.15} ${yb - bulb * 0.4} ${xb - bulb} ${yb + bulb * 0.9} ${xb} ${yb + bulb * 0.95}
          C${xb + bulb} ${yb + bulb * 0.9} ${xb + bulb * 1.15} ${yb - bulb * 0.4} ${xb + neck} ${yb - bulb * 1.1}
          C${x + neck * 1.2} ${y + L * 0.35} ${x + r} ${y + 2} ${x + r * 1.5} ${y - 10} Z`;
};
const Cheese = ({t}) => {
  if (t < 3.9) return null;
  return (
    <svg width={B.w} height={B.h} viewBox={`0 0 ${CUT.w} ${CUT.h}`} style={{position: "absolute", inset: 0, overflow: "visible"}}>
      <defs>
        <linearGradient id="fromage" x1="0" x2="1">
          <stop offset="0" stopColor="#D9890C" /><stop offset=".3" stopColor="#F5AE22" /><stop offset=".5" stopColor="#FFC93F" /><stop offset=".72" stopColor="#F3A91E" /><stop offset="1" stopColor="#C97B08" />
        </linearGradient>
        <filter id="ombre" x="-50%" y="-20%" width="200%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#4A2200" floodOpacity=".45" /></filter>
      </defs>
      {DRIPS.map((d, i) => {
        const grow = lerp(t, d.at, d.at + 1.8, 0, 1, Easing.out(Easing.cubic)) + lerp(t, d.at + 1.8, 7, 0, 0.1);
        const len = d.len * grow;
        const xb = d.x + d.bend * (len / 60);
        const td = t - (d.at + 1.85);
        const dropY = d.y + d.len * 1.1 + 18 + 900 * td * td;
        return (
          <g key={i} filter="url(#ombre)" opacity={lerp(t, d.at, d.at + 0.25, 0, 1)} mask={`url(#fondu${i})`}>
            <mask id={`fondu${i}`} maskUnits="userSpaceOnUse" x={d.x - 80} y={d.y - 40} width="160" height={d.len * 1.3 + 120}>
              <linearGradient id={`fg${i}`} gradientUnits="userSpaceOnUse" x1="0" y1={d.y - 14} x2="0" y2={d.y + 8}>
                <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity="1" />
              </linearGradient>
              <rect x={d.x - 80} y={d.y - 40} width="160" height={d.len * 1.3 + 120} fill={`url(#fg${i})`} />
            </mask>
            <path d={dripPath(d.x, d.y, len, d.w, d.bend)} fill="url(#fromage)" />
            <ellipse cx={xb - d.w * 0.12} cy={d.y + len * 0.92} rx={d.w * 0.09} ry={d.w * 0.16} fill="rgba(255,250,220,.75)" />
            <path d={`M${d.x - d.w * 0.32} ${d.y + 2} Q${d.x - d.w * 0.2} ${d.y + len * 0.4} ${xb - d.w * 0.12} ${d.y + len * 0.75}`}
              stroke="rgba(255,240,190,.35)" strokeWidth={d.w * 0.1} strokeLinecap="round" fill="none" />
            {d.drop && td > 0 && td < 0.6 && (
              <ellipse cx={d.x + d.bend * 2} cy={dropY} rx={d.w * 0.22} ry={d.w * (0.28 + td * 0.7)} fill="url(#fromage)" opacity={1 - td / 0.6} />
            )}
          </g>
        );
      })}
    </svg>
  );
};

/* ---------- steam rising from the meat ---------- */
const SOURCES = [
  {x: 70, y: 330, h: 520}, {x: 640, y: 318, h: 540}, {x: 190, y: 250, h: 600}, {x: 470, y: 250, h: 620},
  {x: 300, y: 20, h: 520}, {x: 420, y: 0, h: 560}, {x: 560, y: 30, h: 500}, {x: 360, y: 260, h: 640},
];
const Steam = ({t}) => {
  const env = lerp(t, 7, 7.7, 0, 1) * lerp(t, 10.3, 11, 1, 0);
  if (env <= 0) return null;
  const tt = t - 7;
  return (
    <svg width={B.w} height={B.h} viewBox={`0 0 ${CUT.w} ${CUT.h}`} style={{position: "absolute", inset: 0, overflow: "visible", mixBlendMode: "screen"}}>
      <defs>
        <filter id="vapeur" x="-100%" y="-100%" width="300%" height="300%">
          <feTurbulence type="fractalNoise" baseFrequency="0.013 0.035" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="46" />
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <g filter="url(#vapeur)" opacity={env}>
        {SOURCES.flatMap((s, i) => [0, 1].map(k => {
          const id = i * 2 + k;
          const rise = Math.min(1, (tt - rnd(id) * 0.9) / 1.2);      // each wisp grows upward
          if (rise <= 0) return null;
          const len = s.h * (0.55 + 0.45 * rnd(id + 3)) * rise;
          const pts = [];
          for (let y = 0; y <= len; y += 12) {
            const amp = 8 + y * 0.09;
            pts.push(`${s.x + k * 18 + Math.sin(y * 0.022 - tt * 2.4 + id) * amp},${s.y - y}`);
          }
          return (
            <g key={id}>
              <linearGradient id={`v${id}`} gradientUnits="userSpaceOnUse" x1="0" y1={s.y} x2="0" y2={s.y - len}>
                <stop offset="0" stopColor="#fff" stopOpacity={0.05} /><stop offset=".25" stopColor="#fff" stopOpacity={0.45} /><stop offset="1" stopColor="#fff" stopOpacity={0} />
              </linearGradient>
              <polyline points={pts.join(" ")} fill="none" stroke={`url(#v${id})`} strokeWidth={14 + rnd(id + 5) * 22} strokeLinecap="round" />
            </g>
          );
        }))}
      </g>
    </svg>
  );
};

/* ---------- the burger itself ---------- */
const Burger = ({t, shake}) => {
  const p = pose(t);
  return (
    <div style={{position: "absolute", left: B.left + shake.x, top: B.top + shake.y, width: B.w, height: B.h, transformOrigin: "50% 100%",
      transform: `translateY(${p.y}px) rotate(${p.r}deg) scale(${p.s * p.sx}, ${p.s * p.sy})`}}>
      <Img src={staticFile("burger/burger-cut.png")} style={{width: "100%", height: "100%", filter: "drop-shadow(0 18px 30px rgba(0,0,0,.55))"}} />
      <Cheese t={t} />
      <Steam t={t} />
    </div>
  );
};

/* ---------- motion-design layers ---------- */
// gold pulse rings under the burger while it rises
const RiseRings = ({t}) => {
  if (t > 4.6) return null;
  const p = pose(t);
  return [0, 0.8, 1.6, 2.4].map((d, i) => {
    const u = (t - d) / 1.4;
    if (u < 0 || u > 1) return null;
    return <div key={i} style={{position: "absolute", left: BX - 300, top: BY + p.y * 0.35 - 40, width: 600, height: 80, borderRadius: "50%",
      border: "3px solid #E9C46A", opacity: (1 - u) * 0.8, transform: `scale(${0.6 + u * 0.9})`, boxShadow: "0 0 18px rgba(233,196,106,.6)"}} />;
  });
};

// tilted orbit around the hovering burger; back half drawn behind, front half in front
const Orbit = ({t, front}) => {
  const env = lerp(t, 3.6, 4.4, 0, 1) * lerp(t, 10.6, 11.2, 1, 0);
  if (env <= 0) return null;
  const p = pose(t);
  const cx = BX, cy = BY - B.h * 0.55 + p.y, rx = 470, ry = 95;
  const arc = front ? `M${cx - rx} ${cy} A${rx} ${ry} 0 0 0 ${cx + rx} ${cy}` : `M${cx - rx} ${cy} A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`;
  const dots = [0, 1, 2].map(i => t * 1.3 + (i * Math.PI * 2) / 3);
  return (
    <svg width={W} height={H} style={{position: "absolute", inset: 0, pointerEvents: "none", opacity: env}}>
      <path d={arc} fill="none" stroke="#E9C46A" strokeWidth={front ? 2.5 : 1.5} strokeDasharray="14 12" strokeDashoffset={-t * 80} opacity={front ? 0.85 : 0.4} />
      {dots.map((a, i) => {
        const isFront = Math.sin(a) > 0;
        if (isFront !== front) return null;
        return <circle key={i} cx={cx + Math.cos(a) * rx} cy={cy + Math.sin(a) * ry} r={front ? 9 : 6} fill="#FFE7A3" style={{filter: "drop-shadow(0 0 10px #FFB347)"}} />;
      })}
    </svg>
  );
};

// streaks above the burger while it falls
const FallLines = ({t}) => {
  if (t < 11 || t > 12.3) return null;
  const p = pose(t), speed = (t - 11) / 1.2;
  return Array.from({length: 14}).map((_, i) => {
    const x = B.left + 60 + rnd(i) * (B.w - 120);
    const len = 60 + 160 * speed * rnd(i + 2);
    const y = B.top + p.y - 30 - rnd(i + 4) * 120 - ((t * 900 + rnd(i) * 300) % 200);
    return <div key={i} style={{position: "absolute", left: x, top: y, width: 3, height: len, borderRadius: 2,
      background: "linear-gradient(transparent, rgba(255,231,163,.85))", opacity: speed}} />;
  });
};

// impact: shockwave on the slate + crumbs and salt flying
const Impact = ({t}) => {
  const u = t - 12.2;
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
      const burst = t > 12.2 && t < 13.2 ? 1 + (13.2 - t) * 1.5 : 1;   // faster after the impact
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

/* ---------- captions for each phase, with a progress line ---------- */
const PHASES = [
  {a: 0.3, b: 4, t: "لحظة التحضير"},
  {a: 4, b: 7, t: "جبنة شيدر ذائبة"},
  {a: 7, b: 11, t: "ساخن من الشواية"},
  {a: 11, b: 12.9, t: "جاهز على طاولتك"},
];
const Caption = ({t}) => (
  <>
    {PHASES.map(ph => {
      const inn = lerp(t, ph.a, ph.a + 0.4, 0, 1, Easing.out(Easing.cubic));
      const out = lerp(t, ph.b - 0.3, ph.b, 0, 1);
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
  const p = lerp(t, 12.75, 13.25, 0, 1, Easing.out(Easing.cubic));
  if (p <= 0) return null;
  return (
    <div style={{position: "absolute", top: 110, width: "100%", display: "grid", justifyItems: "center", gap: 4}}>
      <div style={{clipPath: `inset(0 0 0 ${(1 - p) * 100}%)`, ...ar, fontSize: 128, fontWeight: 900, lineHeight: 1.25, color: "transparent",
        backgroundImage: GOLD, backgroundSize: "250% 100%", backgroundPosition: `${(t * 100) % 250}% 50%`, WebkitBackgroundClip: "text", backgroundClip: "text",
        filter: "drop-shadow(0 6px 14px rgba(0,0,0,.8))"}}>
        برغر <span style={{fontFamily: "Kaushan Script", fontWeight: 400, direction: "ltr", unicodeBidi: "isolate", marginRight: 14}}>La Ruche</span>
      </div>
      <div style={{...ar, fontSize: 34, fontWeight: 700, color: "#F6F1E6", opacity: lerp(t, 13.1, 13.5, 0, 1), direction: "ltr"}}>Les Mureaux · 01 30 04 94 76</div>
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
  const k = t >= 12.2 && t < 12.55 ? (12.55 - t) / 0.35 : 0;
  const shake = {x: Math.sin(t * 95) * 12 * k, y: Math.cos(t * 120) * 9 * k};
  const flash = t >= 12.2 ? lerp(t, 12.2, 12.45, 0.16, 0) : 0;
  return (
    <AbsoluteFill style={{background: "#060607", overflow: "hidden"}}>
      <Fonts />
      <Table t={t} shake={shake} />
      <Spot t={t} />
      <Shadow t={t} />
      <RiseRings t={t} />
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
      <AbsoluteFill style={{background: "#000", opacity: lerp(t, 0, 0.5, 1, 0), pointerEvents: "none"}} />
      <AbsoluteFill style={{background: "#FFE9B0", opacity: flash, mixBlendMode: "screen", pointerEvents: "none"}} />
    </AbsoluteFill>
  );
};
