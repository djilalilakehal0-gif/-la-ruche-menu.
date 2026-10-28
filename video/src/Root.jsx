import {Composition} from "remotion";
import {Promo, DURATION} from "./Promo";
import {Motion, MOTION_DURATION} from "./Motion";
import {Burger, BURGER_DURATION} from "./Burger";
import {BurgerRise, RISE_DURATION, RISE_FPS} from "./BurgerRise";

export const Root = () => (
  <>
    <Composition
      id="LaRuchePromo"
      component={Promo}
      durationInFrames={DURATION}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="LaRucheMotion"
      component={Motion}
      durationInFrames={MOTION_DURATION}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="BurgerLuxe"
      component={Burger}
      durationInFrames={BURGER_DURATION}
      fps={30}
      width={1080}
      height={1350}
    />
    <Composition
      id="BurgerRise"
      component={BurgerRise}
      durationInFrames={RISE_DURATION}
      fps={RISE_FPS}
      width={1080}
      height={1350}
    />
  </>
);
