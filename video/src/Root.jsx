import {Composition} from "remotion";
import {Promo, DURATION} from "./Promo";
import {Motion, MOTION_DURATION} from "./Motion";

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
  </>
);
