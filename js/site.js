{
  const doc = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* reveal once */
  const targets = document.querySelectorAll('[data-reveal]');
  if (targets.length) {
    if (!('IntersectionObserver' in window)) targets.forEach((el) => el.classList.add('is-in'));
    else {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      }, { rootMargin: '0px 0px -4% 0px', threshold: 0.02 });
      targets.forEach((el) => io.observe(el));
      window.addEventListener('load', () => setTimeout(() => {
        targets.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
      }, 2500));
    }
  }

  /* dropdowns: hover opens with a short grace period, click opens (never closes what hover opened) */
  const drops = document.querySelectorAll('.drop');
  const canHover = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
  const setOpen = (d, open) => { d.toggleAttribute('data-open', open); d.querySelector('button').setAttribute('aria-expanded', String(open)); };
  const closeAll = (except) => drops.forEach((d) => { if (d !== except) setOpen(d, false); });
  drops.forEach((d) => {
    const btn = d.querySelector('button');
    let timer = 0;
    btn.addEventListener('click', () => {
      const open = canHover() ? true : !d.hasAttribute('data-open');
      closeAll(d); setOpen(d, open);
    });
    d.addEventListener('mouseenter', () => { if (!canHover()) return; clearTimeout(timer); closeAll(d); setOpen(d, true); });
    d.addEventListener('mouseleave', () => { if (!canHover()) return; timer = setTimeout(() => setOpen(d, false), 260); });
    d.addEventListener('focusout', (e) => { if (!d.contains(e.relatedTarget)) setOpen(d, false); });
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAll(); closeSheet(); } });
  document.addEventListener('click', (e) => { if (!e.target.closest('.drop')) closeAll(); });

  /* fixed header state */
  const head = document.querySelector('.site-head');
  if (head) {
    const onScroll = () => head.classList.toggle('is-stuck', scrollY > 24);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  /* mobile menu */
  const sheet = document.querySelector('.menu-sheet');
  const opener = document.querySelector('.menu-toggle');
  function closeSheet() { if (sheet && sheet.hasAttribute('data-open')) { sheet.removeAttribute('data-open'); opener.setAttribute('aria-expanded', 'false'); opener.focus(); } }
  if (sheet && opener) {
    opener.addEventListener('click', () => { sheet.setAttribute('data-open', ''); opener.setAttribute('aria-expanded', 'true'); sheet.querySelector('.menu-close').focus(); });
    sheet.querySelector('.menu-close').addEventListener('click', closeSheet);
  }


  /* hero scene: parallax on scroll and pointer; still under reduced motion */
  const sceneSvg = document.querySelector('.scene-svg');
  if (sceneSvg) {
    if (reduce) { try { sceneSvg.pauseAnimations(); } catch (e) {} }
    else {
      const layers = [...sceneSvg.querySelectorAll('.layer')].map((g) => [g, parseFloat(g.dataset.depth || 0)]);
      let sy = 0, mx = 0, raf = 0;
      const paint = () => { raf = 0; layers.forEach(([g, d]) => { g.style.transform = `translate(${(mx * d * 60).toFixed(1)}px, ${(sy * d).toFixed(1)}px)`; }); };
      const ask = () => { if (!raf) raf = requestAnimationFrame(paint); };
      addEventListener('scroll', () => { sy = Math.min(scrollY, innerHeight * 1.2); ask(); }, { passive: true });
      if (matchMedia('(hover: hover) and (pointer: fine)').matches) addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - .5; ask(); }, { passive: true });
      const io = new IntersectionObserver(([e]) => { try { e.isIntersecting ? sceneSvg.unpauseAnimations() : sceneSvg.pauseAnimations(); } catch (err) {} });
      io.observe(sceneSvg);
    }
  }


  /* map video: plays while on screen */
  document.querySelectorAll('.map-video').forEach((f) => {
    const v = f.querySelector('video'); const b = f.parentElement.querySelector('.map-ctl .clip-pause');
    let userPaused = reduce;
    if (b) {
      if (reduce) b.textContent = 'Reproduzir vídeo';
      b.addEventListener('click', () => {
        if (v.paused) { userPaused = false; v.play().catch(() => {}); b.textContent = 'Pausar vídeo'; }
        else { userPaused = true; v.pause(); b.textContent = 'Reproduzir vídeo'; }
      });
    }
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(([e]) => { if (e.isIntersecting && !userPaused) v.play().catch(() => {}); else if (!e.isIntersecting) v.pause(); }, { threshold: 0.35 }).observe(v);
  });


  /* hero platform: one story, the queue and the gate phone move together */
  const rows = document.querySelector('.dash-rows');
  if (rows && !reduce) {
    const fmt = (n) => n.toLocaleString('pt-BR');
    const kValid = document.querySelector('[data-k=valid]');
    const kBlocked = document.querySelector('[data-k=blocked]');
    const res = document.querySelector('.pm-res'), who = document.querySelector('[data-pm-who]'), tm = document.querySelector('[data-pm-time]');
    const pm = document.querySelector('.pm');
    let valid = 1212, blocked = 6, min = 12;
    const people = [
      { who: 'Ana S. Rocha', co: 'Elétrica Paranã', doc: 'NR-35' },
      { who: 'Caminhão RQX-4E21', co: 'TransRota Logística', doc: 'CRLV' },
      { who: 'Paulo R. Teixeira', co: 'Andaimes Ipê', doc: 'Integração' },
      { who: 'Guindaste GR-14', co: 'Vale Forte Engenharia', doc: 'Checklist NR-12' },
      { who: 'Renata C. Dias', co: 'Sol Norte Montagens', doc: 'NR-10' },
      { who: 'Diego F. Alves', co: 'Vale Forte Engenharia', doc: 'ASO' },
    ];
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const tick = () => { min = (min + 1) % 60; tm.textContent = `07:${String(min).padStart(2, '0')}`; };
    const scan = async (ms) => { pm.classList.add('is-scan'); await wait(ms); pm.classList.remove('is-scan'); };
    const showGate = (state, name, why) => {
      res.dataset.state = state;
      res.querySelector('b').textContent = state === 'ok' ? 'Liberado' : 'Bloqueado';
      who.textContent = why ? `${name} · ${why}` : name;
      tick();
    };
    const rowFor = (p) => {
      const found = [...rows.children].find((li) => li.querySelector('.who')?.firstChild?.textContent.trim() === p.who && li.querySelector('.pill.wait'));
      if (found) return found;
      const li = document.createElement('li'); li.className = 'new';
      li.innerHTML = `<span class="who">${p.who}<small>${p.co}</small></span><span class="doc">${p.doc}</span><span class="pill wait">Em análise</span>`;
      rows.prepend(li);
      while (rows.children.length > 5) rows.lastElementChild.remove();
      return li;
    };
    (async () => {
      await wait(1800);
      let n = 0;
      for (;;) {
        if (document.hidden) { await wait(800); continue; }
        const p = people[n++ % people.length];
        const li = rowFor(p);
        li.classList.add('is-cur');
        await wait(900);
        await scan(1100);
        showGate('no', p.who, `${p.doc} em análise`);
        kBlocked.textContent = fmt(++blocked);
        await wait(2600);
        const pill = li.querySelector('.pill');
        pill.className = 'pill ok flash'; pill.textContent = 'Válido';
        kValid.textContent = fmt(++valid);
        kBlocked.textContent = fmt(--blocked);
        await wait(1000);
        await scan(1100);
        showGate('ok', p.who);
        await wait(3200);
        li.classList.remove('is-cur');
      }
    })();
  }


  /* ativos: interactive map, regions light their pins up one by one */
  document.querySelectorAll('[data-atlas-root]').forEach((root) => {
    const map = root.querySelector('.atlas-map');
    const pins = [...map.querySelectorAll('.pin')];
    const states = [...map.querySelectorAll('path[data-r]')];
    const lists = [...root.querySelectorAll('[data-list]')];
    const btns = [...root.querySelectorAll('.atlas-regions [data-region]')];
    const order = ['all', 'ne', 'se', 'nco', 'su'];
    let cur = 'all', timer = null, touched = false;
    root.classList.add('atlas-root-js');
    const set = (r) => {
      cur = r;
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.region === r)));
      lists.forEach((l) => { l.hidden = l.dataset.list !== r; });
      states.forEach((p) => p.classList.toggle('hot', r !== 'all' && p.dataset.r === r));
      let k = 0;
      pins.forEach((p) => {
        const on = r === 'all' || p.dataset.r === r;
        p.classList.remove('pop'); void p.offsetWidth;
        p.classList.toggle('on', on);
        if (on) { p.style.setProperty('--n', String(k++)); p.classList.add('pop'); }
      });
    };
    const stop = () => { touched = true; clearInterval(timer); };
    root.querySelectorAll('[data-region]').forEach((b) => b.addEventListener('click', () => { stop(); set(b.dataset.region); }));
    const pinOf = (i) => pins.find((p) => p.dataset.i === i);
    root.querySelectorAll('.al-item').forEach((b) => {
      const p = pinOf(b.dataset.i);
      const on = () => { stop(); p.classList.add('hi'); b.classList.add('hi'); };
      const off = () => { p.classList.remove('hi'); b.classList.remove('hi'); };
      b.addEventListener('mouseenter', on); b.addEventListener('mouseleave', off); b.addEventListener('focus', on); b.addEventListener('blur', off);
      b.addEventListener('click', () => { on(); setTimeout(off, 2600); });
    });
    pins.forEach((p) => {
      const li = root.querySelector(`.al-item[data-i="${p.dataset.i}"]`);
      p.addEventListener('mouseenter', () => { stop(); li && li.classList.add('hi'); });
      p.addEventListener('mouseleave', () => li && li.classList.remove('hi'));
      p.addEventListener('focus', () => { stop(); li && li.classList.add('hi'); });
      p.addEventListener('blur', () => li && li.classList.remove('hi'));
    });
    set('all');
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(([e], io) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        let n = 0;
        timer = setInterval(() => { if (touched || document.hidden) return; set(order[++n % order.length]); }, 4200);
      }, { threshold: 0.45 }).observe(map);
    }
  });


  /* rails: a linha liga as etapas e se desenha conforme a rolagem */
  const rails = [...document.querySelectorAll('[data-rail]')];
  if (rails.length && !reduce) {
    const mq = window.matchMedia('(max-width: 900px)');
    const clamp = (v) => Math.max(0, Math.min(1, v));
    let queued = false;
    const paint = () => {
      queued = false;
      const y = innerHeight * 0.62;
      rails.forEach((ol) => {
        const lis = [...ol.children];
        const d = lis[0].firstElementChild.offsetHeight || 36;
        if (!ol.classList.contains('rail--h')) {
          lis.forEach((li, i) => {
            const top = li.getBoundingClientRect().top;
            li.classList.toggle('is-on', y >= top + d / 2);
            if (i < lis.length - 1) {
              const a = top + d, b = lis[i + 1].getBoundingClientRect().top;
              li.style.setProperty('--f', clamp((y - a) / Math.max(1, b - a)).toFixed(3));
            }
          });
        } else if (mq.matches) {
          const r = ol.getBoundingClientRect();
          ol.style.setProperty('--p', clamp((y - r.top - d / 2) / Math.max(1, r.height - d)).toFixed(3));
          lis.forEach((li) => li.classList.toggle('is-on', y >= li.getBoundingClientRect().top + d / 2));
        } else {
          const top = ol.getBoundingClientRect().top;
          const p = clamp((innerHeight * 0.9 - top) / (innerHeight * 0.38));
          ol.style.setProperty('--p', p.toFixed(3));
          lis.forEach((li, i) => li.classList.toggle('is-on', p >= i / lis.length + 0.02));
        }
      });
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    addEventListener('load', queue);
    paint();
  } else rails.forEach((ol) => [...ol.children].forEach((li) => li.classList.add('is-on')));

  /* tabs */
  document.querySelectorAll('.tabs').forEach((t) => {
    const btns = [...t.querySelectorAll('[role=tab]')];
    const show = (b, focus) => {
      btns.forEach((x) => { const on = x === b; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).toggleAttribute('data-hide', !on); });
      if (focus) b.focus();
    };
    btns.forEach((b, i) => {
      b.tabIndex = b.getAttribute('aria-selected') === 'true' ? 0 : -1;
      b.addEventListener('click', () => show(b));
      b.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); show(btns[(i + 1) % btns.length], true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); show(btns[(i - 1 + btns.length) % btns.length], true); }
      });
    });
  });

  /* cookies */
  const cookie = document.querySelector('.cookie');
  if (cookie) {
    const prefsBox = cookie.querySelector('.cookie-prefs');
    const custom = cookie.querySelector('[data-cookie-custom]');
    const boxes = [...cookie.querySelectorAll('[data-pref]')];
    const read = () => { try { const v = localStorage.getItem('regrhan-cookies'); if (!v) return null; if (v === 'all') return { analytics: true, marketing: true }; if (v === 'min') return { analytics: false, marketing: false }; return JSON.parse(v); } catch (e) { return null; } };
    const save = (p) => { try { localStorage.setItem('regrhan-cookies', JSON.stringify(p)); } catch (e) {} document.documentElement.dataset.consent = p.analytics || p.marketing ? 'on' : 'min'; cookie.hidden = true; };
    const saved = read();
    if (!saved) setTimeout(() => { cookie.hidden = false; }, 900);
    const openPanel = (show) => { prefsBox.hidden = !show; custom.setAttribute('aria-expanded', String(show)); custom.textContent = show ? 'Salvar preferências' : 'Personalizar'; };
    cookie.querySelectorAll('[data-cookie]').forEach((b) => b.addEventListener('click', () => save(b.dataset.cookie === 'all' ? { analytics: true, marketing: true } : { analytics: false, marketing: false })));
    custom.addEventListener('click', () => {
      if (prefsBox.hidden) { openPanel(true); return; }
      save(Object.fromEntries(boxes.map((b) => [b.dataset.pref, b.checked])));
    });
    document.querySelectorAll('[data-cookie-open]').forEach((b) => b.addEventListener('click', () => {
      const p = read() || {}; boxes.forEach((x) => { x.checked = !!p[x.dataset.pref]; });
      cookie.hidden = false; openPanel(true); custom.focus();
    }));
  }

  /* the badge */
  const badge = document.querySelector('.badge');
  if (badge) {
    const buttons = [...document.querySelectorAll('button.doc[data-short]')];
    const status = badge.querySelector('.badge-status b');
    const detail = badge.querySelector('.badge-status span');
    const meter = badge.querySelector('.meter');
    const stamp = badge.querySelector('[data-stamp]');
    const live = document.querySelector('#gate-live');
    const render = () => {
      const done = buttons.filter((b) => b.getAttribute('aria-pressed') === 'true');
      const missing = buttons.filter((b) => b.getAttribute('aria-pressed') !== 'true').map((b) => b.dataset.short);
      const ok = missing.length === 0;
      badge.dataset.state = ok ? 'ok' : 'blocked';
      status.textContent = ok ? 'Liberado' : 'Bloqueado';
      detail.textContent = ok
        ? 'Documentação 100% validada. Pode entrar.'
        : `Falta${missing.length > 1 ? 'm' : ''} ${missing.length} de ${buttons.length}: ${missing.join(', ')}.`;
      meter.style.setProperty('--p', `${Math.round((done.length / buttons.length) * 100)}%`);
      const now = new Date();
      stamp.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      if (live) live.textContent = ok ? 'Crachá liberado.' : `Crachá bloqueado. ${detail.textContent}`;
    };
    buttons.forEach((b) => b.addEventListener('click', () => {
      b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
      render();
    }));
    render();
  }

  /* portaria feed: a new reading every few seconds */
  const feed = document.querySelector('.feed-list');
  if (feed && !reduce) {
    const pool = [
      ['Caminhão FJT-2B90', 'TransRota Logística', 'ok'], ['Paulo R. Teixeira', 'Andaimes Ipê', 'ok'],
      ['Guindaste GR-14', 'Vale Forte Engenharia', 'ok'], ['Lucas M. Prado', 'Elétrica Paranã · ASO vencido', 'no'],
      ['Renata C. Dias', 'Sol Norte Montagens', 'ok'], ['Diego F. Alves', 'Vale Forte Engenharia', 'ok'],
      ['Caminhonete QOP-7C13', 'Sol Norte Montagens', 'ok'], ['Bruno T. Sales', 'Andaimes Ipê · integração pendente', 'no'],
    ];
    let n = 0, mins = 12;
    setInterval(() => {
      if (document.hidden) return;
      const [who, co, st] = pool[n++ % pool.length];
      mins = (mins + 1 + (n % 2)) % 60;
      const li = document.createElement('li');
      li.className = 'new';
      li.innerHTML = `<time>07:${String(mins).padStart(2, '0')}</time><span>${who}<small>${co}</small></span><span class="pill ${st}">${st === 'ok' ? 'Liberado' : 'Bloqueado'}</span>`;
      feed.prepend(li);
      while (feed.children.length > 5) feed.lastElementChild.remove();
    }, 3200);
  }

  /* numeros que sobem devagar */
  const rolls = [...document.querySelectorAll('[data-roll]')];
  rolls.forEach((el, n) => {
    const text = el.textContent.trim();
    const m = text.match(/^(\D*)(\d[\d.]*)(.*)$/);
    if (!m || reduce) return;
    const [, pre, num, post] = m;
    const target = parseInt(num.replace(/\./g, ''), 10);
    const said = Object.assign(document.createElement('span'), { className: 'sr-only', textContent: text });
    const ghost = Object.assign(document.createElement('span'), { className: 'roll__ghost', textContent: text });
    const live = Object.assign(document.createElement('span'), { className: 'roll__live', textContent: pre + '0' + post });
    ghost.setAttribute('aria-hidden', 'true'); live.setAttribute('aria-hidden', 'true');
    el.classList.add('roll'); el.replaceChildren(said, ghost, live);
    const run = () => {
      const dur = 4200, t0 = performance.now() + (el.closest('[data-reveal]')?.style.getPropertyValue('--i') || 0) * 300;
      const tick = (now) => {
        const p = Math.min(1, Math.max(0, (now - t0) / dur));
        const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
        live.textContent = pre + v.toLocaleString('pt-BR') + post;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); run(); }
    }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
  });

  /* clip pause */
  document.querySelectorAll('.clip-ctl').forEach((c) => {
    const v = c.parentElement.querySelector('video'); const b = c.querySelector('.clip-pause');
    if (!v || !b) return;
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); b.textContent = 'Reproduzir vídeo'; }
    b.addEventListener('click', () => {
      if (v.paused) { v.play().catch(() => {}); b.textContent = 'Pausar vídeo'; } else { v.pause(); b.textContent = 'Reproduzir vídeo'; }
    });
  });

  /* forms: compose an e-mail, never pretend to send */
  document.querySelectorAll('form[data-mail]').forEach((f) => {
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!f.reportValidity()) return;
      const data = new FormData(f);
      const lines = [];
      for (const [k, v] of data.entries()) if (String(v).trim()) lines.push(`${k}: ${v}`);
      const subject = f.dataset.subject + (data.get('Empresa') ? ` · ${data.get('Empresa')}` : data.get('Nome') ? ` · ${data.get('Nome')}` : '');
      const href = `mailto:comercial@regrhan.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      const done = f.parentElement.querySelector('.form-done');
      if (done) { done.setAttribute('data-show', ''); done.focus(); }
      window.location.href = href;
    });
  });

  /* faq search */
  const fs = document.querySelector('[data-faq-search]');
  if (fs) {
    const groups = [...document.querySelectorAll('[data-faq-group]')];
    const nEl = document.querySelector('[data-faq-n]'); const empty = document.querySelector('[data-faq-empty]');
    const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    fs.addEventListener('input', () => {
      const v = norm(fs.value.trim()); let total = 0;
      groups.forEach((g) => {
        let n = 0;
        g.querySelectorAll('.q').forEach((q) => { const hit = !v || norm(q.textContent).includes(v); q.hidden = !hit; if (hit) n++; });
        g.hidden = n === 0; total += n;
      });
      nEl.textContent = total; empty.hidden = total !== 0;
    });
  }
}

/* pausar a historia da hero */
(() => {
  const btn = document.querySelector('.hb-pause'); const stage = document.querySelector('.hb-stage');
  if (!btn || !stage) return;
  btn.addEventListener('click', () => {
    const on = stage.classList.toggle('is-paused');
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'Retomar animação' : 'Pausar animação';
  });
})();

/* pausar o video da hero */
(() => {
  const btn = document.querySelector('.hv-pause'); const vid = document.querySelector('.hv-media video');
  if (!btn || !vid) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { vid.removeAttribute('autoplay'); vid.pause(); btn.hidden = true; return; }
  btn.addEventListener('click', () => {
    const pause = !vid.paused;
    pause ? vid.pause() : vid.play();
    btn.setAttribute('aria-pressed', String(pause));
    btn.textContent = pause ? 'Retomar animação' : 'Pausar animação';
  });
})();

/* pausar a faixa de clientes */
(() => {
  const sec = document.querySelector('.clientes'); const btn = document.querySelector('.marq-pause');
  if (!sec || !btn) return;
  btn.addEventListener('click', () => {
    const pause = !sec.classList.contains('is-paused');
    sec.classList.toggle('is-paused', pause);
    btn.setAttribute('aria-pressed', String(pause));
    btn.textContent = pause ? 'Retomar faixa' : 'Pausar faixa';
  });
})();
