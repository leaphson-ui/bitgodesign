/* BitGo design system library: the one renderer behind every module page (library/m/<slug>.html).
   A page file only says which module it shows: <script src="../module.js" data-slug="50-50"></script>.
   Names, handoff text and rules come from shared/system/system-data.js. Demos mount the real shared files
   (base.css, modules.css, parts.js, modules.js) with the real page copy. Library chrome only: nothing here styles a part or a module. */
(function () {
  const me = document.currentScript, SLUG = me.dataset.slug, BASE = new URL('.', me.src).href;   // BASE = library/
  const ROOT = new URL('../', BASE).href;                                                          // bitgo-versions/
  const SC = ROOT + 'sc-refokus/index.html', HOME = ROOT + 'v3-refokus/index.html', QC = ROOT + 'qc-refokus/index.html', CW = ROOT + 'cw-refokus/index.html';
  const COLD = ROOT + 'cold-wallets/index.html', GM = ROOT + 'prime/index.html';   // product pages rebuilt on approved modules (2026-11-17)
  const rel = u => { const x = new URL(u); return x.pathname.replace(/^.*\/bitgo-versions\//, '../../') + x.hash; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = s => document.querySelector(s);
  const fixLogos = a => a.map(s => s.replace(/^\.\.\//, '../../'));

  /* load the shared files in order, then render */
  const deps = ['sc-refokus/content-sc.js', 'shared/content.js', 'shared/system/system-data.js', 'shared/system/parts.js', 'shared/system/modules.js', 'shared/system/ui-arts.js'];
  deps.reduce((p, d) => p.then(() => new Promise((ok, no) => { const s = document.createElement('script'); s.src = ROOT + d; s.onload = ok; s.onerror = () => no(new Error('load ' + d)); document.head.appendChild(s); })), Promise.resolve())
    .then(() => new Promise(ok => { const s = document.createElement('script'); s.src = ROOT + 'shared/arts/manifest.js'; s.onload = ok; s.onerror = ok; document.head.appendChild(s); }))
    .then(() => Promise.all((window.ART_FILES || []).map(f => new Promise(ok => {   // every page's arts, so the gallery shows them all
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = ROOT + 'shared/arts/' + f + '.css'; document.head.appendChild(l);
      const s = document.createElement('script'); s.src = ROOT + 'shared/arts/' + f + '.js'; s.onload = ok; s.onerror = ok; document.head.appendChild(s);
    }))))
    .then(build).catch(e => { document.body.innerHTML = '<p style="padding:40px">' + esc(e.message) + '</p>'; throw e; });

  /* ---------- the module pages: what each one shows ---------- */
  /* demo: { h, sub, note, mount(el) } renders live from the shared files; { h, sub, note, page: [src, height] } embeds the real page section.
     usage: source snippets read from the page files (file, first line to find, number of lines). */
  const Q = () => window.SC, B = () => window.BITGO;
  const split = (el, K, side, ui, extra) => Modules.split(el, Object.assign({ eyebrow: K.label, title: K.title, text: K.text, cta: K.cta, side, visual: { ui } }, extra));
  const SPLIT_OPTS = [['eyebrow', 'Pill above the heading. Optional.'], ['title', 'Heading.'], ['text', 'Array of paragraphs, each a lead.'], ['list', 'Array of rows under the heading, each a lead with a rule before it. Not in the header comment.'],
    ['cta', '{ label, href, style }. Style defaults to white. Optional.'], ['side', "'right' (visual right) or 'left' (mirrored)."], ['visual', '{ model, fit, partner } for a 3D slot drawn by the page, or { ui } for a product-UI diagram (ui is not in the header comment). Empty object for no visual.']];
  const MULTI_OPTS = [['eyebrow', 'Pill above the headline. Optional.'], ['title', 'Headline.'], ['text', 'Supporting copy under the headline. Optional.'], ['cards', 'Array of { title, text, cta, art, tone }. Three stacked cards. tone names the surface: ink (near-black), paper (light, blue button), deep (dark navy). Left out, the tones run ink, paper, deep by position.'], ['art', 'Name of a product-UI diagram (see Code animation) or a canvas art (goaccount, staking, gonetwork, cosign).']];

  const MODS = {
    '50-50': {
      call: 'Modules.split(el, { eyebrow, title, text: [], cta: {label, href, style}, side: \'right\'|\'left\', visual: {model, fit, partner} })',
      demos: [
        { h: 'Text left, UI visual', sub: 'Key Management: Hot Wallets · side right · visual ui scHot', mount: el => split(el, Q().keys[0], 'right', 'scHot'), note: 'Product-UI diagram on a solid panel, no floating captions.' },
        { h: 'Mirrored', sub: 'Key Management: Cold Wallets · side left · visual ui scCold', mount: el => split(el, Q().keys[1], 'left', 'scCold'), note: 'Approved for a pair of 50/50s: the second one mirrored.' },
        { h: 'List variant', sub: 'Homepage "24/7 Support" · list, no visual here', mount: el => Modules.split(el, { eyebrow: B().support.label, title: B().support.title, list: B().support.items, side: 'right', visual: {} }), note: 'The homepage draws a 3D object in the empty column. See it below.' },
        { h: 'List variant with its 3D object', sub: 'Homepage #support', page: [HOME + '#support', 760], note: '3D needs the page renderer.' },
        { h: '3D visual, partner mark', sub: 'Self-Custody #wc · visual model logo3d, partner walletconnect', page: [SC + '#wc', 760], note: 'WalletConnect mark in milky glass.' }
      ],
      usage: [['Self-Custody: WalletConnect', 'sc-refokus/ui.js', /Modules\.split\(\$\('#wc'\)/, 1], ['Self-Custody: Key Management pair', 'sc-refokus/ui.js', /const K = Q\.keys;/, 3], ['Self-Custody: API Access and In-app pair', 'sc-refokus/ui.js', /\$\('#rows'\)\.innerHTML/, 2], ['Homepage: Support', 'v3-refokus/ui.js', /const S = B\.support;/, 2]],
      opts: SPLIT_OPTS,
      used: [['Self-Custody', 'WalletConnect', SC + '#wc'], ['Self-Custody', 'Key Management: Hot Wallets', SC + '#km-hot'], ['Self-Custody', 'Key Management: Cold Wallets (mirrored)', SC + '#km-cold'], ['Self-Custody', 'API Access', SC + '#row-api'], ['Self-Custody', 'In-app (mirrored)', SC + '#row-app'], ['Homepage', '24/7 Support (list)', HOME + '#support']]
    },

    'section-headline': {
      call: 'Modules.section(el, { eyebrow, title, text, cta })   // Modules.headline({ eyebrow, title, text }) returns the same markup for other modules',
      demos: [
        { h: 'Eyebrow, headline, lead', sub: 'Self-Custody "Why Self-Custody" copy · centered', mount: el => Modules.section(el, { eyebrow: Q().why.label, title: Q().why.title, text: Q().why.text }) },
        { h: 'Headline only', sub: 'Homepage "Build" copy · centered', mount: el => Modules.section(el, { title: B().build.title }) }
      ],
      usage: [['Cold Wallets', 'cold-wallets/ui.js', /Modules\.section\(/, 1], ['Global Markets (head of a split pair)', 'prime/ui.js', /Modules\.section\(/, 1]],
      opts: [['eyebrow', 'Pill above the headline. Optional.'], ['title', 'Headline (h2.big, the one shared size).'], ['text', 'Lead under it. Optional.'], ['cta', '{ label, href }: a white button under it. Optional.']],
      used: [['Self-Custody', 'Why Self-Custody (as the multicard head)', SC + '#why'], ['Cold Wallets', 'Best for', COLD + '#best'], ['Global Markets', 'Research & Asset Management', GM + '#research']],
      note: 'One size everywhere: designcheck.py fails any section headline that renders at another size.'
    },

    'card-grid': {
      call: 'Modules.multicard(el, { eyebrow, title, text, cards: [{ title, text, cta, art }] })',
      demos: [
        { h: 'Self-Custody: Why Self-Custody', sub: 'Eyebrow, headline, lead · three cards with product-UI art', mount: el => Modules.multicard(el, { eyebrow: Q().why.label, title: Q().why.title, text: Q().why.text, cards: Q().why.cards.map((c, i) => ({ title: c.title, text: c.text, art: ['scSecurity', 'scCompliance', 'scConfig'][i] })) }), note: 'Cards stack as you scroll.' },
        { h: 'Homepage: Build', sub: 'Headline only · cards with a button · canvas arts and one diagram', mount: el => Modules.multicard(el, { title: B().build.title, cards: B().build.cards.map((c, i) => ({ title: c.label, text: c.text, cta: c.cta, art: ['goaccount', 'staking', 'goNetwork'][i] })) }) }
      ],
      usage: [['Self-Custody: Why Self-Custody', 'sc-refokus/ui.js', /const W = Q\.why;/, 2], ['Homepage: Build', 'v3-refokus/ui.js', /const BD = B\.build;/, 2]],
      opts: MULTI_OPTS,
      used: [['Self-Custody', 'Why Self-Custody', SC + '#why'], ['Homepage', 'Build', HOME + '#build'], ['Cold Wallets', 'Keeping Your Assets Safe (cwHardware, cwSoftware, cwHsm)', COLD + '#layers'], ['Global Markets', 'Global Liquidity Layer (gmElectronic, gmVoice, gmTools)', GM + '#access'], ['Global Markets', 'Financing, Derivatives & Structured Solutions (gmFinancing, gmDerivatives, gmCollateral)', GM + '#manage']],
      note: 'Every 3-card section is this module. Each card gets a live UI art that shows what the card says (arts: modules.js, shared/system/ui-arts.js, shared/arts/<page>.js).'
    },

    'logo-cloud': {
      call: 'Modules.logos(el, { title, logos: [src, ...] })',
      demos: [
        { h: 'Two counter-scrolling rows', sub: 'Self-Custody and Homepage use the same title and logos', mount: el => Modules.logos(el, { title: Q().trustTitle, logos: fixLogos(B().trust.logos) }), note: 'Solid white logos, no 3D behind them. The grid version is not decided.' }
      ],
      usage: [['Self-Custody', 'sc-refokus/ui.js', /const lg = B\.trust\.logos;/, 2], ['Homepage', 'v3-refokus/ui.js', /const lg = B\.trust\.logos;/, 2]],
      opts: [['title', 'Heading over the rows.'], ['logos', 'Array of image paths. Every logo is a plain image: none link.'], ['headline', 'true: the title renders as the shared section headline (h2.big, same size as every headline), for a live section that heads its logos with a full headline ("Supporting Thousands of Businesses Around the World").']],
      used: [['Self-Custody', 'Globally trusted since 2013', SC + '#trust'], ['Homepage', 'Globally trusted since 2013', HOME + '#trust'], ['Cold Wallets', 'Supporting Thousands of Businesses (headline option)', COLD + '#clients']]
    },

    'cta-banner': {
      call: 'Modules.banner(el, { title: [line, line], em: [\'phrase\', ...], cta: {label, href}, panel, scene })',
      demos: [
        { h: 'Mid-page banner', sub: 'Self-Custody guide · glass panel, italic serif phrase, one white button', mount: el => Modules.banner(el, { title: Q().guide.title, em: ['Crypto Custody', 'vs. Self-Custody'], cta: Q().guide.cta }) },
        { h: 'Closing CTA: panel:false', sub: 'Self-Custody #cta · no panel, title and white button on the open scene', mount: el => Modules.banner(el, { title: Q().cta.title, cta: { label: Q().cta.button, href: '#' }, panel: false }) },
        { h: 'Closing CTA with a 3D object: panel:false, scene:true', sub: 'Homepage #cta · title clear of the right half, tall on phones', page: [HOME + '#cta', 620], note: '3D needs the page renderer.' }
      ],
      usage: [['Self-Custody: mid-page', 'sc-refokus/ui.js', /const G = Q\.guide;/, 2], ['Self-Custody: closing', 'sc-refokus/ui.js', /const CT = Q\.cta;/, 2], ['Homepage: closing', 'v3-refokus/ui.js', /const CT = B\.cta;/, 2]],
      opts: [['title', 'Array of lines, one block each.'], ['em', 'Phrases set in italic serif wherever they appear in the title.'], ['cta', '{ label, href }. White button.'], ['panel', 'Default true: the glass panel. false: no panel, the closing call to action.'], ['scene', 'With panel:false. A page 3D object stands on the right: the title keeps to the left half and uses the panel heading size; on phones the section is tall with the copy at the bottom.']],
      used: [['Self-Custody', 'Guide banner', SC + '#guide'], ['Self-Custody', 'Closing CTA', SC + '#cta'], ['Homepage', 'Closing CTA (scene)', HOME + '#cta']]
    },

    'code-animation': {
      call: 'Modules.ui(el, name)  // added for this library. Needs an .m-split or .m-multi ancestor',
      ui: true,
      usage: [['In a 50/50', 'sc-refokus/ui.js', /const K = Q\.keys;/, 3], ['In a card', 'sc-refokus/ui.js', /const W = Q\.why;/, 2], ['In a card (homepage)', 'v3-refokus/ui.js', /const BD = B\.build;/, 2]],
      usageText: [['Direct call (library only)', "Modules.ui(document.querySelector('#frame'), 'scHot');   // returns false for an unknown name\nModules.ui.names;                                    // every diagram name"]],
      opts: [['el', 'Empty element, sized by you. The diagram fits itself to it.'], ['name', 'One of Modules.ui.names.']],
      used: [['Self-Custody', 'Why Self-Custody cards', SC + '#why'], ['Self-Custody', 'Key Management', SC + '#kman'], ['Self-Custody', 'API Access and In-app', SC + '#rows'], ['Homepage', 'Build: Go Network card', HOME + '#build']]
    },

    'primary-hero': {
      pageOnly: true,
      demos: [{ h: 'Self-Custody hero', sub: 'Copy bottom left · one glass key in the open space on the right', page: [SC + '#hero', 760], note: '3D needs the page renderer.' },
        { h: 'Homepage hero: rotate decode', sub: 'Rotating first word drawn in by a band of dots · larger heading', page: [HOME + '#hero', 760], note: '3D needs the page renderer. Modules.hero with rotate: { style: decode }.' }],
      usage: [['Self-Custody', 'sc-refokus/ui.js', /const H = Q\.hero;/, 5], ['Homepage: decode rotation', 'v3-refokus/ui.js', /Modules\.hero\(\$\('#hero'\)/, 1]],
      usageText: [['Options', "Modules.hero(el, { eyebrow, title, words: [...], rest, lead, cta: {label, href}, model, fit, align, label,\n  rotate: { style: 'rise' | 'decode', first, every } })\n// rotate.style 'rise' (default): each letter rises in (Qualified Custody).\n// rotate.style 'decode': a band of dots draws each new word in; larger heading; first = ms before the first change (1000), every = ms between changes (2300); label = h1 aria-label."]],
      used: [['Self-Custody', 'Hero', SC + '#hero'], ['Homepage', 'Hero (rotate decode)', HOME + '#hero'], ['Qualified Custody', 'Hero (own layout)', QC + '#hero'], ['Custody Wallets', 'Hero (own layout)', CW + '#hero']],
      places: ['Eyebrow (Parts.eyebrow)', 'White button (.btn.white)']
    },
    'list-with-image': {
      call: "Modules.pinned(el, { mode: 'swap' | 'scroll', title, items, visual, side, expose, trackId, perItem })",
      demos: [
        { h: 'swap: Core Services', sub: 'Homepage #core · opener, then a pinned panel; the list and one explainer at a time follow the scroll', page: [HOME + '#core', 760], note: '3D needs the page renderer. Scroll inside the frame.' },
        { h: 'scroll: Own', sub: 'Homepage #own · the items scroll past a pinned visual; the nearest item lights', page: [HOME + '#own', 760], note: '3D needs the page renderer. Scroll inside the frame.' }
      ],
      usage: [['Homepage: Core Services', 'v3-refokus/ui.js', /Modules\.pinned\(\$\('#core'\)/, 1], ['Homepage: Own', 'v3-refokus/ui.js', /Modules\.pinned\(\$\('#own'\)/, 1]],
      opts: [['mode', "'swap': a full-screen opener, then a pinned panel (clickable list, one explainer at a time; items { title, short, long, cta }). 'scroll': a centred headline, then items that scroll past the pinned visual (items { title, text }). The active item is picked differently on purpose: swap by progress through the track, scroll by the item nearest the middle of the screen."],
        ['title', 'swap: array of lines (the 2nd line in serif italic). scroll: one string.'], ['items', 'Array; fields depend on mode (above). cta is { label, href }, a white button.'],
        ['visual', 'Optional HTML for the visual slot. The page draws its 3D object there.'], ['side', "'left' (default, visual left) or 'right'. Phones stack the two."],
        ['expose', 'Name of the window object kept up to date for the page 3D: { active } (swap) or { active, count } (scroll). active is -1 before the first item.'], ['trackId, perItem', 'swap only: the id of the track, and its vh per item (default 45; the track is items x perItem + 100 vh tall).']],
      used: [['Homepage', 'Core Services', HOME + '#core'], ['Homepage', 'Own', HOME + '#own'], ['Global Markets', 'Why Institutions Choose (scroll, shield)', GM + '#why']],
      places: ['White button (.btn.white) in each Core Services explainer', 'Section headline (h2.big) over Own'],
      note: 'The visual slot keeps the class names the homepage gl.js reads: core-vis and core-sticky (swap), own-vis and own-stack (scroll).'
    },
    'logo-card-lockup': {
      call: 'Modules.lockup(el, { title, text, cta: {label, href}, rows: [{ href, image, name, text }], logos: [{ image, name }] })',
      demos: [{ h: 'Homepage Established', sub: 'Headline, lead and button · ruled client rows · plain logos', mount: el => { const E = B().established, fx = l => Object.assign({}, l, { image: l.image.replace(/^\.\.\//, '../../') }); Modules.lockup(el, { title: E.title, text: E.text, cta: E.cta, rows: E.logos.filter(l => l.text).map(fx), logos: E.logos.filter(l => !l.text).map(fx) }); }, note: 'Hover a row: it fills with glass boxes and the arrow turns white.' }],
      usage: [['Homepage', 'v3-refokus/ui.js', /Modules\.lockup\(/, 1]],
      opts: [['title', 'Centred headline.'], ['text', 'Lead under the headline. Optional. One line on desktop.'], ['cta', '{ label, href }. White button. Optional.'], ['rows', 'Array of { href, image, name, text }: a client logo, one sentence and a link. Each row is a link.'], ['logos', 'Array of { image, name }: plain logos, not linked, in a free-standing strip.']],
      used: [['Homepage', 'Established', HOME + '#established'], ['Global Markets', 'Who We Serve (name rows)', GM + '#serve']],
      places: ['Section headline (h2.big)', 'Lead (.lead)', 'White button (.btn.white)'],
      note: 'Name rows (2026-11-17): a row without image shows its name in the logo column, and a row without href is not a link. Used for 4+ card sections (segments, features).'
    },
    'video-carousel': {
      call: "Modules.videos(el, { title, slides: [{ title, video }], art: ['stripes' | 'rings' | 'rays', ...] })",
      demos: [{ h: 'Homepage Client Spotlight', sub: 'Three tall video cards · each opens its video in a new tab', mount: el => Modules.videos(el, { title: B().spotlight.label, slides: B().spotlight.slides }), note: 'Hover a card: the still zooms and the play button turns blue.' }],
      usage: [['Homepage', 'v3-refokus/ui.js', /Modules\.videos\(/, 1]],
      opts: [['title', 'Section headline.'], ['slides', 'Array of { title, video }. video is the link that opens in a new tab.'], ['art', "Each card's still: 'stripes' (slides sideways), 'rings' or 'rays'. Default is those three in turn."]],
      used: [['Homepage', 'Client Spotlight', HOME + '#spotlight']],
      places: ['Section headline (h2.big)'],
      note: 'Three cards fill the row on desktop and stack on phones. It does not slide yet, and the split video and text layout is not built.'
    },
    'statistics': {
      call: "Modules.statement(el, { lines: stats.map(s => ({ text: s.value + ' ' + s.label, em: s.value })) })",
      demos: [{ h: 'Cold Wallets stats', sub: 'The Custody Wallets stats design on the shared statement module: one line per figure, the figure in blue, each line lit as it scrolls', page: [COLD + '#stats', 620] }],
      usage: [['Cold Wallets', 'cold-wallets/ui.js', /Modules\.statement\(/, 1]],
      opts: [['lines', 'Array of { text, em }: text is the value and label, em is the value (set in blue).']],
      used: [['Cold Wallets', 'Stats', COLD + '#stats'], ['Custody Wallets', 'Stats (its own copy, to move onto the module)', CW + '#stats']],
      note: 'Replaces the separate stats block made earlier tonight (retired): statistics use the approved statement.'
    },
    'product-accordion': {
      pageOnly: true,
      demos: [{ h: 'Qualified Custody accordion', sub: 'Scroll-driven list that switches the open row', page: [QC + '#keys', 760], note: 'The homepage Core Services is the Pinned list module now.' }],
      usage: [['Qualified Custody', 'qc-refokus/ui.js', /#keys/, 3]],
      used: [['Qualified Custody', 'Keys and features', QC + '#keys']],
      places: []
    },
    'text-list': {
      call: "Modules.textlist(el, { eyebrow, title, text, items: [{ title, text }], numbered, side: 'right' | 'left' })",
      demos: [{ h: 'Cold Wallets list', sub: 'Intro beside ruled titled rows (the FAQ layout)', page: [COLD + '#list', 760] }],
      usage: [['Cold Wallets', 'cold-wallets/ui.js', /Modules\.textlist\(/, 1]],
      opts: [['eyebrow, title, text', 'The intro (sticks while the rows pass).'], ['items', 'Array of { title, text }.'], ['numbered', 'true: 01, 02 ... before each row.'], ['side', "Where the rows sit: 'right' (default) or 'left'."]],
      used: [['Cold Wallets', 'Manage Your Own Cold Storage', COLD + '#list']],
      note: 'Candidate (review). Made 2026-11-17 for the live list component.'
    },
    'standalone-text': {
      call: 'Modules.prose(el, { eyebrow, title, text: [ ... ] })',
      demos: [], usage: [], opts: [['eyebrow, title', 'Optional.'], ['text', 'Array of paragraphs, centred at reading width.']], used: [],
      note: 'Candidate (review). Made 2026-11-17 for the live standaloneText component.'
    },
    'quote': {
      call: 'Modules.quote(el, { quotes: [{ text, cite }] })',
      demos: [], usage: [], opts: [['quotes', 'One quote, or several: a stepper (01 / 03, previous, next) and a slow crossfade every 8s; nothing moves on its own under reduced motion.']], used: [],
      note: 'Candidate (review). One module for the live quote and quoteCarousel components.'
    },
    'statement': {
      call: 'Modules.statement(el, { lines: [{ text, em }] })',
      demos: [{ h: 'Credentials', sub: 'Qualified Custody and Homepage · three lines, the em words in blue', mount: el => Modules.statement(el, { lines: [{ text: 'NYSE Listed: BTGO', em: 'BTGO' }, { text: 'OCC Federally Chartered', em: 'OCC' }, { text: 'Founded in 2013', em: '2013' }] }), note: 'Each line lights up as it scrolls to the middle of the screen. All lit under reduced motion.' }],
      usage: [['Qualified Custody', 'qc-refokus/ui.js', /Modules\.statement\(/, 2], ['Homepage', 'v3-refokus/ui.js', /Modules\.statement\(/, 2]],
      opts: [['lines', 'Array of { text, em }. text is the whole line; em is the phrase inside it set in blue. em is optional.']],
      used: [['Qualified Custody', 'Credentials statement', QC + '#badges'], ['Homepage', 'Badges statement', HOME + '#badges']]
    },
    'faq': {
      call: 'Modules.faq(el, { title, items: [{ q, a }] })',
      demos: [{ h: 'Self-Custody FAQ', sub: 'Heading beside one column of questions', mount: el => Modules.faq(el, { title: Q().faqTitle, items: Q().faqs }), note: 'Questions stay as sentences (Parts.titleize skips them). The heading sticks while you read.' }],
      usage: [['Self-Custody', 'sc-refokus/ui.js', /Modules\.faq\(/, 1], ['Qualified Custody', 'qc-refokus/ui.js', /Modules\.faq\(/, 1]],
      opts: [['title', 'Heading beside the list.'], ['items', 'Array of { q, a }. Each is a details disclosure with a plus control.']],
      used: [['Self-Custody', 'FAQ', SC + '#faq'], ['Qualified Custody', 'FAQ', QC + '#faq']],
      places: ['Section headline (h2.big)']
    },
    'related-posts': {
      call: 'Modules.latest(el, { title, all: {label, href}, posts: [{ title, href }], hover })',
      demos: [
        { h: 'Self-Custody "The Latest"', sub: 'Four posts and an All News button', mount: el => Modules.latest(el, { title: Q().latest.title, all: Q().latest.all, posts: Q().latest.posts }) },
        { h: 'hover: boxes', sub: 'Homepage · stronger rules, side padding, glass boxes fill the row on hover', mount: el => Modules.latest(el, { title: B().latest.title, all: B().latest.all, posts: B().latest.posts, hover: 'boxes' }) }
      ],
      usage: [['Self-Custody', 'sc-refokus/ui.js', /Modules\.latest\(/, 1], ['Homepage', 'v3-refokus/ui.js', /Modules\.latest\(/, 1], ['Qualified Custody', 'qc-refokus/ui.js', /Modules\.latest\(/, 1]],
      opts: [['title', 'Heading.'], ['all', '{ label, href }. Ghost button beside the heading.'], ['posts', 'Array of { title, href }. Up to four on live pages.'], ['hover', "Optional. 'boxes' is the homepage version."]],
      used: [['Self-Custody', 'The Latest', SC + '#latest'], ['Homepage', 'The Latest (boxes)', HOME + '#latest'], ['Qualified Custody', 'The Latest', QC + '#latest']],
      places: ['Section headline (h2.big)', 'Ghost button (.btn.ghost)']
    },
    'conversion-form': {
      pageOnly: true,
      demos: [{ h: 'Newsletter capsule', sub: 'renderNewsModule · compact form', page: [SC + '#news', 560] }],
      usage: [['Self-Custody', 'sc-refokus/ui.js', /renderNewsModule\(\$\('#news'\)\)/, 1], ['Definition', 'shared/system/chrome.js', /window\.renderNewsModule = /, 4]],
      used: [['Self-Custody', 'Newsletter', SC + '#news'], ['Homepage', 'Newsletter', HOME + '#news'], ['Qualified Custody', 'Newsletter', QC + '#news'], ['Self-Custody', 'Footer', SC + '#footer']],
      places: ['White button (.btn.white) as the submit']
    },
    'header-nav': {
      pageOnly: true,
      demos: [{ h: 'Self-Custody header', sub: 'Menus and featured cards open on click. Frosted glass once you scroll.', page: [SC, 760] }],
      usage: [['Self-Custody', 'sc-refokus/ui.js', /renderChrome\(\{ logoHref/, 1], ['Definition', 'shared/system/chrome.js', /window\.renderChrome = /, 1]],
      used: [['Every page', 'Header', SC + '#nav']],
      places: ['Eyebrow, small (featured cards)', 'White button, nav size (.btn.white.sm)', 'Blue and ghost buttons (mobile menu)']
    },
    'footer': {
      pageOnly: true,
      demos: [{ h: 'Self-Custody footer', sub: 'Link groups, legal, social, newsletter', page: [SC + '#footer', 760] }],
      usage: [['Self-Custody', 'sc-refokus/ui.js', /renderChrome\(\{ logoHref/, 1], ['Definition', 'shared/system/chrome.js', /\/\* -+ footer -+ \*\//, 6]],
      used: [['Every page', 'Footer', SC + '#footer']]
    }
  };

  /* the product-UI diagrams: where each sits today and the ground it sits on */
  const UIINFO = {
    scSecurity: ['Security and control', 'Self-Custody card 1', 'ink', SC + '#why'], scCompliance: ['Compliant wallet architecture', 'Self-Custody card 2', 'paper', SC + '#why'],
    scConfig: ['Flexible configurations', 'Self-Custody card 3', 'ink3', SC + '#why'], scHot: ['Key Management: hot wallets', 'Self-Custody 50/50', 'curtain', SC + '#km-hot'],
    scCold: ['Key Management: cold wallets', 'Self-Custody 50/50, mirrored', 'curtain', SC + '#km-cold'], goNetwork: ['Go Network settlement', 'Homepage Build card 3', 'ink3', HOME + '#build'],
    scApi: ['API Access', 'Self-Custody 50/50', 'curtain', SC + '#row-api'], scApp: ['In-app', 'Self-Custody 50/50, mirrored', 'curtain', SC + '#row-app']
  };

  /* covered / not covered against the handoff. y = seen working, n = seen failing, ? = not checked. Filled from the checks run on 2026-11-17. */
  const CHECK_ROWS = ['Long copy', 'Translated (longer) text', 'Missing optional media', 'Small screens (390px)', 'Reduced motion', 'Light and dark grounds', 'Hover, focus, selected states'];
  const CHECKS = {
    '50-50': { 'Long copy': ['y', 'Three long paragraphs and a long button label fit at 1440 and 390.'], 'Translated (longer) text': ['y', 'A 38-letter compound word breaks inside its box at 1440 and 390; no sideways scroll (base.css word-break rule).'],
      'Missing optional media': ['y', 'Renders with no eyebrow, no button and no visual.'], 'Small screens (390px)': ['y', 'Stacks to one column, no sideways scroll.'], 'Reduced motion': ['y', 'The diagrams draw a finished still frame.'] },
    'section-headline': { 'Long copy': ['y', 'Long headline and lead fit at 1440 and 390 (tested inside the multicard).'], 'Missing optional media': ['y', 'Renders with no eyebrow and no lead.'], 'Small screens (390px)': ['y', 'No sideways scroll.'] },
    'card-grid': { 'Long copy': ['y', 'Long card titles and text fit at 1440.'], 'Translated (longer) text': ['y', 'A 38-letter compound word breaks inside its box at 1440 and 390; no sideways scroll (base.css word-break rule).'], 'Missing optional media': ['y', 'Renders with no eyebrow, no lead, no button, and a card with no art.'], 'Small screens (390px)': ['y', 'Cards stack, no sideways scroll.'], 'Reduced motion': ['y', 'The diagrams draw a finished still frame. The canvas arts were not looked at.'], 'Light and dark grounds': ['y', 'Cards are dark, light and dark.'] },
    'logo-cloud': { 'Long copy': ['y', 'A long title fits at 1440 and 390.'], 'Missing optional media': ['y', 'Renders with three logos.'], 'Small screens (390px)': ['y', 'No sideways scroll.'] },
    'cta-banner': { 'Long copy': ['y', 'A three-line title and a long button label fit at 1440 and 390.'], 'Translated (longer) text': ['y', 'A 28-letter compound word fits at 1440 and 390.'], 'Missing optional media': ['y', 'Renders with no button.'], 'Small screens (390px)': ['y', 'No sideways scroll.'] },
    'code-animation': { 'Small screens (390px)': ['y', 'Each diagram scales to its frame, no sideways scroll.'], 'Reduced motion': ['y', 'All 8 draw a finished still frame.'], 'Light and dark grounds': ['y', 'Shown on dark, light and curtain grounds.'], 'Missing optional media': ['y', 'Modules.ui returns false for an unknown name and draws nothing.'] }
  };

  /* ---------- page ---------- */
  const ST = { approved: 'Approved', review: 'In review', page: 'On a page', none: 'Not built' };
  const MARK = '<svg viewBox="0 0 157 184" aria-hidden="true"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9ccff"/><stop offset="1" stop-color="#4d78ff"/></linearGradient></defs><path fill="url(#g)" d="M156.282 104.257C156.282 146.692 78.3938 183.634 78.3938 183.634C78.3938 183.634 0.50478 146.692 0.50478 104.257C0.50478 93.2381 0.509268 83.5104 0.513558 74.2098C0.522088 55.7192 0.52984 38.9167 0.5 17.0094C49.9579 -5.62206 106.836 -5.59857 156.282 17.0588V104.257Z"/></svg>';

  function build() {
    const D = window.SYSTEM, groups = D.modules.map(g => ({ group: g.group, items: g.items.filter(m => m.slug) })).filter(g => g.items.length);
    const all = groups.flatMap(g => g.items), m = all.find(x => x.slug === SLUG), C = MODS[SLUG];
    if (!m || !C) throw new Error('No module page for ' + SLUG);
    document.title = m.title + ' · BitGo Design System';
    const pill = `<span class="st ${m.status}"><i></i>${ST[m.status]}</span>`;

    const side = `<aside class="side"><div class="mark">${MARK}<span><a href="../index.html">Design system</a></span></div>
      <nav id="toc"><a class="back" href="../index.html#modules">← Overview</a>${groups.map(g => `<div class="gh">${esc(g.group)}</div>${g.items.map(x => `<a href="${x.slug}.html"${x.slug === SLUG ? ' class="on" aria-current="page"' : ''}>${esc(x.title)}</a>`).join('')}`).join('')}</nav>
      <p class="upd">Updated ${esc(D.updated)}</p></aside>`;

    const shared = !!C.call;
    const intro = `<section class="sec mod-intro" id="top"><p class="crumb"><a href="../index.html#modules">Overview</a> / ${esc(m.group || groups.find(g => g.items.includes(m)).group)}</p>
      <h1>${esc(m.title)}</h1>
      <p class="meta">${pill}<span>Handoff name: <b>${esc(m.name)}</b></span>${m.ours ? `<span>Ours: ${esc(m.ours)}</span>` : ''}</p>
      <p class="sub">${esc(m.desc)}</p>
      ${shared ? `<div class="callbox"><small>Call</small>${esc(C.call)}</div>` : `<p class="pagenote">${C.pageOnly ? 'Exists only on a page. Not a shared module yet.' : ''}${C.note ? ' ' + esc(C.note) : ''}</p>`}
      ${shared && C.note ? `<p class="pagenote">${esc(C.note)}</p>` : ''}</section>`;

    let n = 0;
    const demoHtml = (C.demos || []).map(d => {
      const id = 'd' + (n++), head = `<div class="modhead"><h3>${esc(d.h)}</h3><span>${esc(d.sub || '')}</span></div>`;
      if (d.page) { const [src, h] = d.page; return head + `<div class="frame"><iframe src="${rel(src)}" loading="lazy" title="${esc(d.h)}" style="height:${h}px"></iframe></div><p class="note"><a href="${rel(src)}"><u>Open the page section</u></a>${d.note ? ' · ' + esc(d.note) : ''}</p>`; }
      return head + `<div class="live" id="${id}"></div>${d.note ? `<p class="note">${esc(d.note)}</p>` : ''}`;
    }).join('');
    const uiHtml = !C.ui ? '' : `<div class="uigrid">${Modules.ui.names.map(k => { const i = UIINFO[k] || [k, 'Not placed on a page', 'curtain', '']; return `<div class="uic"><div class="ground ${i[2]} m-split"><div class="uiel" data-ui="${k}"></div></div><p><b>${esc(i[0])}</b>${esc(i[1])} · <code>${k}</code>${i[3] ? ` · <a href="${rel(i[3])}"><u>page</u></a>` : ''}</p></div>`; }).join('')}</div>
      <p class="note">${Modules.ui.names.length} diagrams, each mounted live with <code>Modules.ui</code>. They loop while on screen.</p>`;
    const live = `<section class="sec" id="live"><h2>${C.pageOnly ? 'Live on the page' : 'Live'}</h2><p class="sub">${C.pageOnly ? 'The real page section, in a frame. It is not rendered from shared files.' : 'Rendered from the shared files with the pages\' own copy.'}</p>${demoHtml}${uiHtml}</section>`;

    const usage = `<section class="sec" id="usage"><h2>Usage</h2><p class="sub">${shared ? 'The calls the pages make, read from the page files.' : 'How the page builds it today, read from the page files.'}</p>
      ${(C.usage || []).map(([lab, file, , ], i) => `<h3 class="sh">${esc(lab)} · <code>${esc(file)}</code></h3><pre data-snip="${i}">Loading…</pre>`).join('')}
      ${(C.usageText || []).map(([lab, t]) => `<h3 class="sh">${esc(lab)}</h3><pre>${esc(t)}</pre>`).join('')}
      ${C.opts ? `<h3 class="sh">Options</h3><div class="optl">${C.opts.map(([k, t]) => `<div><code>${esc(k)}</code><span>${esc(t)}</span></div>`).join('')}</div>` : ''}</section>`;

    const used = `<section class="sec" id="used"><h2>Where it's used</h2><p class="sub">Every place the module appears today. Each link opens the page at that section.</p>
      <div class="links">${C.used.map(([pg, sec, href]) => `<a href="${rel(href)}"><b>${esc(pg)}</b><span>${esc(sec)}</span></a>`).join('')}</div></section>`;

    const places = C.places || (C.call && /split|multicard/.test(C.call) ? (/split/.test(C.call) ? ['Eyebrow (Parts.eyebrow)', 'Lead (.lead), one per paragraph and list row', 'White button (.btn.white)'] : ['Eyebrow (Parts.eyebrow)', 'Section headline (h2.big)', 'Lead (.lead)', 'Button (.btn) on a card, optional']) : /banner/.test(C.call || '') ? ['White button (.btn.white)'] : []);
    const sys = D.rules.find(g => g.group === 'System').items;
    const rules = `<section class="sec" id="rules"><h2>Rules</h2><p class="sub">Parts are never restyled here. A module places them and sets only their position.</p>
      <div class="two"><div><h3>This module</h3>${m.call ? `<p class="call">${esc(m.call)}</p>` : '<p>No decision recorded yet.</p>'}${m.rules.length ? `<ul style="margin-top:14px">${m.rules.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}</div>
      <div><h3>Parts it places</h3>${places.length ? `<ul>${places.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p>Not checked.</p>'}</div>
      <div><h3>System rules</h3><ul>${sys.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div></div></section>`;

    const CK = CHECKS[SLUG] || {}, mark = { y: ['yes', 'Covered'], n: ['no', 'Not covered yet'], '?': ['', 'Not checked'] };
    const handoff = `<section class="sec hf" id="handoff"><h2>What the client's handoff asks of it</h2><p class="sub">BitGo's own wording, from <code>handoff.txt</code>.</p>
      <dl>${m.usedOn ? `<dt>Used on</dt><dd>${esc(m.usedOn)}</dd>` : ''}<dt>Design focus</dt><dd>${esc(m.focus)}</dd>${m.live ? `<dt>Live variations</dt><dd>${esc(m.live)}</dd>` : ''}</dl>
      <h3 class="sh" style="margin-top:44px">Covered here</h3>
      <div class="chk">${CHECK_ROWS.map(r => { const c = CK[r] || ['?', '']; const [cls, lab] = mark[c[0]]; return `<div><b>${r}</b><span class="ck3 ${cls}"><i></i>${lab}</span><span>${esc(c[1])}</span></div>`; }).join('')}</div></section>`;

    document.body.innerHTML = `<div class="lib">${side}<main class="doc">${intro}${live}${usage}${used}${rules}${handoff}</main></div>`;

    /* mount the live demos */
    (C.demos || []).forEach((d, i) => { if (d.mount) d.mount(document.getElementById('d' + i)); });
    document.querySelectorAll('[data-ui]').forEach(el => Modules.ui(el, el.dataset.ui));
    /* usage snippets from the real files */
    (C.usage || []).forEach(([, file, re, nl], i) => {
      const pre = document.querySelector(`pre[data-snip="${i}"]`);
      fetch(ROOT + file).then(r => r.ok ? r.text() : Promise.reject()).then(t => {
        const L = t.split(/\r?\n/), k = L.findIndex(l => re.test(l));
        if (k < 0) throw 0;
        const cut = L.slice(k, k + nl), ind = Math.min(...cut.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
        pre.textContent = cut.map(l => l.slice(ind)).join('\n');
      }).catch(() => { pre.textContent = 'Open ' + file; });
    });
    /* sidebar: keep the current page in view on a phone */
    const on = document.querySelector('#toc a.on'); if (on) { const nav = $('#toc'); nav.scrollLeft = Math.max(0, on.offsetLeft - 40); }
  }
})();
