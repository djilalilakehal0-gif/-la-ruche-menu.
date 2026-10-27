import {
  AbsoluteFill, Img, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing, Audio,
} from "remotion";
import {C, HEX, display, body, Fonts, rise, HexLogo, Comb} from "./Promo";

// 15 s = 450 images à 30 i/s. Format vertical 1080x1920 (Reels / TikTok / Statuts WhatsApp).
export const DURATION_15 = 450;

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"};

// Plans de la vidéo (début, durée) — les plans se chevauchent un peu pour des coupes nettes
const S = {
  hook: [0, 62],
  shop: [56, 84],
  dishes: [136, 160],
  phone: [292, 100],
  outro: [388, 62],
};
const DISH_LEN = 40;
const PLATS = [
  {img: "kebab.jpg", n: "Kebab", p: "7,00 €"},
  {img: "escalope.jpg", n: "Escalope", p: "8,00 €"},
  {img: "americain.jpg", n: "Américain", p: "8,50 €"},
  {img: "tacos.jpg", n: "Tacos", p: "dès 4,50 €"},
];

// Fondu rapide en entrée/sortie d'un plan
const Plan = ({len, inF = 4, outF = 4, children}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, inF, len - outF, len], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

// Éclair blanc-doré sur les coupes (effet « impact »)
const Flash = ({at, len = 6, power = 0.55}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at, at + 1, at + len], [0, power, 0], clamp);
  return <AbsoluteFill style={{background: "#FFD9A0", opacity: o, mixBlendMode: "screen"}} />;
};

// ---------- 1. ACCROCHE : l'hexagone se dessine, le nom claque ----------
const Hook = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const draw = interpolate(f, [4, 26], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const fill = interpolate(f, [24, 36], [0, 1], clamp);
  const slam = spring({frame: f - 22, fps, config: {damping: 11, stiffness: 190}});
  const track = interpolate(f, [22, 62], [0.14, 0.02], clamp);
  return (
    <AbsoluteFill style={{background: "radial-gradient(circle at 50% 45%, #2a1c08 0%, #141518 62%)", alignItems: "center", justifyContent: "center"}}>
      <Comb opacity={0.07 * fill} />
      <div style={{position: "relative", transform: `scale(${0.85 + 0.15 * spring({frame: f, fps})})`}}>
        <div style={{position: "absolute", inset: 30, background: C.gold, clipPath: HEX, opacity: fill * 0.2, filter: "blur(2px)"}} />
        <HexLogo size={320} progress={draw} stroke={3} />
      </div>
      <div style={{...display, color: C.fg, fontSize: 210, marginTop: 40, letterSpacing: `${track}em`,
        opacity: slam > 0.02 ? 1 : 0, transform: `scale(${2.2 - 1.2 * slam})`}}>La Ruche</div>
      <div style={{...body, color: C.gold, fontSize: 40, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 26, ...rise(f, fps, 34)}}>
        Les Mureaux
      </div>
    </AbsoluteFill>
  );
};

// ---------- 2. LA DEVANTURE : lent « push-in » sur la photo ----------
const Shop = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const zoom = interpolate(f, [0, 84], [1.32, 1.08], {easing: Easing.out(Easing.quad)});
  const panX = interpolate(f, [0, 84], [-30, 20]);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Img src={staticFile("storefront.jpg")} style={{width: "100%", height: "100%", objectFit: "cover", transform: `translateX(${panX}px) scale(${zoom})`}} />
      <AbsoluteFill style={{background: "linear-gradient(180deg,rgba(20,21,24,.15) 25%,rgba(20,21,24,.96) 80%)"}} />
      <AbsoluteFill style={{justifyContent: "flex-end", padding: "0 80px 250px", gap: 22}}>
        <div style={{...body, color: C.gold, fontSize: 36, letterSpacing: "0.16em", textTransform: "uppercase", ...rise(f, fps, 6)}}>
          Pizzeria · Grillades · Spécialités
        </div>
        <div style={{...display, color: C.fg, fontSize: 168, ...rise(f, fps, 12)}}>Faim ?<br /><span style={{color: C.gold}}>On a ça.</span></div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- 3. LES PLATS : coupes rapides, prix qui claque ----------
