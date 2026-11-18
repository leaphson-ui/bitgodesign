/* Transfer Agent UI art (status: review). Registered into the shared UI registry through Modules.uiKit, in the language of
   ui-arts.js: a white product panel, Inter Tight, BitGo blue, a short eased loop that ends on a complete still frame.
   Every row, column head and Yes/No is the live page's own comparison table (bitgo.com/products/transfer-agent/, the
   "How Our Transfer Agent Services Compare" image), in its order; the image's footnote is left out (it names a different
   entity from the page's disclosure line). Styles: transfer-agent.css.
     taCompare   "How Our Transfer Agent Services Compare": the BitGo column ticks down the rows one by one, against the
                 traditional transfer agents' column */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, mountUI, sm, cl, reduce } = K;
  const YES = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12"/><path d="M7.2 12.4l3.3 3.3 6.4-6.9"/></svg>';
  const NO = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12"/><path d="M8.3 8.3l7.4 7.4M15.7 8.3l-7.4 7.4"/></svg>';

  UI.taCompare = el => {
    const rows = [
      [['Record Investors'], 1], [['Record Holdings'], 1], [['Compatible with both book-entry and', 'blockchain-based securities'], 0],
      [['Issue Securities'], 1], [['Cost effective for private placements,', 'including under Reg CF and A+'], 0, ['Especially for broadly', 'held issues']],
      [['ATS Integration Ready'], 0], [['API Based'], 0], [['Full UX Design Flexibility'], 0],
      [['Paying Agent services for', 'programmatic distributions of dividends', 'or interest payments'], 0]];
    const XT = 372, XB = 494, H0 = 68, ys = []; let y = H0;
    rows.forEach(([lab, , note]) => { const h = 18 + 16 * Math.max(lab.length, note ? 3 : 1); ys.push([y, h]); y += h; });
    const HT = y + 10;
    const body =
      B(432, 10, 124, HT - 20, 'tac-col', '', 'col') + B(12, 0, 556, 34, 'hl', '', 'hl') +
      T(XT, 30, 'Traditional<br>Transfer Agents', 12, { w: 600, c: 'nm', al: 'c' }) + T(XB, 30, 'Transfer Agent in<br>BitGo Ecosystem', 12, { w: 600, c: 'a', al: 'c' }) +
      rows.map(([lab, trad, note], i) => {
        const [y0, h] = ys[i], cy = y0 + h / 2, ly = cy - (lab.length - 1) * 8, by = note ? cy - 16 : cy;
        return hr(24, y0, 532) + T(24, ly, lab.join('<br>'), 12.5, { w: 500, c: 'k' }) +
          `<span class="tac-ic ${trad ? 'y' : 'n'}" style="left:${XT - 28}px;top:${cy - 8}px">${trad ? YES : NO}</span>` + T(XT - 6, cy, trad ? 'Yes' : 'No', 12.5, { w: 600, c: trad ? 'k' : 'm' }) +
          CK('c' + i, XB - 30, by - 9, 18) + T(XB - 6, by, 'Yes', 12.5, { w: 600, c: 'k', k: 'y' + i }) +
          (note ? T(XB, by + 22, note.join('<br>'), 10.5, { c: 'm', al: 'c' }) : '');
      }).join('');
    mountUI(el, 580, HT, B(0, 0, 580, HT, 'u-p', body), (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off), s0 = .7, step = .34;
      const pos = Math.min(rows.length - 1, Math.max(0, (tt - s0) / step)), k =Math.min(rows.length - 1, Math.floor(pos));
      const [hy, hh] = ys[k], nx = ys[Math.min(rows.length - 1, k + 1)], fr = sm(.6, 1, pos - k), yy = hy + (nx[0] - hy) * (k < rows.length - 1 ? fr : 0), hhh = hh + (nx[1] - hh) * (k < rows.length - 1 ? fr : 0);
      R.hl.style.transform = `translateY(${(yy + 2).toFixed(2)}px)`; R.hl.style.height = (hhh - 4).toFixed(2) + 'px';
      R.hl.style.opacity = sm(s0 - .3, s0, tt) * (1 - sm(s0 + step * rows.length, s0 + step * rows.length + .4, tt)) * (1 - off);
      rows.forEach((_, i) => { const p = f(s0 + i * step + .1, s0 + i * step + .35); setCk(R['c' + i], p, 0, t); R['y' + i].style.opacity = .25 + .75 * p; });
      R.col.classList.toggle('on', f(s0 + step * rows.length, s0 + step * rows.length + .3) > .5);
    });
  };
})();
