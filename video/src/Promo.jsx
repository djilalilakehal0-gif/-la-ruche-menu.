import {
  AbsoluteFill, Img, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing,
} from "remotion";

// Same palette as the app (www/index.html)
export const C = {bg: "#141518", panel: "#1E2024", fg: "#F4F2EE", muted: "#A9ABB0", gold: "#F28A1E", ink: "#1C0F03", ok: "#2DAA63"};
export const HEX = "polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)";
export const display = {fontFamily: "Anton", fontWeight: 400, textTransform: "uppercase", lineHeight: 0.95};
export const body = {fontFamily: "Figtree", fontWeight: 600};

export const DISHES = [
  {img: "kebab.jpg", n: "Kebab", d: "Veau, volaille", p: "7,00 €"},
  {img: "escalope.jpg", n: "Escalope", d: "Escalope de poulet, fromage", p: "8,00 €"},
  {img: "americain.jpg", n: "Américain", d: "3 steaks, œuf, fromage, bacon", p: "8,50 €"},
  {img: "tacos.jpg", n: "Tacos", d: "Sauce fromagère maison et frites", p: "dès 4,50 €"},
];
const DISH_LEN = 45;

// Scene timeline (frames at 30 fps)
const S = {
  intro: [0, 80],
  shop: [70, 130],
  dishes: [190, DISHES.length * DISH_LEN + 20],
  phone: [380, 170],
  outro: [540, 110],
};
export const DURATION = S.outro[0] + S.outro[1];

export const Fonts = () => (
  <style>{`
    @font-face{font-family:Anton;src:url(${staticFile("Anton.woff2")}) format("woff2")}
    @font-face{font-family:Figtree;src:url(${staticFile("Figtree.woff2")}) format("woff2");font-weight:300 900}
  `}</style>
);

// Fades a whole scene in and out over a few frames
const Fade = ({len, children, inF = 10, outF = 10}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, inF, len - outF, len], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

export const rise = (f, fps, delay = 0, dist = 60) => {
  const s = spring({frame: f - delay, fps, config: {damping: 16}});
  return {opacity: s, transform: `translateY(${(1 - s) * dist}px)`};
};

export const HexLogo = ({size, progress, stroke = 3}) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <path d="M11 4h18l10 16-10 16H11L1 20z" fill="none" stroke={C.gold} strokeWidth={stroke}
      strokeDasharray={110} strokeDashoffset={110 * (1 - progress)} strokeLinejoin="round" />
  </svg>
);

