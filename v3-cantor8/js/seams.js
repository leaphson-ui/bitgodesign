// Section seams: the follow line draws across the page, then opens the next surface from itself.
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => v * v * (3 - 2 * v);
export function initSeams() {
  const seams = [...document.querySelectorAll('.seam')];
  const upd = () => {
    const vh = innerHeight;
    for (const el of seams) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) continue;
      const all = clamp((vh * 0.98 - r.top) / (vh * 0.6));
      el.style.setProperty('--p', ease(clamp(all / 0.5)).toFixed(3));
      el.style.setProperty('--o', ease(clamp((all - 0.35) / 0.65)).toFixed(3));
    }
  };
  addEventListener('scroll', upd, { passive: true });
  addEventListener('resize', upd);
  upd();
}
