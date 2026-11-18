/* BitGo shared basics: markup for the small parts (styles in base.css). Every page and module builds these parts
   through here, so the markup can't drift. */
window.Parts = {
  /* o.sm: nav card size; o.light: on white grounds; o.rv: false turns off the scroll reveal */
  eyebrow(label, o = {}) {
    return `<span class="eyebrow${o.sm ? ' sm' : ''}${o.light ? ' light' : ''}"${o.rv === false ? '' : ' data-rv'}><i aria-hidden="true"></i>${label}</span>`;
  },

  /* Headings in Title Case (set 2026-11-17). Every word is capitalised except short joining words (a, the, and, of, to...)
     in the middle; words that already carry capitals inside (BitGo, NYSE, USDC) stay as written. Only letter case
     changes, never length, so it works across nested markup (<em>, <span>). */
  /* s: a string, or an array of segments (the text nodes of one heading). Words never run across segments, so a heading
     split over lines (one <span> per line) is read as separate words; first and last word are counted over the whole. */
  titleCase(s) {
    const MINOR = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet', 'as', 'at', 'by', 'in', 'of', 'on', 'to', 'via', 'vs', 'per']);
    const segs = Array.isArray(s) ? s.slice() : [s], words = [];
    segs.forEach((seg, j) => { for (const m of seg.matchAll(/[A-Za-z][A-Za-z'\u2019]*/g)) words.push({ j, at: m.index, w: m[0] }); });
    words.forEach((x, i) => {
      const before = (segs.slice(0, x.j).join('') + segs[x.j].slice(0, x.at)).trimEnd();
      const first = i === 0 || /[:\u2014.?!]$/.test(before), last = i === words.length - 1;   // a new sentence starts capitalised ("Priced In. A Surprise", "N.A.")
      const sg = segs[x.j], l = sg.lastIndexOf(' ', x.at) + 1, r = sg.indexOf(' ', x.at), tok = sg.slice(l, r < 0 ? undefined : r);
      if (/@|:\/\/|\w\.(com|io|org|net|co|xyz|finance)\b/i.test(tok)) return;   // emails and web addresses stay as written ("press@bitgo.com")
      const BRAND = { bitgo: 'BitGo' }, bl = x.w.toLowerCase();
      if (BRAND[bl]) { segs[x.j] = segs[x.j].slice(0, x.at) + BRAND[bl] + segs[x.j].slice(x.at + x.w.length); return; }   // brand names always as the brand writes them
      if (/[A-Z]/.test(x.w.slice(1))) return;                     // NYSE, iPhone: as written
      const lower = x.w.toLowerCase(), t = MINOR.has(lower) && !first && !last ? lower : lower[0].toUpperCase() + lower.slice(1);
      segs[x.j] = segs[x.j].slice(0, x.at) + t + segs[x.j].slice(x.at + t.length);
    });
    return Array.isArray(s) ? segs : segs[0];
  },
  /* apply to every h1, h2 and h3 under root; FAQ questions (sentences) and the rotating hero word are left alone */
  titleize(root, o = {}) {
    if (!root) return;
    root.querySelectorAll(o.eyebrows ? 'h1, h2, h3, .eyebrow' : 'h1, h2, h3').forEach(h => {   // eyebrows: product pages (the live copy has some in lower case)
      if (h.closest('.faq, .m-faq, details, .mc-ui')) return;
      const nodes = [], tw = document.createTreeWalker(h, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest('.rot') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
      while (tw.nextNode()) nodes.push(tw.currentNode);
      // a trailing rotation (hero head + words): a word still follows the fixed text, so its last word ("for") stays minor
      const trail = h.lastElementChild && h.lastElementChild.classList.contains('rot') && h.firstElementChild !== h.lastElementChild;
      // a leading rotation (words + rest): a word comes before the fixed text, so its first word ("for") stays minor too
      const lead = h.firstElementChild && h.firstElementChild.classList.contains('rot') && h.firstElementChild !== h.lastElementChild;
      const t = Parts.titleCase((lead ? ['Word '] : []).concat(nodes.map(n => n.nodeValue), trail ? [' Word'] : []));
      if (lead) t.shift();
      nodes.forEach((n, k) => { if (n.nodeValue !== t[k]) n.nodeValue = t[k]; });
      if (h.hasAttribute('aria-label')) h.setAttribute('aria-label', Parts.titleCase(h.getAttribute('aria-label')));
    });
  }
};
