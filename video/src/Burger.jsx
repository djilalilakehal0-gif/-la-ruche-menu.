import {
  AbsoluteFill, Img, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing,
} from "remotion";

/*
  "برغر La Ruche" — 15 s luxury burger spot, 1080×1350 (4:5).
  public/burger/plate.jpg is the poster with all its text removed, so every
  title, label and badge below is animated on its own.
*/
export const BURGER_DURATION = 450;

const W = 1080, H = 1350;
const PW = 1164, PH = 1300;            // plate.jpg size
const K = Math.max(W / PW, H / PH);    // plate → screen at zoom 1
const GOLD = "linear-gradient(100deg,#8A6420 0%,#E9C46A 22%,#FFF1BF 34%,#D4A646 48%,#9C7428 66%,#F2D27C 82%,#B8892E 100%)";
const ar = {fontFamily: "Cairo", direction: "rtl"};
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"};
const ease = Easing.inOut(Easing.cubic);

const Fonts = () => (
  <style>{`
    @font-face{font-family:Cairo;src:url(${staticFile("burger/Cairo-arabic.woff2")}) format("woff2");font-weight:200 1000;unicode-range:U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFF}
    @font-face{font-family:Cairo;src:url(${staticFile("burger/Cairo-latin.woff2")}) format("woff2");font-weight:200 1000}
    @font-face{font-family:"Kaushan Script";src:url(${staticFile("KaushanScript.woff2")}) format("woff2")}
  `}</style>
);

/* ---------- camera over the photo ---------- */
const KEYS = [0, 75, 150, 178, 300, 336, 450];
const cam = f => ({
  z: interpolate(f, KEYS, [1.9, 1.0, 1.04, 1.6, 1.6, 1.0, 0.97], {...clamp, easing: ease}),
  fx: interpolate(f, KEYS, [585, 582, 582, 600, 600, 582, 582], {...clamp, easing: ease}),
  fy: interpolate(f, KEYS, [560, 690, 680, 610, 1000, 690, 700], {...clamp, easing: ease}),
  rot: interpolate(f, KEYS, [-4, 0, 0, 1.5, -1.5, 0, 0], {...clamp, easing: ease}),
});
const toScreen = (c, px, py) => ({x: W / 2 + (px - c.fx) * K * c.z, y: H / 2 + (py - c.fy) * K * c.z});

const Plate = ({c, shake}) => {
  const f = useCurrentFrame();
  const reveal = interpolate(f, [14, 46], [0, 110], {...clamp, easing: Easing.out(Easing.cubic)});
  const centre = toScreen(c, 585, 760);
  return (
    <AbsoluteFill style={{clipPath: `circle(${reveal}% at ${centre.x}px ${centre.y}px)`, transform: `translate(${shake.x}px,${shake.y}px) rotate(${c.rot}deg)`}}>
      <Img src={staticFile("burger/plate.jpg")} style={{position: "absolute", width: PW * K * c.z, height: PH * K * c.z,
        left: W / 2 - c.fx * K * c.z, top: H / 2 - c.fy * K * c.z, filter: `brightness(${interpolate(f, [14, 40, 60], [2.2, 1.3, 1], clamp)}) contrast(1.06)`}} />
    </AbsoluteFill>
  );
};

/* ---------- embers rising, smoke, light sweeps ---------- */
const rnd = i => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
const Embers = ({count = 70}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      {Array.from({length: count}).map((_, i) => {
        const speed = 2 + rnd(i) * 5, size = 2 + rnd(i + 7) * 6;
        const y = H + 40 - ((f * speed + rnd(i + 3) * 1600) % (H + 120));
        const x = rnd(i + 11) * W + Math.sin(f / (14 + rnd(i) * 20) + i) * 26;
        const flick = 0.45 + 0.55 * Math.abs(Math.sin(f / (3 + rnd(i + 5) * 4) + i));
        return <div key={i} style={{position: "absolute", left: x, top: y, width: size, height: size * (1.6 + rnd(i + 2)), borderRadius: size,
          background: rnd(i + 9) > 0.5 ? "#FFB347" : "#FFD27A", opacity: flick * interpolate(y, [0, 300], [0, 1], clamp),
          boxShadow: `0 0 ${size * 3}px ${size}px rgba(255,140,40,.55)`, transform: `rotate(${Math.sin(f / 10 + i) * 30}deg)`}} />;
      })}
    </AbsoluteFill>
  );
};

