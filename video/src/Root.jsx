import {Composition} from "remotion";
import {Promo, DURATION} from "./Promo";
import {Promo15, DURATION_15} from "./Promo15";

export const Root = () => (
  <>
    <Composition id="LaRuchePromo" component={Promo} durationInFrames={DURATION} fps={30} width={1080} height={1920} />
    <Composition id="LaRuchePromo15" component={Promo15} durationInFrames={DURATION_15} fps={30} width={1080} height={1920} />
  </>
);
