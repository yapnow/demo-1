/* YapNow landing page interactions */
(function(){
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav ---------- */
  const nav = $('.nav'), toggle = $('#nav-toggle'), links = $('#nav-links');
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 10), {passive:true});
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', open); links.classList.toggle('open', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  $$('a', links).forEach(a => a.addEventListener('click', () => { links.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); }));

  /* ---------- hero demo phone: idle → searching → matched → talking ---------- */
  const MODES = {
    chat:  {limit:'4 of 5 free chats left today', talk:'Chat · live'},
    call:  {limit:'3 of 5 free calls left today', talk:'Voice call · 00:42'},
    video: {limit:'Premium · unlimited video',   talk:'Video call · HD'},
  };
  let mode = 'chat', timers = [], reqN = 1041;
  const states = $$('.demo-state'), reqId = $('#req-id'), reqState = $('#req-state');
  function show(name){ states.forEach(s => s.classList.toggle('is-on', s.dataset.state === name)); }
  function setReq(label, cls){ reqState.textContent = label; reqState.className = 'req-state' + (cls ? ' ' + cls : ''); }
  function clear(){ timers.forEach(clearTimeout); timers = []; }
  function later(fn, ms){ timers.push(setTimeout(fn, ms)); }
  function idle(){
    show('idle'); setReq('Ready'); reqId.textContent = 'req —';
    $('#demo-limit').textContent = MODES[mode].limit;
  }
  function run(){
    clear(); reqN++;
    reqId.textContent = 'req r' + reqN;
    show('search'); setReq('Initiated', 'initiated');
    later(() => { show('match'); setReq('Responded', 'responded'); reqId.textContent = 'conv r' + reqN + '·r' + (reqN + 7); }, 2400);
    later(() => { $('#talk-mode').textContent = MODES[mode].talk; show('talk'); setReq('Live', 'responded'); }, 4400);
    later(() => { idle(); }, 9800);
    later(() => { autoplay(); }, 11500);
  }
  function setMode(m){
    mode = m;
    $$('.phone-hero .tab').forEach(t => t.classList.toggle('is-on', t.dataset.mode === m));
  }
  $$('.phone-hero .tab').forEach(t => t.addEventListener('click', () => { clear(); setMode(t.dataset.mode); idle(); }));
  $('#demo-connect').addEventListener('click', run);
  // autoplay cycles through the three tabs
  const order = ['chat','call','video'];
  function autoplay(){
    if (reduce) return;
    setMode(order[(order.indexOf(mode) + 1) % 3]); idle();
    later(run, 1600);
  }
  idle();
  if (!reduce) later(run, 2200);

  /* ---------- matchmaking builder ---------- */
  const builder = $('#builder'), summary = $('#summary');
  function selected(group){ return $$(`[data-group="${group}"] .is-on`, builder).map(b => b.textContent); }
  function renderSummary(){
    const bits = [...selected('loc'), ...selected('lang'), ...selected('prof'), ...selected('passion'), ...selected('gender')];
    summary.innerHTML = bits.map(b => `<span>${b}</span>`).join('');
    const n = selected('passion').length;
    $('#passion-limit').textContent = `${n} / 3`;
  }
  $$('.seg', builder).forEach(seg => seg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', seg).forEach(x => x.classList.remove('is-on')); b.classList.add('is-on'); renderSummary();
  }));
  $$('.tags', builder).forEach(box => box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const max = +box.dataset.max, on = $$('.is-on', box);
    const msg = $('#limit-msg');
    if (!b.classList.contains('is-on') && on.length >= max){
      box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
      if (box.dataset.group === 'passion') msg.textContent = `You can choose up to ${max} passions. Remove one to pick another.`;
      return;
    }
    msg.textContent = '';
    b.classList.toggle('is-on'); b.setAttribute('aria-pressed', b.classList.contains('is-on')); renderSummary();
  }));
  $$('.tags button', builder).forEach(b => b.setAttribute('aria-pressed', b.classList.contains('is-on')));
  renderSummary();

  const flow = $$('.flow-step'), tryBtn = $('#try-match'), note = $('#try-note');
  let flowTimers = [];
  tryBtn.addEventListener('click', () => {
    flowTimers.forEach(clearTimeout); flowTimers = [];
    flow.forEach((f,i) => f.classList.toggle('is-on', i === 0));
    tryBtn.disabled = true; tryBtn.textContent = 'Searching…'; note.textContent = 'Looking in the pool for people who match…';
    flowTimers.push(setTimeout(() => flow[1].classList.add('is-on'), 900));
    flowTimers.push(setTimeout(() => {
      flow[2].classList.add('is-on'); tryBtn.disabled = false; tryBtn.textContent = 'Find another match';
      note.textContent = 'Matched! In the real app, your conversation starts now.';
    }, 2200));
  });

  /* ---------- steps underline when visible ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting){ en.target.classList.add('lit'); io.unobserve(en.target); }
  }), {threshold:.4});
  io.observe($('.steps'));

  /* ---------- gallery arrows ---------- */
  const gallery = $('#gallery');
  $$('.gallery-ctrl .round-btn').forEach(b => b.addEventListener('click', () => {
    gallery.scrollBy({left: +b.dataset.dir * 332, behavior: reduce ? 'auto' : 'smooth'});
  }));

  /* ---------- AI suggestion rotator ---------- */
  const tips = [
    'Try: <b>“What surprised you most about living there?”</b>',
    'Try: <b>“What does a perfect weekend in Berlin look like?”</b>',
    'Try: <b>“What do you miss most about home?”</b>',
  ];
  let ti = 0; const tipBox = $('#ai-rotator'), tipText = $('#ai-text');
  if (!reduce) setInterval(() => {
    tipBox.classList.add('fade');
    setTimeout(() => { ti = (ti + 1) % tips.length; tipText.innerHTML = tips[ti]; tipBox.classList.remove('fade'); }, 350);
  }, 3600);

  /* ---------- reliability sequence ---------- */
  const rows = $$('.rel-row'); let ri = 0;
  function relStep(){ rows.forEach((r,i) => r.classList.toggle('is-on', i <= ri)); ri = (ri + 1) % (rows.length + 1); }
  if (reduce) rows.forEach(r => r.classList.add('is-on')); else { relStep(); setInterval(relStep, 1400); }

  /* ---------- services explorer ---------- */
  const SERVICES = [
    {name:'Customer Profile', tag:'Users & preferences', desc:'Keeps track of each user: profile, preferences, history, ratings, score, onboarding and permissions. Every user gets a unique, hashed, production-grade ID.', mods:['AccountCreation','Profile','Face & Voice Verification','Permissions','Consent','Preferences']},
    {name:'Matchmaking', tag:'Filters & pairing', desc:'Applies your filters, searches the pool of available users and pairs two requests into a conversation ID for the realtime service.', mods:['FiltersHandler','MatchmakingHandler','RecoveryHandler']},
    {name:'Conversation', tag:'Realtime chat & calls', desc:'Runs live chat and calls, monitors every connection, recovers dropped calls and powers the AI conversation assistant.', mods:['ChatHandler','CallHandler','RecoveryHandler','LogsHandler','AI Recommender & Tracker']},
    {name:'Payment & Subscription', tag:'Premium, wallet & gifts', desc:'Handles payments, subscriptions and their policies, the wallet used to send gifts, and coupons.', mods:['PaymentGateway','SubscriptionsHandler','PolicyHandler','WalletsHandler','CouponsHandler']},
    {name:'Notification', tag:'Alerts to the app', desc:'Delivers every kind of notification to the app, from match alerts to connection warnings.', mods:['EventsHandler']},
    {name:'Customer Support', tag:'Help & ops', desc:'Answers questions with an AI chatbot, manages support tickets and powers the operations dashboard.', mods:['AI Chatbot','TicketsHandler']},
    {name:'Micro Frontend', tag:'Backend-driven app', desc:'Makes the React Native app backend-driven, so screens and flows can be updated from the server without an app release.', mods:['Template Generation','API Handling']},
    {name:'Infra', tag:'Infrastructure as code', desc:'Holds the infrastructure code that deploys and scales every other service.', mods:['Infrastructure Code']},
  ];
  const grid = $('#svc-grid'), detail = $('#svc-detail');
  function pick(i){
    $$('.svc', grid).forEach((b,j) => { b.setAttribute('aria-selected', i === j); b.tabIndex = i === j ? 0 : -1; });
    const s = SERVICES[i];
    detail.innerHTML = `<h3>${s.name} Service</h3><p>${s.desc}</p><div class="svc-mods">${s.mods.map(m => `<span>${m}</span>`).join('')}</div>`;
  }
  SERVICES.forEach((s,i) => {
    const b = document.createElement('button');
    b.className = 'svc'; b.setAttribute('role','tab'); b.innerHTML = `<b>${s.name}</b><span>${s.tag}</span>`;
    b.addEventListener('click', () => pick(i));
    b.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft'){
        const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + SERVICES.length) % SERVICES.length;
        pick(n); grid.children[n].focus();
      }
    });
    grid.appendChild(b);
  });
  pick(0);

  /* ---------- waitlist (static demo) ---------- */
  $('#wl-form').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#wl-email'), msg = $('#wl-msg'), v = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){ msg.textContent = 'Please enter a valid email address.'; input.focus(); return; }
    msg.textContent = `You're on the list! We'll email ${v} when the beta opens.`;
    input.value = '';
  });

  $('#year').textContent = new Date().getFullYear();
})();
