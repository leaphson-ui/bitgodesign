// Builds the point forms off the main thread and hands each one back as soon as it is ready.
import { buildShape } from './shapes.js';
onmessage = e => {
  const { N, order } = e.data;
  for (const name of order) {
    const s = buildShape(name, N);
    postMessage({ name, s }, [s.pos.buffer, s.nrm.buffer, s.grp.buffer]);
  }
};
