import {Composition} from "remotion";
import {Promo, DURATION} from "./Promo";

export const Root = () => (
  <Composition
    id="LaRuchePromo"
    component={Promo}
    durationInFrames={DURATION}
    fps={30}
    width={1080}
    height={1920}
  />
);