// Honeycomb pattern drifting slowly in the background
export const Comb = ({opacity = 0.07}) => {
  const f = useCurrentFrame();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='112' height='194' viewBox='0 0 56 97'><path d='M28 66L0 50V17L28 1l28 16v33zM28 97L0 81M56 81L28 97V66' fill='none' stroke='%23F28A1E' stroke-width='1.5'/></svg>`;
  return <AbsoluteFill style={{opacity, backgroundImage: `url("data:image/svg+xml,${svg}")`, backgroundPosition: `0 ${-f * 0.8}px`}} />;
};

const Intro = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const draw = interpolate(f, [0, 30], [0, 1], {extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)});
  const fill = interpolate(f, [26, 40], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{background: C.bg, alignItems: "center", justifyContent: "center"}}>
      <Comb opacity={0.06 * fill} />
      <div style={{position: "relative", transform: `scale(${0.8 + 0.2 * spring({frame: f, fps})})`}}>
        <div style={{position: "absolute", inset: 30, background: C.gold, clipPath: HEX, opacity: fill * 0.18}} />
        <HexLogo size={300} progress={draw} />
      </div>
      <div style={{...display, color: C.fg, fontSize: 190, marginTop: 40, ...rise(f, fps, 18)}}>La Ruche</div>
      <div style={{...body, color: C.gold, fontSize: 38, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 26, ...rise(f, fps, 28)}}>
        Les Mureaux
      </div>
    </AbsoluteFill>
  );
};

const Shop = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const zoom = interpolate(f, [0, S.shop[1]], [1.25, 1.05]);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Img src={staticFile("storefront.jpg")} style={{width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`}} />
      <AbsoluteFill style={{background: "linear-gradient(180deg,rgba(20,21,24,.1) 30%,rgba(20,21,24,.95) 78%)"}} />
      <AbsoluteFill style={{justifyContent: "flex-end", padding: "0 80px 220px", gap: 26}}>
        <div style={{...body, color: C.gold, fontSize: 36, letterSpacing: "0.14em", textTransform: "uppercase", ...rise(f, fps, 8)}}>
          Spécialités orientales · Pizzeria · Grillades
        </div>
        <div style={{...display, color: C.fg, fontSize: 150, ...rise(f, fps, 14)}}>Votre snack<br />du quartier</div>
        <div style={{...body, color: C.ok, fontSize: 44, display: "flex", alignItems: "center", gap: 16, ...rise(f, fps, 22)}}>
          <span style={{opacity: 0.4 + 0.6 * Math.abs(Math.sin(f / 9))}}>●</span> Ouvert tous les jours · 8h – 22h50
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Dish = ({dish, i}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const inS = spring({frame: f, fps, config: {damping: 14}});
  const out = interpolate(f, [DISH_LEN - 8, DISH_LEN + 4], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const dir = i % 2 ? -1 : 1;
  const priceS = spring({frame: f - 12, fps, config: {damping: 9, stiffness: 160}});
  return (
    <AbsoluteFill style={{alignItems: "center", justifyContent: "center", opacity: 1 - out,
      transform: `translateX(${(1 - inS) * 700 * dir - out * 700 * dir}px)`}}>
      <div style={{width: 820, height: 713, background: C.gold, clipPath: HEX, padding: 10,
        transform: `rotate(${(1 - inS) * 12 * dir}deg)`}}>
        <Img src={staticFile(dish.img)} style={{width: "100%", height: "100%", objectFit: "cover", clipPath: HEX,
          transform: `scale(${1.15 - 0.1 * inS})`}} />
      </div>
      <div style={{...display, color: C.fg, fontSize: 130, marginTop: 70, ...rise(f, fps, 5, 40)}}>{dish.n}</div>
      <div style={{...body, color: C.muted, fontSize: 40, marginTop: 18, ...rise(f, fps, 9, 30)}}>{dish.d}</div>
      <div style={{...display, color: C.ink, background: C.gold, fontSize: 84, padding: "18px 44px 22px", borderRadius: 28,
        marginTop: 44, transform: `scale(${priceS})`}}>{dish.p}</div>
    </AbsoluteFill>
  );
};

const Dishes = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Comb />
      <div style={{position: "absolute", top: 150, width: "100%", textAlign: "center", ...display, color: C.gold, fontSize: 90, ...rise(f, fps, 0, 40)}}>
        Nos menus
      </div>
      {DISHES.map((d, i) => (
        <Sequence key={d.n} from={10 + i * DISH_LEN} durationInFrames={DISH_LEN + 6}>
          <Dish dish={d} i={i} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Phone = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const enter = spring({frame: f, fps, config: {damping: 15}});
  // app.jpg is the app at 780 px wide; scroll through the menu
  const scroll = interpolate(f, [20, 100], [0, 2300], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic)});
  // a "+" tap, then a hexagon flies to the order bar
  const tap = f - 104;
  const flyP = interpolate(tap, [4, 26], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad)});
  const barIn = spring({frame: tap - 24, fps, config: {damping: 11}});
  const W = 640, H = 1300, scale = W / 780;
  const from = {x: 560, y: 760}, to = {x: W / 2, y: H - 80};
  const fx = from.x + (to.x - from.x) * flyP, fy = from.y + (to.y - from.y) * flyP - Math.sin(flyP * Math.PI) * 260;
  return (
    <AbsoluteFill style={{background: C.bg, alignItems: "center"}}>
      <Comb />
      <div style={{...display, color: C.fg, fontSize: 120, marginTop: 120, textAlign: "center", ...rise(f, fps, 4)}}>
        Commandez<br /><span style={{color: C.gold}}>en ligne</span>
      </div>
      <div style={{position: "relative", width: W, height: H, marginTop: 60, borderRadius: 70, border: "14px solid #2c2f35",
        overflow: "hidden", background: C.bg, boxShadow: "0 40px 120px rgba(242,138,30,.25)",
        transform: `translateY(${(1 - enter) * 900}px)`}}>
        <Img src={staticFile("app.jpg")} style={{width: W, transform: `translateY(${-scroll * scale}px)`}} />
        {tap > 0 && tap < 8 && (
          <div style={{position: "absolute", left: from.x - 40, top: from.y - 40, width: 80, height: 80, borderRadius: 40,
            background: "rgba(255,255,255,.35)", transform: `scale(${0.5 + tap / 8})`}} />
        )}
        {flyP > 0 && flyP < 1 && (
          <div style={{position: "absolute", left: fx - 22, top: fy - 22, width: 44, height: 44, background: C.gold, clipPath: HEX,
            transform: `rotate(${flyP * 360}deg) scale(${1.2 - flyP * 0.6})`}} />
        )}
        {tap > 20 && (
          <div style={{position: "absolute", left: 24, right: 24, bottom: 30, background: C.gold, color: C.ink, borderRadius: 26,
            padding: "26px 30px", display: "flex", justifyContent: "space-between", ...body, fontWeight: 700, fontSize: 30,
            transform: `translateY(${(1 - barIn) * 160}px)`}}>
            <span>1 article</span><span>Voir la commande</span><span>8,00 €</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const Outro = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const draw = interpolate(f, [0, 24], [0, 1], {extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{background: C.bg, alignItems: "center", justifyContent: "center", textAlign: "center"}}>
      <Comb opacity={0.08} />
      <HexLogo size={170} progress={draw} stroke={4} />
      <div style={{...display, color: C.fg, fontSize: 160, marginTop: 30, ...rise(f, fps, 6)}}>La Ruche</div>
      <div style={{...body, color: C.fg, background: C.ok, fontSize: 46, fontWeight: 700, padding: "26px 54px", borderRadius: 30,
        marginTop: 70, ...rise(f, fps, 14)}}>Commandez sur WhatsApp</div>
      <div style={{...body, color: C.muted, fontSize: 36, marginTop: 26, ...rise(f, fps, 20)}}>Sans commission · Sur place, à emporter ou livré</div>
      <div style={{...display, color: C.gold, fontSize: 96, marginTop: 80, ...rise(f, fps, 26)}}>01 30 04 94 76</div>
      <div style={{...body, color: C.muted, fontSize: 34, marginTop: 16, ...rise(f, fps, 30)}}>Les Bougimonts, Les Mureaux</div>
    </AbsoluteFill>
  );
};

const scene = ([from, len], El, fade = {}) => (
  <Sequence from={from} durationInFrames={len}>
    <Fade len={len} {...fade}><El /></Fade>
  </Sequence>
);

export const Promo = () => (
  <AbsoluteFill style={{background: C.bg}}>
    <Fonts />
    {scene(S.intro, Intro, {inF: 1})}
    {scene(S.shop, Shop)}
    {scene(S.dishes, Dishes)}
    {scene(S.phone, Phone)}
    {scene(S.outro, Outro, {outF: 1})}
  </AbsoluteFill>
);
