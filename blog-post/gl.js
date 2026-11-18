/* The shared stage (shared/system/stage.js): curtain, glass, TAA, model slots. Config only.
   body: the curtain calms behind the reading column, so long text reads (the default look is set for headlines). */
import { startStage } from '../shared/system/stage.js';
startStage({ looks: { body: { dim: 0.12 } } });
