// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = {
  name: 'Valentina Tank Dress',
  description: 'Sleeveless tank dress from the Venia dresses collection.',
  image_url: 'https://mcprod.catalogservice-commerce.fun/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/v/d/vd08-ll_main.jpg',
  price: '$78',
  category: 'Dresses',
};

// Brand palette from the action payload — used to derive the card content-panel background.
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

const CARD_COLORS = ['#378ef0', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];

export default async function decorate(block, bridge) {
  let item;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      item = SAMPLE_DATA;
    } else {
      // Detail concept — structuredContent IS the item (flat). No wrapper key.
      const _result = await bridge.toolResult;
      const sc = (_result?.structuredContent || _result) || {};
      // Tolerate an array shape by taking the first entry.
      item = Array.isArray(sc) ? (sc[0] || {}) : sc;
    }
  } else {
    item = SAMPLE_DATA;
  }

  block.textContent = '';
  renderDetail(block, item, bridge);

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

function renderDetail(block, item, bridge) {
  const card = document.createElement('div');
  card.className = 'product-detail-card';

  const imageWrap = document.createElement('div');
  imageWrap.className = 'product-detail-image';
  const colorDiv = () => {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${CARD_COLORS[0]};`;
    return d;
  };
  if (item.image_url) {
    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = item.name || '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => img.parentNode && img.parentNode.replaceChild(colorDiv(), img);
    imageWrap.appendChild(img);
  } else {
    imageWrap.appendChild(colorDiv());
  }
  card.appendChild(imageWrap);

  const content = document.createElement('div');
  content.className = 'product-detail-content';
  content.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

  if (item.category) {
    const cat = document.createElement('span');
    cat.className = 'product-detail-category';
    cat.textContent = item.category;
    content.appendChild(cat);
  }

  const title = document.createElement('h3');
  title.className = 'product-detail-name';
  title.textContent = item.name || '';
  content.appendChild(title);

  if (item.description) {
    const desc = document.createElement('p');
    desc.className = 'product-detail-desc';
    desc.textContent = item.description;
    content.appendChild(desc);
  }

  if (item.price !== undefined && item.price !== null && item.price !== '') {
    const price = document.createElement('span');
    price.className = 'product-detail-price';
    price.textContent = typeof item.price === 'number' ? `$${item.price}` : item.price;
    content.appendChild(price);
  }

  const btn = document.createElement('button');
  btn.className = 'product-detail-cta';
  btn.type = 'button';
  btn.textContent = 'Tell me more';
  if (bridge) {
    btn.addEventListener('click', () => {
      bridge.sendMessage(`Tell me more about the ${item.name}`);
    });
  }
  content.appendChild(btn);

  card.appendChild(content);
  block.appendChild(card);
}
