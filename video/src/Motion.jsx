import {
  AbsoluteFill, Img, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing,
} from "remotion";

// Same palette as the app (www/index.html)
const C = {or: "#E9B53B", orClair: "#F7DA86", orTexte: "#F2C14E", encre: "#2B1D04", fond: "#1C1C1C", texte: "#EFE9DC", gris: "#9C968A", vert: "#1FAF5A"};
const HEX = "polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)";
const brush = {fontFamily: "Kaushan Script", fontWeight: 400, lineHeight: 1};
const body = {fontFamily: "system-ui, Roboto, sans-serif", fontWeight: 800};
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"};

// Scene timeline (frames at 30 fps)
const S = {
  intro: [0, 75],
  mots: [75, 70],
  phone: [145, 120],
  choisis: [265, 45],
  panier: [310, 45],
  whatsapp: [355, 60],
  plats: [415, 90],
  zero: [505, 50],
  outro: [555, 105],
};
export const MOTION_DURATION = S.outro[0] + S.outro[1];

const Fonts = () => (
  <style>{`@font-face{font-family:"Kaushan Script";src:url(${staticFile("KaushanScript.woff2")}) format("woff2")}`}</style>
);

const sp = (f, fps, delay = 0, config = {damping: 12}) => spring({frame: f - delay, fps, config});

// Whip-in: each scene enters with a fast skewed slide
const Whip = ({children, from = 1}) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, 8], [1, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{transform: `translateX(${t * 100 * from}%) skewX(${-t * 12 * from}deg)`}}>
      {children}
    </AbsoluteFill>
  );
};