const Smoke = ({c}) => {
  const f = useCurrentFrame();
  const top = toScreen(c, 585, 440);
  return (
    <AbsoluteFill style={{pointerEvents: "none", mixBlendMode: "screen"}}>
      {[0, 1, 2, 3].map(i => {
        const t = ((f + i * 40) % 160) / 160;
        return <div key={i} style={{position: "absolute", left: top.x - 160 + Math.sin(f / 25 + i * 2) * 60, top: top.y - t * 380 * c.z,
          width: 320 * c.z, height: 320 * c.z, borderRadius: "50%", filter: "blur(40px)",
          background: "radial-gradient(circle, rgba(255,255,255,.35), transparent 65%)", opacity: Math.sin(t * Math.PI) * 0.5}} />;
      })}
    </AbsoluteFill>
  );
};

const Sweep = ({at, dur = 26, angle = 18, width = 260, opacity = 0.55}) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [at, at + dur], [-500, W + 500], {...clamp, easing: Easing.inOut(Easing.quad)});
  if (f < at || f > at + dur) return null;
  return <AbsoluteFill style={{pointerEvents: "none", mixBlendMode: "overlay"}}>
    <div style={{position: "absolute", top: -300, left: x - width / 2, width, height: H + 600, transform: `rotate(${angle}deg)`,
      background: `linear-gradient(90deg, transparent, rgba(255,240,200,${opacity}), transparent)`}} />
  </AbsoluteFill>;
};

const Vignette = () => <AbsoluteFill style={{pointerEvents: "none", background: "radial-gradient(85% 70% at 50% 55%, transparent 55%, rgba(0,0,0,.75) 100%)"}} />;

/* ---------- gold text helpers ---------- */
const GoldText = ({children, size, weight = 900, shine = 0, style}) => (
  <div style={{...ar, fontSize: size, fontWeight: weight, lineHeight: 1.25, color: "transparent", backgroundImage: GOLD,
    backgroundSize: "250% 100%", backgroundPosition: `${shine}% 50%`, WebkitBackgroundClip: "text", backgroundClip: "text",
    filter: "drop-shadow(0 6px 14px rgba(0,0,0,.75))", ...style}}>{children}</div>
);