const Plat = ({plat, i}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const inS = spring({frame: f, fps, config: {damping: 15, stiffness: 150}});
  const zoom = interpolate(f, [0, DISH_LEN + 6], [1.18, 1.02]);
  const price = spring({frame: f - 10, fps, config: {damping: 8, stiffness: 190}});
  const dir = i % 2 ? -1 : 1;
  return (
    <AbsoluteFill style={{alignItems: "center", justifyContent: "center", transform: `translateX(${(1 - inS) * 500 * dir}px)`, opacity: inS}}>
      <div style={{width: 840, height: 730, background: C.gold, clipPath: HEX, padding: 10, boxShadow: "0 0 160px rgba(242,138,30,.5)"}}>
        <Img src={staticFile(plat.img)} style={{width: "100%", height: "100%", objectFit: "cover", clipPath: HEX, transform: `scale(${zoom})`}} />
      </div>
      <div style={{...display, color: C.fg, fontSize: 150, marginTop: 70, ...rise(f, fps, 4, 40)}}>{plat.n}</div>
      <div style={{...display, color: C.ink, background: C.gold, fontSize: 96, padding: "16px 48px 22px", borderRadius: 28, marginTop: 40,
        transform: `scale(${price}) rotate(${(1 - price) * -8}deg)`}}>{plat.p}</div>
    </AbsoluteFill>
  );
};

