// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'Valentina Tank Dress', description: 'Sleeveless tank dress from the Venia dresses collection.', image_url: 'https://mcprod.catalogservice-commerce.fun/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/v/d/vd08-ll_main.jpg', price: '$78', category: 'Dresses' },
  { name: 'Angelina Tank Dress', description: "Tank-style dress in the Venia women's dresses line.", image_url: 'https://mcprod.catalogservice-commerce.fun/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/v/d/vd01-ll_main.jpg', price: '$98', category: 'Dresses' },
  { name: 'Alexia Maxi Dress', description: 'Full-length maxi dress from the Venia dresses collection.', image_url: 'https://mcprod.catalogservice-commerce.fun/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/v/d/vd09-pe_main.jpg', price: '$78', category: 'Dresses' },
  { name: 'Jillian Top', description: "Women's top from the Venia tops collection.", image_url: 'https://mcprod.catalogservice-commerce.fun/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/v/t/vt12-kh_main.jpg', price: '$58', category: 'Tops' },
  { name: 'Vitalia Top', description: "Women's top from the Venia tops line.", image_url: 'https://mcprod.catalogservice-commerce.fun/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/v/t/vt10-ly_main.jpg', price: '$98', category: 'Tops' },
  { name: 'Pomona Skirt', description: 'Skirt from the Venia bottoms collection.', image_url: 'https://mcprod.catalogservice-commerce.fun/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/v/s/vsk11-ly_main.jpg', price: '$98', category: 'Skirts' },
  { name: 'Night Out Collection', description: 'Curated accessories collection for evening looks.', image_url: 'https://mcprod.catalogservice-commerce.fun/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/v/a/va24_main.jpg', price: '$156', category: 'Accessories' },
];

// Brand palette from BuildWidgetRequest — used to derive card info-strip background.
const PALETTE = ['#007378', '#00686c', '#f9aa80', '#dc143c', '#212121'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m; }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);
const ACCENT = PALETTE[0] || '#2563eb';
const CARD_COLORS = ['#378ef0', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.products — bare array outputSchema; key derived from actionName "search_products"
      items = structuredContent?.products || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderItems(block, items, bridge);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function renderItems(block, items, bridge) {
  const list = (items || []).slice(0, 5);

  const wrapper = document.createElement('div');
  wrapper.className = 'search-products-wrapper';

  const track = document.createElement('div');
  track.className = 'search-products-track';

  list.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'search-products-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'search-products-image';
    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };
    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => { if (img.parentNode) img.parentNode.replaceChild(colorDiv(), img); };
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(colorDiv());
    }
    card.appendChild(imageContainer);

    const info = document.createElement('div');
    info.className = 'search-products-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

    const title = document.createElement('h3');
    title.className = 'search-products-name';
    title.textContent = item.name || '';
    info.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'search-products-meta';

    const price = document.createElement('span');
    price.className = 'search-products-price';
    price.textContent = item.price != null ? String(item.price) : '';
    meta.appendChild(price);

    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'search-products-badge';
      badge.textContent = item.category;
      badge.style.cssText = `background:${ACCENT};`;
      meta.appendChild(badge);
    }
    info.appendChild(meta);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'search-products-cta';
    btn.textContent = 'Shop Now';
    btn.style.cssText = `background:${ACCENT};`;
    if (bridge) {
      btn.addEventListener('click', () => {
        if (item.url_key) {
          bridge.openLink(item.url_key);
        } else {
          bridge.sendMessage(`Tell me more about ${item.name}`);
        }
      });
    }
    info.appendChild(btn);

    card.appendChild(info);
    track.appendChild(card);
  });

  wrapper.appendChild(track);

  const fade = document.createElement('div');
  fade.className = 'search-products-fade';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  const makeArrow = (dir, label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `search-products-arrow search-products-arrow-${dir}`;
    b.setAttribute('aria-label', label);
    b.textContent = dir === 'left' ? '◀' : '▶';
    const scroll = () => {
      const card = track.querySelector('.search-products-card');
      const amount = card ? card.offsetWidth + 16 : 236;
      track.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    };
    b.addEventListener('click', scroll);
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scroll(); }
    });
    return b;
  };
  const leftArrow = makeArrow('left', 'Scroll left');
  const rightArrow = makeArrow('right', 'Scroll right');
  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  const updateArrows = () => {
    const atStart = track.scrollLeft <= 2;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    leftArrow.style.display = atStart ? 'none' : 'flex';
    rightArrow.style.display = atEnd ? 'none' : 'flex';
    fade.style.display = atEnd ? 'none' : 'block';
  };
  track.addEventListener('scroll', updateArrows);
  requestAnimationFrame(updateArrows);

  block.appendChild(wrapper);
}