// Honeycomb background, drifting
const Comb = ({color = C.or, opacity = 0.08, speed = 1}) => {
  const f = useCurrentFrame();
  const stroke = encodeURIComponent(color);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='112' height='194' viewBox='0 0 56 97'><path d='M28 66L0 50V17L28 1l28 16v33zM28 97L0 81M56 81L28 97V66' fill='none' stroke='${stroke}' stroke-width='1.6'/></svg>`;
  return <AbsoluteFill style={{opacity, backgroundImage: `url("data:image/svg+xml,${svg}")`, backgroundPosition: `${f * 0.6 * speed}px ${-f * 1.2 * speed}px`}} />;
};

// Hexagons bursting from a point
const Burst = ({delay = 0, color = C.or, count = 10, radius = 520, x = 540, y = 960}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  return (
    <>
      {Array.from({length: count}).map((_, i) => {
        const a = (i / count) * Math.PI * 2 + 0.3;
        const p = sp(f, fps, delay + (i % 3), {damping: 20, stiffness: 90});
        const size = 40 + (i % 4) * 26;
        return (
          <div key={i} style={{position: "absolute", left: x + Math.cos(a) * radius * p - size / 2, top: y + Math.sin(a) * radius * p - size / 2,
            width: size, height: size * 0.87, background: i % 2 ? color : "transparent", border: i % 2 ? "none" : `6px solid ${color}`,
            clipPath: HEX, opacity: interpolate(p, [0, 0.2, 1], [0, 1, 0.9]), transform: `rotate(${p * 90 + i * 20}deg)`}} />
        );
      })}
    </>
  );
};

/* ---------- 1. Intro: honeycomb pops, "La Ruche" drops in, bee flies ---------- */
const Intro = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const lettres = "La Ruche".split("");
  // bee flight (parametric curve) + dotted trail
  const pos = t => ({x: -120 + t * 1350, y: 1240 - t * 520 + Math.sin(t * Math.PI * 3) * 150});
  const tBee = interpolate(f, [8, 60], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const bee = pos(tBee);
  const zoom = interpolate(f, [60, 75], [1, 1.6], {...clamp, easing: Easing.in(Easing.cubic)});
  return (
    <AbsoluteFill style={{background: C.or, overflow: "hidden", transform: `scale(${zoom})`}}>
      <Comb color={C.encre} opacity={0.12} />
      {Array.from({length: 14}).map((_, i) => {
        const p = sp(f, fps, i * 1.5, {damping: 9});
        const col = i % 7, row = Math.floor(i / 7);
        return <div key={i} style={{position: "absolute", left: col * 160 - 20, top: row === 0 ? 120 : 1580, width: 150, height: 130,
          background: i % 3 ? C.encre : C.orClair, opacity: 0.14, clipPath: HEX, transform: `scale(${p}) rotate(${(1 - p) * 120}deg)`}} />;
      })}
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
        <div style={{...body, color: C.encre, fontSize: 46, letterSpacing: "0.2em", textTransform: "uppercase", opacity: sp(f, fps, 30),
          transform: `translateY(${(1 - sp(f, fps, 30)) * 40}px)`}}>Snack · Les Mureaux</div>
        <div style={{display: "flex", marginTop: 10}}>
          {lettres.map((l, i) => {
            const p = sp(f, fps, 6 + i * 3, {damping: 10, stiffness: 140});
            return <span key={i} style={{...brush, color: C.encre, fontSize: 230, display: "inline-block", whiteSpace: "pre",
              transform: `translateY(${(1 - p) * -500}px) rotate(${(1 - p) * (i % 2 ? 30 : -30)}deg)`, opacity: p > 0.02 ? 1 : 0}}>{l}</span>;
          })}
        </div>
      </AbsoluteFill>
      {Array.from({length: 22}).map((_, i) => {
        const t = tBee - i * 0.025;
        if (t <= 0) return null;
        const p = pos(t);
        return <div key={i} style={{position: "absolute", left: p.x, top: p.y + 40, width: 10, height: 10, borderRadius: 5, background: C.encre, opacity: 0.5 - i * 0.02}} />;
      })}
      <div style={{position: "absolute", left: bee.x - 50, top: bee.y - 20, fontSize: 110, transform: `rotate(${Math.sin(f / 3) * 12}deg)`}}>🐝</div>
    </AbsoluteFill>
  );
};

/* ---------- 2. Kinetic words ---------- */
const MOTS = [
  {t: "Ton snack", c: C.texte, at: 0},
  {t: "préféré", c: C.orTexte, at: 10, brush: true},
  {t: "dans ta", c: C.texte, at: 22},
  {t: "poche", c: C.orTexte, at: 30, brush: true},
];
const Mots = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const shake = f >= 30 && f < 36 ? Math.sin(f * 9) * 10 : 0;
  return (
    <Whip>
      <AbsoluteFill style={{background: C.fond, overflow: "hidden"}}>
        <div style={{position: "absolute", top: 230, whiteSpace: "nowrap", ...body, fontSize: 260, color: "transparent",
          WebkitTextStroke: `3px ${C.or}`, opacity: 0.18, transform: `translateX(${-f * 14}px)`}}>LA RUCHE · LA RUCHE · LA RUCHE</div>
        <div style={{position: "absolute", bottom: 230, whiteSpace: "nowrap", ...body, fontSize: 260, color: "transparent",
          WebkitTextStroke: `3px ${C.or}`, opacity: 0.18, transform: `translateX(${-1600 + f * 14}px)`}}>MENU · PANIER · WHATSAPP ·</div>
        <AbsoluteFill style={{alignItems: "center", justifyContent: "center", gap: 6, transform: `translate(${shake}px, ${-shake}px)`}}>
          {MOTS.map(m => {
            const p = sp(f, fps, m.at, {damping: 11, stiffness: 180});
            return <div key={m.t} style={{...(m.brush ? brush : body), color: m.c, fontSize: m.brush ? 200 : 150, textTransform: m.brush ? "none" : "uppercase",
              opacity: f >= m.at ? 1 : 0, transform: `scale(${2.4 - 1.4 * p})`, filter: `blur(${(1 - p) * 12}px)`}}>{m.t}</div>;
          })}
        </AbsoluteFill>
        <Burst delay={30} />
      </AbsoluteFill>
    </Whip>
  );
};

/* ---------- 3. Phone with the real app, orbiting category chips ---------- */
const CHIPS = ["🍔 Burgers", "🌯 Kebab", "🌮 Tacos", "🍟 Barquettes", "🍦 Desserts", "🥤 Boissons"];
const Phone = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const enter = sp(f, fps, 0, {damping: 14});
  const W = 600, H = 1240, scale = W / 780;
  const scroll = interpolate(f, [25, 110], [0, 3700], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const rot = interpolate(enter, [0, 1], [50, -10]) + Math.sin(f / 20) * 4;
  return (
    <Whip from={-1}>
      <AbsoluteFill style={{background: `radial-gradient(70% 50% at 50% 55%, #3A3120, ${C.fond})`, alignItems: "center", overflow: "hidden"}}>
        <Comb />
        <div style={{...brush, color: C.orTexte, fontSize: 130, marginTop: 110, textAlign: "center", ...rise(f, fps, 4)}}>Tout le menu</div>
        <div style={{...body, color: C.texte, fontSize: 40, marginTop: 6, opacity: 0.8, ...rise(f, fps, 10)}}>en un seul écran</div>
        <div style={{perspective: 1800, marginTop: 50}}>
          <div style={{position: "relative", width: W, height: H, borderRadius: 70, border: "14px solid #111", background: C.fond, overflow: "hidden",
            boxShadow: "0 50px 140px rgba(233,181,59,.35)", transform: `translateY(${(1 - enter) * 1100}px) rotateY(${rot}deg) rotateX(6deg)`}}>
            {/* app header stays fixed while the menu scrolls under it */}
            <Img src={staticFile("app-defile.jpg")} style={{position: "absolute", top: 215, width: W, transform: `translateY(${-scroll * scale}px)`}} />
            <Img src={staticFile("app-ecran.jpg")} style={{position: "absolute", top: 0, width: W, height: 215, objectFit: "cover", objectPosition: "top"}} />
            <Img src={staticFile("app-ecran.jpg")} style={{position: "absolute", bottom: 0, width: W, height: 101, objectFit: "cover", objectPosition: "bottom"}} />
          </div>
        </div>
        {CHIPS.map((c, i) => {
          const a = f / 28 + (i / CHIPS.length) * Math.PI * 2;
          const p = sp(f, fps, 14 + i * 4, {damping: 10});
          const x = 540 + Math.cos(a) * 470, y = 1180 + Math.sin(a) * 620;
          const front = Math.sin(a) > 0;
          return <div key={c} style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${p * (front ? 1.1 : 0.85)})`,
            zIndex: front ? 2 : 0, padding: "18px 30px", borderRadius: 999, background: i % 2 ? C.or : "#111", color: i % 2 ? C.encre : C.orTexte,
            border: `3px solid ${C.or}`, ...body, fontSize: 38, whiteSpace: "nowrap", boxShadow: "0 16px 40px rgba(0,0,0,.45)"}}>{c}</div>;
        })}
      </AbsoluteFill>
    </Whip>
  );
};

function rise(f, fps, delay = 0, dist = 60) {
  const s = sp(f, fps, delay, {damping: 15});
  return {opacity: s, transform: `translateY(${(1 - s) * dist}px)`};
}

/* ---------- 4a. "Choisis" : the + button gets tapped, counter climbs ---------- */
const Choisis = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const taps = [10, 20, 30];
  const n = taps.filter(t => f >= t).length;
  const last = Math.max(...taps.filter(t => f >= t), -100);
  const press = f - last < 4 ? 0.85 : 1;
  const pop = sp(f, fps, last, {damping: 8, stiffness: 200});
  return (
    <Whip>
      <AbsoluteFill style={{background: C.or, alignItems: "center", justifyContent: "center", overflow: "hidden"}}>
        <Comb color={C.encre} opacity={0.1} speed={2} />
        <div style={{...brush, color: C.encre, fontSize: 170, ...rise(f, fps, 0)}}>Choisis</div>
        <div style={{display: "flex", alignItems: "center", gap: 60, marginTop: 80}}>
          <div style={{width: 230, height: 230, borderRadius: 60, background: "#2F2F2F", color: C.texte, display: "grid", placeItems: "center", ...body, fontSize: 150}}>−</div>
          <div style={{...body, color: C.encre, fontSize: 260, width: 200, textAlign: "center", transform: `scale(${0.6 + 0.4 * pop})`}}>{n}</div>
          <div style={{width: 230, height: 230, borderRadius: 60, background: C.encre, color: C.or, display: "grid", placeItems: "center", ...body, fontSize: 150,
            transform: `scale(${press})`, boxShadow: "0 24px 60px rgba(43,29,4,.4)"}}>+</div>
        </div>
        {taps.map(t => f >= t && f < t + 14 && (
          <div key={t} style={{position: "absolute", left: 540 + 290 - 140, top: 960 + 40 - 140 + 40, width: 280, height: 280, borderRadius: 140,
            border: `10px solid ${C.encre}`, opacity: 1 - (f - t) / 14, transform: `scale(${0.6 + (f - t) / 10})`}} />
        ))}
        <div style={{...body, color: C.encre, fontSize: 46, marginTop: 90, opacity: 0.8}}>Kebab · 7,00 €</div>
      </AbsoluteFill>
    </Whip>
  );
};

/* ---------- 4b. "Ton panier" : total counts up ---------- */
const Panier = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const total = interpolate(f, [6, 32], [0, 28.5], {...clamp, easing: Easing.out(Easing.cubic)});
  const lignes = [["2 × Kebab", "14,00 €"], ["1 × Steak", "6,50 €"], ["1 × Escalope", "8,00 €"]];
  return (
    <Whip from={-1}>
      <AbsoluteFill style={{background: C.fond, alignItems: "center", justifyContent: "center", overflow: "hidden"}}>
        <Comb />
        <div style={{...brush, color: C.orTexte, fontSize: 160, ...rise(f, fps, 0)}}>Ton panier</div>
        <div style={{width: 860, marginTop: 70, display: "grid", gap: 34}}>
          {lignes.map(([a, b], i) => {
            const p = sp(f, fps, 4 + i * 4, {damping: 14});
            return <div key={a} style={{display: "flex", alignItems: "baseline", gap: 18, ...body, fontSize: 50, color: C.texte, opacity: p,
              transform: `translateX(${(1 - p) * 300}px)`}}>
              <span>{a}</span><i style={{flex: 1, borderBottom: "6px dotted #5A564E", transform: `scaleX(${p})`, transformOrigin: "left"}} /><span style={{color: C.orTexte}}>{b}</span>
            </div>;
          })}
        </div>
        <div style={{marginTop: 70, padding: "36px 60px", borderRadius: 40, background: C.or, color: C.encre, display: "flex", gap: 50, alignItems: "baseline",
          ...body, transform: `scale(${sp(f, fps, 16, {damping: 9})})`}}>
          <span style={{fontSize: 56}}>Total</span>
          <span style={{fontSize: 120, fontVariantNumeric: "tabular-nums"}}>{total.toFixed(2).replace(".", ",")} €</span>
        </div>
      </AbsoluteFill>
    </Whip>
  );
};

/* ---------- 4c. WhatsApp : the order message types itself ---------- */
const MESSAGE = ["🐝 Nouvelle commande – La Ruche", "• 2 × Kebab — 14,00 €", "• 1 × Steak — 6,50 €", "• 1 × Escalope — 8,00 €", "Total : 28,50 €", "👤 Yanis · 🍽️ Sur place"];
const WhatsApp = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const chars = Math.floor(interpolate(f, [10, 46], [0, MESSAGE.join("").length], clamp));
  let reste = chars;
  const bubble = sp(f, fps, 4, {damping: 13});
  const sent = sp(f, fps, 48, {damping: 8});
  return (
    <Whip>
      <AbsoluteFill style={{background: "#0B1410", alignItems: "center", justifyContent: "center", overflow: "hidden"}}>
        <Comb color={C.vert} opacity={0.08} />
        <div style={{...brush, color: "#5BE08E", fontSize: 140, textAlign: "center", ...rise(f, fps, 0)}}>Envoie sur<br />WhatsApp</div>
        <div style={{width: 840, marginTop: 70, padding: "40px 46px 30px", borderRadius: "46px 46px 10px 46px", background: "#1F5C3A", color: "#F1FFF5",
          ...body, fontWeight: 600, fontSize: 40, lineHeight: 1.5, transform: `scale(${bubble}) translateY(${(1 - bubble) * 200}px)`, transformOrigin: "bottom right",
          boxShadow: "0 30px 80px rgba(0,0,0,.5)", minHeight: 420}}>
          {MESSAGE.map((l, i) => {
            const shown = l.slice(0, Math.max(0, reste)); reste -= l.length;
            return <div key={i} style={{fontWeight: i === 0 || i === 4 ? 800 : 600, minHeight: 60}}>{shown}</div>;
          })}
          <div style={{textAlign: "right", color: "#7FE3A6", fontSize: 34, opacity: sent, transform: `scale(${sent})`, transformOrigin: "right"}}>19:42 ✓✓</div>
        </div>
        <div style={{marginTop: 60, padding: "28px 60px", borderRadius: 40, background: C.vert, color: "#fff", ...body, fontSize: 46,
          transform: `scale(${f > 44 && f < 50 ? 0.9 : 1})`}}>Commander sur WhatsApp</div>
      </AbsoluteFill>
    </Whip>
  );
};

/* ---------- 5. Dishes swiping fast with price stamps ---------- */
const PLATS = [
  {img: "kebab.jpg", n: "Kebab", p: "7,00 €"},
  {img: "americain.jpg", n: "Américain", p: "8,50 €"},
  {img: "tacos.jpg", n: "Tacos", p: "dès 4,50 €"},
  {img: "escalope.jpg", n: "Escalope", p: "8,00 €"},
];
const LEN = 22;
const Plats = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: C.fond, overflow: "hidden"}}>
      <Comb speed={3} />
      <div style={{position: "absolute", top: 150, width: "100%", textAlign: "center", ...brush, color: C.orTexte, fontSize: 130}}>Nos plats</div>
      {PLATS.map((d, i) => {
        const local = f - i * LEN;
        if (local < -6 || local > LEN + 6) return null;
        const inn = interpolate(local, [-6, 4], [1, 0], {...clamp, easing: Easing.out(Easing.cubic)});
        const out = interpolate(local, [LEN - 4, LEN + 6], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
        const x = (inn - out) * 1200;
        const stamp = sp(local, fps, 6, {damping: 7, stiffness: 220});
        return (
          <AbsoluteFill key={d.n} style={{alignItems: "center", justifyContent: "center", transform: `translateX(${x}px) skewX(${(inn + out) * -14}deg)`}}>
            <div style={{width: 760, height: 760, borderRadius: 70, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,.6)", border: `8px solid ${C.or}`,
              transform: `rotate(${i % 2 ? 3 : -3}deg)`}}>
              <Img src={staticFile(d.img)} style={{width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.35 - local * 0.004})`}} />
            </div>
            <div style={{display: "flex", alignItems: "baseline", gap: 20, width: 760, marginTop: 50, ...body, fontSize: 70, color: C.texte}}>
              <span>{d.n}</span><i style={{flex: 1, borderBottom: "7px dotted #5A564E"}} />
              <span style={{color: C.encre, background: C.or, padding: "8px 26px", borderRadius: 20, transform: `scale(${stamp}) rotate(${(1 - stamp) * -25}deg)`}}>{d.p}</span>
            </div>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- 6. 0 % commission ---------- */
const Zero = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const pct = Math.round(interpolate(f, [4, 24], [30, 0], {...clamp, easing: Easing.out(Easing.quad)}));
  const land = sp(f, fps, 24, {damping: 6, stiffness: 220});
  return (
    <Whip from={-1}>
      <AbsoluteFill style={{background: C.encre, alignItems: "center", justifyContent: "center", overflow: "hidden"}}>
        <Comb opacity={0.12} speed={2} />
        <div style={{...body, color: C.or, fontSize: 420, lineHeight: 1, fontVariantNumeric: "tabular-nums", transform: `scale(${f >= 24 ? 0.8 + 0.2 * land : 1})`}}>{pct} %</div>
        <div style={{...brush, color: C.texte, fontSize: 120, marginTop: 10, ...rise(f, fps, 18)}}>de commission</div>
        <div style={{...body, color: C.orClair, fontSize: 40, marginTop: 30, opacity: 0.85, ...rise(f, fps, 26)}}>La commande va directement au restaurant</div>
        <Burst delay={24} count={12} radius={600} />
      </AbsoluteFill>
    </Whip>
  );
};

/* ---------- 7. Outro ---------- */
const Outro = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const pulse = 1 + Math.max(0, Math.sin((f - 40) / 6)) * 0.05 * (f > 40 ? 1 : 0);
  const reveal = interpolate(f, [0, 14], [0, 150], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{background: C.fond}}>
      <AbsoluteFill style={{background: C.or, clipPath: `circle(${reveal}% at 50% 50%)`, alignItems: "center", justifyContent: "center", overflow: "hidden"}}>
        <Comb color={C.encre} opacity={0.12} />
        <div style={{fontSize: 140, transform: `translate(${Math.sin(f / 7) * 30}px, ${Math.cos(f / 5) * 16}px) rotate(${Math.sin(f / 3) * 10}deg)`}}>🐝</div>
        <div style={{...brush, color: C.encre, fontSize: 250, ...rise(f, fps, 6, 120)}}>La Ruche</div>
        <div style={{...body, color: C.encre, fontSize: 44, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 10, ...rise(f, fps, 12)}}>Snack · Les Mureaux</div>
        <div style={{marginTop: 90, padding: "32px 64px", borderRadius: 44, background: C.vert, color: "#fff", ...body, fontSize: 50,
          transform: `scale(${sp(f, fps, 20, {damping: 9}) * pulse})`, boxShadow: "0 24px 60px rgba(0,0,0,.3)"}}>Commandez sur WhatsApp</div>
        <div style={{marginTop: 40, padding: "26px 54px", borderRadius: 999, background: C.encre, color: C.or, ...body, fontSize: 64,
          transform: `scale(${sp(f, fps, 28, {damping: 9})})`}}>📞 01 30 04 94 76</div>
        <div style={{...body, color: C.encre, fontSize: 36, marginTop: 50, opacity: 0.75, ...rise(f, fps, 36)}}>Ouvert tous les jours · 8h – 22h50</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const scene = ([from, len], El) => (
  <Sequence from={from} durationInFrames={len}><El /></Sequence>
);

export const Motion = () => (
  <AbsoluteFill style={{background: C.fond}}>
    <Fonts />
    {scene(S.intro, Intro)}
    {scene(S.mots, Mots)}
    {scene(S.phone, Phone)}
    {scene(S.choisis, Choisis)}
    {scene(S.panier, Panier)}
    {scene(S.whatsapp, WhatsApp)}
    {scene(S.plats, Plats)}
    {scene(S.zero, Zero)}
    {scene(S.outro, Outro)}
  </AbsoluteFill>
);