const Dishes = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: "radial-gradient(circle at 50% 50%, #241a0b 0%, #141518 70%)"}}>
      <Comb opacity={0.06} />
      <div style={{position: "absolute", top: 140, width: "100%", textAlign: "center", ...display, color: C.gold, fontSize: 80, ...rise(f, fps, 0, 30)}}>
        Nos best-sellers
      </div>
      {PLATS.map((d, i) => (
        <Sequence key={d.n} from={i * DISH_LEN} durationInFrames={DISH_LEN + 2}>
          <Plat plat={d} i={i} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// ---------- 4. L'APPLI : défilement du menu + ajout à la commande ----------
const Phone = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const enter = spring({frame: f, fps, config: {damping: 15}});
  const scroll = interpolate(f, [10, 66], [0, 2300], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const tap = f - 68;
  const flyP = interpolate(tap, [4, 22], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const barIn = spring({frame: tap - 20, fps, config: {damping: 11}});
  const W = 640, H = 1300, scale = W / 780;
  const from = {x: 560, y: 760}, to = {x: W / 2, y: H - 80};
  const fx = from.x + (to.x - from.x) * flyP, fy = from.y + (to.y - from.y) * flyP - Math.sin(flyP * Math.PI) * 260;
  // légère rotation 3D du téléphone pour un rendu « produit »
  const tilt = interpolate(f, [0, 100], [8, -4]);
  return (
    <AbsoluteFill style={{background: "radial-gradient(circle at 50% 60%, #2a1c08 0%, #141518 65%)", alignItems: "center"}}>
      <Comb opacity={0.06} />
      <div style={{...display, color: C.fg, fontSize: 124, marginTop: 110, textAlign: "center", ...rise(f, fps, 2)}}>
        Commandez<br /><span style={{color: C.gold}}>en 3 clics</span>
      </div>
      <div style={{perspective: 1800, marginTop: 50}}>
        <div style={{position: "relative", width: W, height: H, borderRadius: 70, border: "14px solid #2c2f35", overflow: "hidden", background: C.bg,
          boxShadow: "0 50px 140px rgba(242,138,30,.35)", transform: `translateY(${(1 - enter) * 900}px) rotateY(${tilt}deg)`}}>
          <Img src={staticFile("app.jpg")} style={{width: W, transform: `translateY(${-scroll * scale}px)`}} />
          {tap > 0 && tap < 8 && (
            <div style={{position: "absolute", left: from.x - 40, top: from.y - 40, width: 80, height: 80, borderRadius: 40, background: "rgba(255,255,255,.4)", transform: `scale(${0.5 + tap / 8})`}} />
          )}
          {flyP > 0 && flyP < 1 && (
            <div style={{position: "absolute", left: fx - 22, top: fy - 22, width: 44, height: 44, background: C.gold, clipPath: HEX, transform: `rotate(${flyP * 360}deg) scale(${1.2 - flyP * 0.6})`}} />
          )}
          {tap > 16 && (
            <div style={{position: "absolute", left: 24, right: 24, bottom: 30, background: C.gold, color: C.ink, borderRadius: 26, padding: "26px 30px",
              display: "flex", justifyContent: "space-between", ...body, fontWeight: 700, fontSize: 30, transform: `translateY(${(1 - barIn) * 160}px)`}}>
              <span>1 article</span><span>Voir la commande</span><span>8,00 €</span>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 5. APPEL À L'ACTION ----------
const Outro = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const pulse = 1 + 0.025 * Math.sin(f / 4);
  return (
    <AbsoluteFill style={{background: "radial-gradient(circle at 50% 40%, #2a1c08 0%, #141518 65%)", alignItems: "center", justifyContent: "center", textAlign: "center"}}>
      <Comb opacity={0.08} />
      <HexLogo size={170} progress={interpolate(f, [0, 16], [0, 1], clamp)} stroke={4} />
      <div style={{...display, color: C.fg, fontSize: 170, marginTop: 24, ...rise(f, fps, 4)}}>La Ruche</div>
      <div style={{...body, color: C.fg, background: C.ok, fontSize: 48, fontWeight: 700, padding: "26px 56px", borderRadius: 30, marginTop: 64,
        ...rise(f, fps, 10), transform: `scale(${pulse})`}}>Commandez sur WhatsApp</div>
      <div style={{...display, color: C.gold, fontSize: 100, marginTop: 70, ...rise(f, fps, 16)}}>01 30 04 94 76</div>
      <div style={{...body, color: C.muted, fontSize: 34, marginTop: 14, ...rise(f, fps, 20)}}>Les Bougimonts, Les Mureaux</div>
    </AbsoluteFill>
  );
};

// ---------- Habillage « cinéma » global : vignette, grain, barres ----------
const Grain = () => {
  const f = useCurrentFrame();
  const seed = f % 6;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='${seed}'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`;
  return <AbsoluteFill style={{backgroundImage: `url("data:image/svg+xml,${svg}")`, opacity: 0.09, mixBlendMode: "overlay"}} />;
};

const Cinema = () => (
  <>
    <Grain />
    <AbsoluteFill style={{background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)"}} />
    {/* teinte chaude sur les tons moyens pour l'étalonnage */}
    <AbsoluteFill style={{background: "rgba(242,138,30,.05)", mixBlendMode: "soft-light"}} />
  </>
);

const plan = ([from, len], El, p = {}) => (
  <Sequence from={from} durationInFrames={len}>
    <Plan len={len} {...p}><El /></Plan>
  </Sequence>
);

export const Promo15 = () => (
  <AbsoluteFill style={{background: C.bg}}>
    <Fonts />
    {plan(S.hook, Hook, {inF: 1})}
    {plan(S.shop, Shop)}
    {plan(S.dishes, Dishes)}
    {plan(S.phone, Phone)}
    {plan(S.outro, Outro, {outF: 1})}
    <Cinema />
    {/* éclairs sur les coupes */}
    <Flash at={22} power={0.5} />
    <Flash at={S.shop[0]} />
    <Flash at={S.dishes[0]} />
    <Flash at={S.phone[0]} />
    <Flash at={S.outro[0]} power={0.6} />
    <Audio src={staticFile("music.wav")} />
  </AbsoluteFill>
);
