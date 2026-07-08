// Sample data for standalone/preview mode.
// In production, the widget captures form input and sends it back into the conversation.
const SAMPLE_HERO = {
  name: 'Venia Stylist Consultation',
  description: 'Book a one-on-one session with a personal Venia stylist to curate looks tailored to you.',
  image_url: 'https://mcprod.catalogservice-commerce.fun/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/v/d/vd08-ll_main.jpg',
};

// Form fields derived from input_schema.properties.
const FIELDS = [
  { name: 'full_name', label: 'Full Name', placeholder: "Customer's full name.", type: 'text', required: true },
  { name: 'email', label: 'Email', placeholder: "Customer's email address for confirmation.", type: 'email', required: true },
  { name: 'preferred_date', label: 'Preferred Date', placeholder: 'Preferred consultation date.', type: 'date', required: true },
  { name: 'notes', label: 'Notes', placeholder: 'Optional style preferences or notes for the stylist.', type: 'text', required: false },
];

// Brand palette from BuildWidgetRequest.
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
const ACCENT = PALETTE[0] || '#007378';

export default async function decorate(block, bridge) {
  const hero = SAMPLE_HERO;
  let confirmation = null;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (!isPreview) {
      // Production — a completed booking returns a confirmation object.
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      if (structuredContent?.confirmation_id) {
        confirmation = {
          confirmation_id: structuredContent.confirmation_id,
          status: structuredContent.status,
          message: structuredContent.message,
        };
      }
    }
  }

  block.textContent = '';
  if (confirmation) {
    renderConfirmation(block, hero, confirmation);
  } else {
    renderForm(block, hero, bridge);
  }

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

function renderConfirmation(block, hero, confirmation) {
  const card = document.createElement('div');
  card.className = 'booking-card';

  const header = document.createElement('div');
  header.className = 'booking-header';
  header.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

  const title = document.createElement('div');
  title.className = 'booking-title';
  title.textContent = hero.name;
  header.appendChild(title);
  card.appendChild(header);

  const body = document.createElement('div');
  body.className = 'booking-confirmation';

  const badge = document.createElement('div');
  badge.className = 'booking-status';
  badge.style.cssText = `background:${ACCENT};`;
  badge.textContent = (confirmation.status || 'confirmed').toUpperCase();
  body.appendChild(badge);

  const msg = document.createElement('div');
  msg.className = 'booking-message';
  msg.textContent = confirmation.message || 'Your consultation is booked.';
  body.appendChild(msg);

  const ref = document.createElement('div');
  ref.className = 'booking-ref';
  ref.textContent = `Confirmation: ${confirmation.confirmation_id}`;
  body.appendChild(ref);

  card.appendChild(body);
  block.appendChild(card);
}

function renderForm(block, hero, bridge) {
  const card = document.createElement('div');
  card.className = 'booking-card';

  const heroWrap = document.createElement('div');
  heroWrap.className = 'booking-hero';
  if (hero.image_url) {
    const img = document.createElement('img');
    img.src = hero.image_url;
    img.alt = hero.name || 'Stylist consultation';
    img.onerror = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background:${ACCENT};`;
      img.parentNode.replaceChild(d, img);
    };
    heroWrap.appendChild(img);
  }
  card.appendChild(heroWrap);

  const header = document.createElement('div');
  header.className = 'booking-header';
  header.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

  const title = document.createElement('div');
  title.className = 'booking-title';
  title.textContent = hero.name;
  header.appendChild(title);

  const desc = document.createElement('div');
  desc.className = 'booking-desc';
  desc.textContent = hero.description;
  header.appendChild(desc);

  card.appendChild(header);

  const form = document.createElement('form');
  form.className = 'booking-form';
  const inputs = {};

  FIELDS.forEach((f) => {
    const group = document.createElement('div');
    group.className = 'booking-group';

    const label = document.createElement('label');
    label.className = 'booking-label';
    label.textContent = f.required ? `${f.label} *` : f.label;
    label.setAttribute('for', `booking-${f.name}`);
    group.appendChild(label);

    const input = document.createElement('input');
    input.className = 'booking-input';
    input.id = `booking-${f.name}`;
    input.type = f.type;
    input.placeholder = f.placeholder;
    if (f.required) input.required = true;
    inputs[f.name] = input;
    group.appendChild(input);

    form.appendChild(group);
  });

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'booking-submit';
  submit.textContent = 'Book Consultation';
  submit.style.cssText = `background:${ACCENT};`;
  form.appendChild(submit);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!bridge) return;
    const name = inputs.full_name.value.trim();
    const email = inputs.email.value.trim();
    const date = inputs.preferred_date.value.trim();
    const notes = inputs.notes.value.trim();
    let msg = 'Book a Venia stylist consultation';
    if (name) msg += ` for ${name}`;
    if (email) msg += `, email ${email}`;
    if (date) msg += `, on ${date}`;
    if (notes) msg += `. Notes: ${notes}`;
    bridge.sendMessage(msg);
  });

  card.appendChild(form);
  block.appendChild(card);
}
