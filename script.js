/* ═══════════════════════════════════════════════════════
   VELORA STUDIO — Rezervační systém
   ═══════════════════════════════════════════════════════

   EmailJS konfigurace:
   1. Jdi na https://www.emailjs.com (bezplatný účet)
   2. Přidej Email Service (Gmail, Outlook…)
   3. Vytvoř šablonu s proměnnými:
      {{to_name}}, {{to_email}}, {{service_name}},
      {{date}}, {{time}}, {{phone}}, {{price}}
   4. Vlož svá ID níže:
   ─────────────────────────────────────────────────── */
const EMAILJS = {
  publicKey:  'YOUR_PUBLIC_KEY',
  serviceId:  'YOUR_SERVICE_ID',
  templateId: 'YOUR_TEMPLATE_ID',
};

/* ─── DATA ─── */
const SERVICES = [
  { id: 1, name: 'Express pedikúra',   duration: 30,  price: 399,  desc: 'Rychlá úprava nehtů a zbavení nánosů.' },
  { id: 2, name: 'Klasická pedikúra',  duration: 45,  price: 599,  desc: 'Kompletní péče o nehty a kůži chodidel.' },
  { id: 3, name: 'Wellness pedikúra',  duration: 75,  price: 849,  desc: 'Rituál s parní lázní, peelingem a maskou.' },
  { id: 4, name: 'Luxusní pedikúra',   duration: 90,  price: 999,  desc: 'Prémiová péče s masáží a aromaterapií.' },
  { id: 5, name: 'Gelové nehty',       duration: 60,  price: 750,  desc: 'Gelové zpevnění a lakování nehtů nohou.' },
  { id: 6, name: 'Lakování nehtů',     duration: 20,  price: 250,  desc: 'Precizní lakování klasickým nebo gel lakem.' },
];

const OPENING = { start: 9, end: 18 };
const CLOSED_DAYS = [0]; // 0 = neděle

/* ─── STATE ─── */
const state = {
  step: 1,
  service: null,
  date: null,
  time: null,
  contact: {},
  calendarMonth: new Date(),
};

/* ─── BOOT ─── */
document.addEventListener('DOMContentLoaded', () => {
  initEmailJS();
  initNav();
  initAnimations();
  renderServices();
  renderBookingServices();
  renderCalendar();
  bindBookingNav();
});

/* ─── EMAILJS ─── */
function initEmailJS() {
  if (typeof emailjs !== 'undefined' && EMAILJS.publicKey !== 'YOUR_PUBLIC_KEY') {
    emailjs.init({ publicKey: EMAILJS.publicKey });
  }
}

/* ─── NAV ─── */
function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ─── SCROLL ANIMATIONS ─── */
function initAnimations() {
  const opts = { threshold: 0.15, rootMargin: '0px 0px -40px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const delay = parseInt(el.dataset.delay || '0', 10);
        setTimeout(() => el.classList.add('visible'), delay);
        observer.unobserve(el);
      }
    });
  }, opts);

  document.querySelectorAll('.fade-up, .reveal').forEach(el => observer.observe(el));
}

/* ─── SERVICES SECTION ─── */
function renderServices() {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;
  grid.innerHTML = SERVICES.map(s => `
    <article class="service-card reveal" role="listitem">
      <p class="service-card__name">${s.name}</p>
      <p class="service-card__desc">${s.desc}</p>
      <div class="service-card__meta">
        <span class="service-card__duration">${s.duration} min</span>
        <span class="service-card__price">${s.price} Kč</span>
      </div>
    </article>
  `).join('');

  const newCards = grid.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 80);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  newCards.forEach(c => observer.observe(c));
}

