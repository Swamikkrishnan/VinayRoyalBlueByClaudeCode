/* =========================================================================
   Vinay Swaminathan — behaviour (2026 redesign)
   Ported from the Claude Design canvas project's per-page motion script:
   content is visible in plain HTML/CSS by default; this file only adds a
   one-shot entrance animation, the header/nav toggle, the Approach page's
   sticky sub-nav, and the Alignment Call scheduler + submission.
   ========================================================================= */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------------------
     1. Header — mobile nav toggle (works with no JS: nav-mobile has no
        [hidden] until this runs, but on narrow screens it is only reached
        via the toggle button, so we default it closed once JS confirms).
     --------------------------------------------------------------------- */
  var toggle = document.getElementById('nav-toggle');
  var mobileNav = document.getElementById('nav-mobile');
  if (toggle && mobileNav) {
    mobileNav.hidden = true;
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      toggle.querySelector('[data-label]').textContent = open ? 'Menu' : 'Close';
      mobileNav.hidden = open;
    });
    mobileNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.querySelector('[data-label]').textContent = 'Menu';
        mobileNav.hidden = true;
      }
    });
  }

  /* ---------------------------------------------------------------------
     2. Reveal engine — IntersectionObserver adds .is-in once; the CSS in
        motion-ready mode uses that to transition from a JS-added start
        state. Nothing is hidden until root carries .motion-ready.
     --------------------------------------------------------------------- */
  if (!reduce.matches && 'IntersectionObserver' in window) {
    root.classList.add('motion-ready');
    var targets = document.querySelectorAll('[data-reveal], [data-stagger], [data-seq]');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    targets.forEach(function (el) { io.observe(el); });
    // Anything already on screen arrives without waiting for a scroll.
    setTimeout(function () {
      targets.forEach(function (el) {
        var b = el.getBoundingClientRect();
        if (b.top < window.innerHeight && b.bottom > 0) el.classList.add('is-in');
      });
    }, 80);
    // Safety net: never leave anything invisible.
    setTimeout(function () {
      targets.forEach(function (el) { el.classList.add('is-in'); });
    }, 4000);
  } else {
    document.querySelectorAll('svg').forEach(function (svg) {
      if (svg.pauseAnimations) svg.pauseAnimations();
    });
  }

  /* ---------------------------------------------------------------------
     3. Approach page — sticky sub-nav scroll-spy (a no-op elsewhere)
     --------------------------------------------------------------------- */
  var subnavLinks = document.querySelectorAll('.subnav [data-section]');
  if (subnavLinks.length) {
    var sectionIds = Array.prototype.map.call(subnavLinks, function (a) { return a.getAttribute('data-section'); });
    var setActive = function () {
      var current = sectionIds[0];
      sectionIds.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 140) current = id;
      });
      subnavLinks.forEach(function (a) {
        var on = a.getAttribute('data-section') === current;
        a.setAttribute('aria-current', on ? 'location' : 'false');
      });
    };
    window.addEventListener('scroll', function () { window.requestAnimationFrame(setActive); }, { passive: true });
    setActive();
  }

  /* ---------------------------------------------------------------------
     4. Alignment Call — day/slot picker in the visitor's own time zone,
        submitted to Web3Forms. IST is the practice's home time zone.
     --------------------------------------------------------------------- */
  var form = document.getElementById('alignment-form');
  if (form) {
    var IST_OFFSET_MIN = 330;
    var slotsWrap = document.getElementById('call-slots');
    var tzNote = document.getElementById('call-tz-note');
    var slotInput = document.getElementById('f-slot');

    function istParts(d) {
      var p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })
        .format(d).split('-').map(Number);
      return { y: p[0], m: p[1], d: p[2] };
    }

    function buildDays() {
      var now = new Date();
      var t = istParts(now);
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      var isIST = tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta';
      var fTime = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
      var fDay = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
      var fDayIST = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
      var fWk = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
      var days = [];
      for (var k = 0; days.length < 6 && k < 14; k++) {
        var base = new Date(Date.UTC(t.y, t.m - 1, t.d + k));
        if (base.getUTCDay() === 0) continue;
        var raw = [[15, 0, '3:00 PM'], [15, 45, '3:45 PM']].map(function (s) {
          var dt = new Date(Date.UTC(t.y, t.m - 1, t.d + k, s[0], s[1]) - IST_OFFSET_MIN * 60000);
          return { dt: dt, lbl: s[2] };
        }).filter(function (s) { return s.dt - now > 3 * 3600000; });
        if (!raw.length) continue;
        var dayLocal = fDay.format(raw[0].dt);
        days.push({
          label: isIST ? fDayIST.format(raw[0].dt) : dayLocal,
          slots: raw.map(function (s) {
            var sameDay = fDay.format(s.dt) === dayLocal;
            var local = (sameDay ? '' : fWk.format(s.dt) + ' ') + fTime.format(s.dt);
            var value = fDayIST.format(s.dt) + ', ' + s.lbl + ' IST' + (isIST ? '' : ' (' + fDay.format(s.dt) + ' ' + fTime.format(s.dt) + ' ' + tz + ')');
            return { value: value, local: isIST ? s.lbl : local, ist: isIST ? 'IST' : s.lbl + ' IST' };
          }),
        });
      }
      var off = '';
      try { off = new Intl.DateTimeFormat(undefined, { timeZone: tz, timeZoneName: 'short' }).formatToParts(now).find(function (p) { return p.type === 'timeZoneName'; }).value; } catch (e) {}
      var city = tz.split('/').pop().replace(/_/g, ' ');
      return { days: days, tzLabel: isIST ? 'India (IST)' : city + (off ? ' · ' + off : ''), isIST: isIST };
    }

    function renderSlots() {
      var built = buildDays();
      if (tzNote) {
        tzNote.textContent = 'Shown in your time · ' + built.tzLabel + (built.isIST ? '.' : ', with India time (IST) beneath each.');
      }
      slotsWrap.innerHTML = '';
      built.days.forEach(function (day) {
        var row = document.createElement('div');
        row.setAttribute('role', 'group');
        row.setAttribute('aria-label', day.label);
        row.style.cssText = 'display:grid;grid-template-columns:minmax(88px,auto) 1fr;align-items:center;gap:8px 12px;padding:10px 0;border-bottom:1px solid var(--line)';
        var label = document.createElement('span');
        label.style.cssText = 'font-weight:500;color:var(--text)';
        label.textContent = day.label;
        row.appendChild(label);
        var opts = document.createElement('div');
        opts.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
        day.slots.forEach(function (s) {
          var lbl = document.createElement('label');
          lbl.className = 'choice';
          var input = document.createElement('input');
          input.type = 'radio'; input.name = 'slot-pick'; input.value = s.value;
          input.addEventListener('change', function () { slotInput.value = s.value; });
          var span = document.createElement('span');
          span.style.cssText = 'display:grid;line-height:1.25';
          span.innerHTML = '<span style="font-weight:500">' + s.local + '</span><span style="color:var(--muted)">' + s.ist + '</span>';
          lbl.appendChild(input); lbl.appendChild(span);
          opts.appendChild(lbl);
        });
        row.appendChild(opts);
        slotsWrap.appendChild(row);
      });
      var flexLbl = document.createElement('label');
      flexLbl.className = 'choice';
      flexLbl.style.cssText = 'justify-self:start';
      var flexInput = document.createElement('input');
      flexInput.type = 'radio'; flexInput.name = 'slot-pick'; flexInput.value = 'Flexible / later';
      flexInput.addEventListener('change', function () { slotInput.value = 'Flexible / later'; });
      flexLbl.appendChild(flexInput);
      flexLbl.appendChild(document.createTextNode('I’m flexible, or need a later date'));
      slotsWrap.appendChild(flexLbl);
    }
    if (slotsWrap) renderSlots();

    var sent = document.getElementById('form-sent');
    var errors = document.getElementById('form-errors');
    var endpoint = form.getAttribute('action') || '';
    var canAjax = /web3forms\.com/.test(endpoint) && typeof window.fetch === 'function';

    form.addEventListener('submit', function (e) {
      if (errors) errors.hidden = true;
      if (!canAjax) return;
      if (!form.checkValidity()) return;
      var hp = form.querySelector('input[name="website"]');
      if (hp && hp.value) { e.preventDefault(); return; }
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = 'Sending…'; }
      fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (data) { return { ok: r.ok, data: data }; }); })
        .then(function (res) {
          if (res.ok && (res.data.success === true || res.data.success === undefined)) {
            var nameEl = document.getElementById('sent-name');
            if (nameEl) nameEl.textContent = String(new FormData(form).get('name') || '').split(' ')[0];
            var slotEl = document.getElementById('sent-slot');
            if (slotEl) {
              var v = slotInput ? slotInput.value : '';
              if (v) { slotEl.hidden = false; slotEl.querySelector('span').textContent = v; }
            }
            form.hidden = true;
            if (sent) { sent.hidden = false; sent.setAttribute('tabindex', '-1'); sent.focus(); }
          } else {
            if (btn) { btn.disabled = false; btn.innerHTML = label; }
            if (errors) { errors.hidden = false; errors.textContent = (res.data && res.data.message) || 'The message did not go through. Please try again, or write in directly.'; }
          }
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.innerHTML = label; }
          if (errors) { errors.hidden = false; errors.textContent = 'The message did not go through — this can be a connection issue. Please try again in a moment.'; }
        });
    });
  }

  /* ---------------------------------------------------------------------
     5. Jump-to-hash on load (matches the design's instant-scroll behaviour)
     --------------------------------------------------------------------- */
  if (location.hash) {
    setTimeout(function () {
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 72, behavior: 'instant' });
    }, 90);
  }
}());