// Title: revealed right-to-left (Arabic reading direction), with a moving shine
const Title = ({inAt, outAt, backAt}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const showA = interpolate(f, [inAt, inAt + 22], [100, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  const showB = backAt ? interpolate(f, [backAt, backAt + 18], [100, 0], {...clamp, easing: Easing.out(Easing.cubic)}) : 100;
  const hidden = outAt ? interpolate(f, [outAt, outAt + 12], [0, 1], clamp) : 0;
  const inset = f >= (backAt || 1e9) ? showB : (hidden ? 100 * hidden : showA);
  const rise = spring({frame: f - inAt, fps, config: {damping: 14}});
  const shine = (f * 1.6) % 250;
  const mots = ["طعمٌ", "يأخذك", "إلى", "عالم", "آخر"];
  const subStart = backAt && f >= backAt ? backAt + 6 : inAt + 16;
  const subOut = !(backAt && f >= backAt) && outAt ? interpolate(f, [outAt, outAt + 10], [1, 0], clamp) : 1;
  return (
    <div style={{position: "absolute", top: 118, width: "100%", display: "grid", justifyItems: "center"}}>
      <div style={{clipPath: `inset(0 0 0 ${inset}%)`, transform: `translateY(${(1 - rise) * 30}px) scale(${1 + (1 - rise) * 0.08})`}}>
        <GoldText size={132} shine={shine}>
          برغر <span style={{fontFamily: "Kaushan Script", fontWeight: 400, direction: "ltr", unicodeBidi: "isolate", marginRight: 14}}>La Ruche</span>
        </GoldText>
      </div>
      <div style={{display: "flex", gap: 16, direction: "rtl", marginTop: -6, opacity: subOut}}>
        {mots.map((m, i) => {
          const p = spring({frame: f - subStart - i * 4, fps, config: {damping: 13}});
          return <span key={m} style={{...ar, fontSize: 58, fontWeight: 700, color: "#F6F1E6", opacity: p,
            transform: `translateY(${(1 - p) * 26}px)`, textShadow: "0 4px 14px rgba(0,0,0,.9)"}}>{m}</span>;
        })}
      </div>
    </div>
  );
};

/* ---------- opening: gold line + hexagon emblem ---------- */
const Emblem = ({y = 58, size = 74, at = 0}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const draw = interpolate(f, [at, at + 24], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const bee = spring({frame: f - at - 18, fps, config: {damping: 9}});
  return (
    <div style={{position: "absolute", top: y - size / 2, left: W / 2 - size / 2, width: size, height: size}}>
      <svg width={size} height={size} viewBox="0 0 40 40"><path d="M11 4h18l10 16-10 16H11L1 20z" fill="none" stroke="#E9C46A" strokeWidth={2.2}
        strokeDasharray={110} strokeDashoffset={110 * (1 - draw)} /></svg>
      <div style={{position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: size * 0.42, transform: `scale(${bee})`}}>🐝</div>
    </div>
  );
};

const Opening = () => {
  const f = useCurrentFrame();
  const line = interpolate(f, [0, 16], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const out = interpolate(f, [22, 34], [1, 0], clamp);
  return (
    <AbsoluteFill style={{alignItems: "center", justifyContent: "center", opacity: out}}>
      <div style={{width: 760 * line, height: 2, background: "linear-gradient(90deg,transparent,#E9C46A,transparent)"}} />
      <div style={{...ar, marginTop: 22, fontSize: 30, fontWeight: 600, letterSpacing: 0, color: "#E9C46A", opacity: line}}>La Ruche · تقدّم</div>
    </AbsoluteFill>
  );
};

/* ---------- anatomy callouts that stick to the burger while the camera travels ---------- */
const LAYERS = [
  {p: [660, 560], t: "خبز بريوش محمّص", side: "r", at: 182},
  {p: [520, 706], t: "بصل مكرمل", side: "l", at: 198},
  {p: [655, 762], t: "جبنة شيدر ذائبة", side: "r", at: 214},
  {p: [540, 812], t: "لحم بلدي \u2066100%\u2069", side: "l", at: 232},
  {p: [690, 876], t: "طماطم طازجة", side: "r", at: 250},
  {p: [520, 934], t: "خس مقرمش", side: "l", at: 266},
  {p: [665, 986], t: "صلصة سرية خاصة", side: "r", at: 280},
];
const Callouts = ({c}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const allOut = interpolate(f, [298, 312], [1, 0], clamp);
  if (f < 175 || allOut <= 0) return null;
  return (
    <AbsoluteFill style={{pointerEvents: "none", opacity: allOut}}>
      {LAYERS.map((l, i) => {
        const p = spring({frame: f - l.at, fps, config: {damping: 14}});
        if (p <= 0.001) return null;
        const s = toScreen(c, l.p[0], l.p[1]);
        const left = l.side === "l";
        const edge = left ? 380 : 700;                 // label column edge
        const lineLen = Math.abs(s.x - edge) * Math.min(1, p * 1.4);
        return (
          <div key={i}>
            <div style={{position: "absolute", left: s.x - 13, top: s.y - 13, width: 26, height: 26, borderRadius: 13, border: "3px solid #F2D27C",
              background: "rgba(0,0,0,.35)", transform: `scale(${p * (1 + 0.15 * Math.sin(f / 4))})`, boxShadow: "0 0 16px rgba(242,210,124,.8)"}} />
            <div style={{position: "absolute", top: s.y - 1.5, height: 3, background: "#F2D27C", width: lineLen,
              left: left ? s.x - lineLen - 13 : s.x + 13, boxShadow: "0 0 8px rgba(242,210,124,.7)"}} />
            <div style={{position: "absolute", top: s.y - 38, [left ? "right" : "left"]: left ? W - edge + 4 : edge + 4,
              padding: "6px 22px", borderRadius: 14, background: "rgba(8,8,10,.78)", border: "2px solid rgba(242,210,124,.85)",
              display: "flex", gap: 12, alignItems: "center", direction: "rtl", opacity: interpolate(p, [0.4, 1], [0, 1], clamp),
              transform: `translateX(${(1 - p) * (left ? -60 : 60)}px)`}}>
              <span style={{...ar, fontSize: 24, fontWeight: 800, color: "#E9C46A"}}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{...ar, fontSize: 33, fontWeight: 800, color: "#FFF8EA", whiteSpace: "nowrap"}}>{l.t}</span>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- badges that rebuild the poster ---------- */
const sealPoints = (n, r1, r2) => Array.from({length: n * 2}).map((_, i) => {
  const a = (i / (n * 2)) * Math.PI * 2, r = i % 2 ? r2 : r1;
  return `${100 + Math.cos(a) * r},${100 + Math.sin(a) * r}`;
}).join(" ");

const Seal = ({at, x, y}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const p = spring({frame: f - at, fps, config: {damping: 8, stiffness: 160}});
  if (f < at) return null;
  const wave = interpolate(f, [at + 4, at + 22], [0, 1], clamp);
  return (
    <div style={{position: "absolute", left: x - 115, top: y - 115, width: 230, height: 230}}>
      <div style={{position: "absolute", inset: -40, borderRadius: "50%", border: "4px solid #F2D27C", opacity: 1 - wave, transform: `scale(${0.6 + wave})`}} />
      <div style={{position: "absolute", inset: 0, transform: `scale(${2.2 - 1.2 * p}) rotate(${(1 - p) * -90 + f * 0.4}deg)`, opacity: Math.min(1, p * 2)}}>
        <svg width="230" height="230" viewBox="0 0 200 200">
          <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stopColor="#8A6420" /><stop offset=".35" stopColor="#FFF1BF" /><stop offset=".6" stopColor="#D4A646" /><stop offset="1" stopColor="#9C7428" /></linearGradient></defs>
          <polygon points={sealPoints(30, 96, 88)} fill="url(#g)" />
          <circle cx="100" cy="100" r="80" fill="#0E0E10" />
          <circle cx="100" cy="100" r="73" fill="none" stroke="url(#g)" strokeWidth="2" />
        </svg>
      </div>
      <div style={{position: "absolute", inset: 0, display: "grid", placeItems: "center", alignContent: "center", transform: `scale(${2.2 - 1.2 * p})`, opacity: Math.min(1, p * 2)}}>
        <span style={{...ar, fontSize: 24, fontWeight: 700, color: "#F2D27C", lineHeight: 1.1}}>لحم بلدي</span>
        <GoldText size={46} style={{lineHeight: 1.1}}>طبيعي</GoldText>
        <span style={{...ar, fontSize: 30, fontWeight: 900, color: "#F2D27C", lineHeight: 1.1}}>100%</span>
      </div>
    </div>
  );
};

const SideText = ({at, x, y, lines, from}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  return (
    <div style={{position: "absolute", left: x - 100, top: y, width: 200, display: "grid", justifyItems: "center"}}>
      <svg width="34" height="40" viewBox="0 0 34 40" style={{opacity: spring({frame: f - at, fps})}}>
        <path d="M17 2L32 20L17 38L2 20Z M17 10L25 20L17 30L9 20Z" fill="none" stroke="#E9C46A" strokeWidth="2" />
      </svg>
      {lines.map((l, i) => {
        const p = spring({frame: f - at - 3 - i * 4, fps, config: {damping: 13}});
        return <div key={l} style={{opacity: p, transform: `translateX(${(1 - p) * 80 * from}px)`}}>
          <GoldText size={46} weight={800} style={{lineHeight: 1.15}}>{l}</GoldText>
        </div>;
      })}
    </div>
  );
};

/* ---------- outro bar ---------- */
const Outro = ({at}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const p = spring({frame: f - at, fps, config: {damping: 15}});
  const cta = spring({frame: f - at - 12, fps, config: {damping: 9}});
  return (
    <div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: 230, transform: `translateY(${(1 - p) * 260}px)`,
      background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,.92) 35%)", display: "grid", justifyItems: "center", alignContent: "end", paddingBottom: 36, gap: 10}}>
      <div style={{fontFamily: "Kaushan Script", fontSize: 76, lineHeight: 1, color: "transparent", backgroundImage: GOLD, backgroundSize: "250% 100%",
        backgroundPosition: `${(f * 2) % 250}% 50%`, WebkitBackgroundClip: "text", backgroundClip: "text"}}>La Ruche 🐝</div>
      <div style={{display: "flex", gap: 18, alignItems: "center", direction: "rtl", transform: `scale(${cta})`}}>
        <span style={{...ar, fontSize: 36, fontWeight: 900, color: "#141006", background: GOLD, backgroundSize: "200% 100%", padding: "4px 28px", borderRadius: 999}}>اطلبه الآن</span>
        <span style={{...ar, fontSize: 36, fontWeight: 800, color: "#F6F1E6", direction: "ltr"}}>01 30 04 94 76</span>
      </div>
    </div>
  );
};

/* ---------- gold frame drawn around the picture ---------- */
const Frame = () => {
  const f = useCurrentFrame();
  const d = interpolate(f, [20, 70], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const per = 2 * (W - 60 + H - 60);
  return (
    <svg width={W} height={H} style={{position: "absolute", inset: 0, pointerEvents: "none"}}>
      <rect x="30" y="30" width={W - 60} height={H - 60} fill="none" stroke="#C9A24A" strokeWidth="2" strokeDasharray={per} strokeDashoffset={per * (1 - d)} opacity=".85" />
      <rect x="42" y="42" width={W - 84} height={H - 84} fill="none" stroke="#C9A24A" strokeWidth="1" strokeDasharray={per} strokeDashoffset={per * (1 - d)} opacity=".5" />
    </svg>
  );
};

export const Burger = () => {
  const f = useCurrentFrame();
  const c = cam(f);
  // impact shake when the seal lands
  const k = f >= 332 && f < 342 ? (342 - f) / 10 : 0;
  const shake = {x: Math.sin(f * 7) * 10 * k, y: Math.cos(f * 9) * 8 * k};
  const flash = interpolate(f, [14, 20, 34], [0, 0.85, 0], clamp) + interpolate(f, [330, 333, 344], [0, 0.35, 0], clamp);
  return (
    <AbsoluteFill style={{background: "#060607", overflow: "hidden"}}>
      <Fonts />
      <Plate c={c} shake={shake} />
      <Smoke c={c} />
      <Sweep at={44} />
      <Sweep at={150} angle={-14} opacity={0.4} />
      <Sweep at={392} width={340} opacity={0.5} />
      <Embers />
      <Vignette />
      <Callouts c={c} />
      <Title inAt={64} outAt={164} backAt={318} />
      <Emblem at={40} />
      <Seal at={330} x={170} y={548} />
      <SideText at={346} x={950} y={600} lines={["طازجة", "ولذيذة", "يومياً"]} from={1} />
      <SideText at={358} x={130} y={735} lines={["صلصة", "سرية", "خاصة"]} from={-1} />
      <Outro at={380} />
      <Frame />
      <Opening />
      <AbsoluteFill style={{background: "#FFE9B0", opacity: flash, mixBlendMode: "screen", pointerEvents: "none"}} />
    </AbsoluteFill>
  );
};