/* ─── BOOKING: STEP 1 — SERVICE SELECTION ─── */
function renderBookingServices() {
  const container = document.getElementById('bookingServices');
  if (!container) return;
  container.innerHTML = SERVICES.map(s => `
    <button
      class="booking__service-item"
      role="radio"
      aria-checked="false"
      data-service-id="${s.id}"
      aria-label="${s.name}, ${s.duration} minut, ${s.price} Kč"
    >
      <p class="bsi__name">${s.name}</p>
      <p class="bsi__duration">${s.duration} min</p>
      <p class="bsi__price">${s.price} Kč</p>
    </button>
  `).join('');

  container.querySelectorAll('.booking__service-item').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.booking__service-item').forEach(b => {
        b.classList.remove('selected');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-checked', 'true');
      const svc = SERVICES.find(s => s.id === parseInt(btn.dataset.serviceId));
      state.service = svc;
      const next = document.getElementById('step1Next');
      next.disabled = false;
      next.removeAttribute('aria-disabled');
    });
  });
}

/* ─── BOOKING: STEP 2 — CALENDAR ─── */
function renderCalendar() {
  const cal = document.getElementById('calendar');
  if (!cal) return;

  const month = state.calendarMonth;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const y = month.getFullYear(), m = month.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const offset = (firstDay + 6) % 7;

  const monthLabel = month.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
  const isPrevDisabled = month <= today;

  const weekdays = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
  const weekdaysHtml = weekdays.map(d => `<span class="calendar__weekday">${d}</span>`).join('');

  let daysHtml = '';
  for (let i = 0; i < offset; i++) {
    daysHtml += `<span class="calendar__day empty" aria-hidden="true"></span>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m, d);
    const dow = date.getDay();
    const isPast = date < today;
    const isClosed = CLOSED_DAYS.includes(dow);
    const isToday = date.getTime() === today.getTime();
    const isSelected = state.date && date.getTime() === state.date.getTime();
    const disabled = isPast || isClosed;
    const iso = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const cls = ['calendar__day', isToday ? 'today' : '', isSelected ? 'selected' : ''].filter(Boolean).join(' ');
    daysHtml += `<button class="${cls}" ${disabled ? 'disabled' : ''} data-date="${iso}" aria-label="${d}. ${month.toLocaleDateString('cs-CZ', {month:'long'})} ${y}"${isSelected ? ' aria-pressed="true"' : ''}>${d}</button>`;
  }

  cal.innerHTML = `
    <div class="calendar__header">
      <button class="calendar__nav" id="calPrev" aria-label="Předchozí měsíc" ${isPrevDisabled ? 'disabled' : ''}>&#8592;</button>
      <span class="calendar__month">${monthLabel}</span>
      <button class="calendar__nav" id="calNext" aria-label="Další měsíc">&#8594;</button>
    </div>
    <div class="calendar__weekdays" role="row">${weekdaysHtml}</div>
    <div class="calendar__days" role="grid">${daysHtml}</div>
  `;

  document.getElementById('calPrev').addEventListener('click', () => {
    state.calendarMonth = new Date(y, m - 1, 1);
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    state.calendarMonth = new Date(y, m + 1, 1);
    renderCalendar();
  });

  cal.querySelectorAll('.calendar__day:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const [dy, dm, dd] = btn.dataset.date.split('-').map(Number);
      state.date = new Date(dy, dm - 1, dd);
      state.time = null;
      document.getElementById('step2Next').disabled = true;
      document.getElementById('step2Next').setAttribute('aria-disabled', 'true');
      renderCalendar();
      renderTimeslots();
    });
  });
}

/* ─── BOOKING: STEP 2 — TIMESLOTS ─── */
function renderTimeslots() {
  const container = document.getElementById('timeslots');
  if (!container || !state.date || !state.service) return;

  const duration = state.service.duration;
  const slots = [];
  let h = OPENING.start;
  let min = 0;
  while (h * 60 + min + duration <= OPENING.end * 60) {
    slots.push({ h, min });
    min += 30;
    if (min >= 60) { h++; min -= 60; }
  }

  const seed = state.date.getDate() + state.date.getMonth() * 31;
  const takenIndices = new Set();
  for (let i = 0; i < Math.floor(slots.length * 0.3); i++) {
    takenIndices.add((seed * (i + 3) * 7) % slots.length);
  }

  const dateStr = state.date.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' });

  const slotsHtml = slots.map((s, i) => {
    const timeStr = `${String(s.h).padStart(2,'0')}:${String(s.min).padStart(2,'0')}`;
    const taken = takenIndices.has(i);
    const isSelected = state.time === timeStr;
    const cls = ['timeslot', taken ? 'taken' : '', isSelected ? 'selected' : ''].filter(Boolean).join(' ');
    return `<button class="${cls}" ${taken ? 'disabled aria-disabled="true"' : ''} data-time="${timeStr}" aria-label="${timeStr}${taken ? ' — obsazeno' : ''}">${timeStr}</button>`;
  }).join('');

  container.innerHTML = `
    <p class="timeslots__date">${dateStr}</p>
    <div class="timeslots__grid">${slotsHtml}</div>
  `;

  container.querySelectorAll('.timeslot:not(.taken)').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.timeslot').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.time = btn.dataset.time;
      const next = document.getElementById('step2Next');
      next.disabled = false;
      next.removeAttribute('aria-disabled');
    });
  });
}

/* ─── BOOKING NAVIGATION ─── */
function bindBookingNav() {
  document.getElementById('step1Next')?.addEventListener('click', () => goToStep(2));
  document.getElementById('step2Back')?.addEventListener('click', () => goToStep(1));
  document.getElementById('step2Next')?.addEventListener('click', () => goToStep(3));
  document.getElementById('step3Back')?.addEventListener('click', () => goToStep(2));
  document.getElementById('step3Next')?.addEventListener('click', () => {
    if (validateStep3()) goToStep(4);
  });
  document.getElementById('step4Back')?.addEventListener('click', () => goToStep(3));
  document.getElementById('step4Submit')?.addEventListener('click', submitBooking);
  document.getElementById('bookingReset')?.addEventListener('click', resetBooking);
}

function goToStep(n) {
  const panels = document.querySelectorAll('.booking__panel');
  panels.forEach(p => {
    p.classList.remove('active');
    p.hidden = true;
  });
  const target = document.getElementById(`panel${n}`);
  if (target) { target.classList.add('active'); target.hidden = false; }

  document.querySelectorAll('.booking__step').forEach(s => {
    const sn = parseInt(s.dataset.step);
    s.classList.remove('active', 'done');
    if (sn === n) { s.classList.add('active'); s.setAttribute('aria-current', 'step'); }
    else if (sn < n) { s.classList.add('done'); s.removeAttribute('aria-current'); }
    else { s.removeAttribute('aria-current'); }
  });

  state.step = n;

  if (n === 4) renderSummary();

  document.getElementById('rezervace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ─── FORM VALIDATION ─── */
function validateStep3() {
  const name = document.getElementById('fname');
  const email = document.getElementById('femail');
  const phone = document.getElementById('fphone');
  let valid = true;

  clearError('fname');
  clearError('femail');
  clearError('fphone');

  if (!name.value.trim() || name.value.trim().length < 2) {
    setError('fname', 'Zadejte prosím jméno a příjmení.');
    valid = false;
  }
  if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    setError('femail', 'Zadejte platnou e-mailovou adresu.');
    valid = false;
  }
  if (!phone.value.trim() || phone.value.replace(/\s/g,'').length < 9) {
    setError('fphone', 'Zadejte platné telefonní číslo.');
    valid = false;
  }

  if (valid) {
    state.contact = {
      name: name.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      notes: document.getElementById('fnotes').value.trim(),
    };
  }
  return valid;
}

function setError(id, msg) {
  const el = document.getElementById(id);
  const err = document.getElementById(`${id}Error`);
  if (el) el.classList.add('error');
  if (err) err.textContent = msg;
}
function clearError(id) {
  const el = document.getElementById(id);
  const err = document.getElementById(`${id}Error`);
  if (el) el.classList.remove('error');
  if (err) err.textContent = '';
}

['fname','femail','fphone'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => clearError(id));
});

/* ─── SUMMARY ─── */
function renderSummary() {
  const container = document.getElementById('bookingSummary');
  if (!container) return;
  const dateStr = state.date?.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) || '—';
  container.innerHTML = `
    <div class="summary__row"><span class="summary__label">Služba</span><span class="summary__value">${state.service?.name || '—'}</span></div>
    <div class="summary__row"><span class="summary__label">Trvání</span><span class="summary__value">${state.service?.duration || '—'} min</span></div>
    <div class="summary__row"><span class="summary__label">Cena</span><span class="summary__value">${state.service?.price || '—'} Kč</span></div>
    <div class="summary__row"><span class="summary__label">Datum</span><span class="summary__value">${dateStr}</span></div>
    <div class="summary__row"><span class="summary__label">Čas</span><span class="summary__value">${state.time || '—'}</span></div>
    <div class="summary__row"><span class="summary__label">Jméno</span><span class="summary__value">${state.contact.name || '—'}</span></div>
    <div class="summary__row"><span class="summary__label">E-mail</span><span class="summary__value">${state.contact.email || '—'}</span></div>
    <div class="summary__row"><span class="summary__label">Telefon</span><span class="summary__value">${state.contact.phone || '—'}</span></div>
    ${state.contact.notes ? `<div class="summary__row"><span class="summary__label">Poznámka</span><span class="summary__value">${state.contact.notes}</span></div>` : ''}
  `;
}

/* ─── SUBMIT ─── */
async function submitBooking() {
  const btn = document.getElementById('step4Submit');
  const text = document.getElementById('submitText');
  const spinner = document.getElementById('submitSpinner');

  btn.disabled = true;
  text.textContent = 'Odesílám…';
  spinner.hidden = false;

  const dateStr = state.date?.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) || '';
  const params = {
    to_name:      state.contact.name,
    to_email:     state.contact.email,
    service_name: state.service?.name,
    date:         dateStr,
    time:         state.time,
    phone:        state.contact.phone,
    price:        `${state.service?.price} Kč`,
    notes:        state.contact.notes || 'Žádná',
  };

  try {
    if (typeof emailjs !== 'undefined' && EMAILJS.publicKey !== 'YOUR_PUBLIC_KEY') {
      await emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, params);
      document.getElementById('successMessage').textContent =
        `Potvrzení bylo odesláno na ${state.contact.email}. Těšíme se na vás!`;
    } else {
      await new Promise(r => setTimeout(r, 1200));
      document.getElementById('successMessage').textContent =
        `Rezervace přijata! Brzy vás budeme kontaktovat na čísle ${state.contact.phone}.`;
    }
    goToStep(5);
  } catch {
    btn.disabled = false;
    text.textContent = 'Potvrdit rezervaci';
    spinner.hidden = true;
    alert('Nepodařilo se odeslat rezervaci. Zkuste to prosím znovu nebo nás kontaktujte telefonicky.');
  }
}

/* ─── RESET ─── */
function resetBooking() {
  state.service = null;
  state.date = null;
  state.time = null;
  state.contact = {};
  state.calendarMonth = new Date();

  document.querySelectorAll('.booking__service-item').forEach(b => {
    b.classList.remove('selected');
    b.setAttribute('aria-checked', 'false');
  });
  document.getElementById('bookingForm')?.reset();
  document.getElementById('step1Next').disabled = true;
  document.getElementById('step1Next').setAttribute('aria-disabled', 'true');
  document.getElementById('step2Next').disabled = true;
  document.getElementById('step2Next').setAttribute('aria-disabled', 'true');
  document.getElementById('submitText').textContent = 'Potvrdit rezervaci';
  document.getElementById('submitSpinner').hidden = true;

  renderCalendar();
  document.getElementById('timeslots').innerHTML = '<p class="timeslots__hint">Nejprve vyberte datum v kalendáři</p>';

  goToStep(1);
}
