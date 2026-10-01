/* =========================================================================
   Vinay Swaminathan — behaviour (2026 redesign)
   Content is visible in plain HTML/CSS by default; this file only adds a
   one-shot entrance animation, the header/nav toggle, the interior pages'
   sticky section nav, the Approach FACE selector, the Alignment Call
   scheduler + submission, a settle-safe hash landing, and open/close
   motion for the native <details> accordions (which still work without JS).
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
  // Open/closed is the .is-open class; the CSS fades and unclips the panel
  // and uses visibility (not display) so closing animates too, while closed
  // links still leave the tab order and accessibility tree.
  var toggle = document.getElementById('nav-toggle');
  var mobileNav = document.getElementById('nav-mobile');
  if (toggle && mobileNav) {
    var setNav = function (open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.querySelector('[data-label]').textContent = open ? 'Close' : 'Menu';
      mobileNav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });
    var closeNav = function (returnFocus) {
      setNav(false);
      if (returnFocus) toggle.focus();
    };
    mobileNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) closeNav(true);
    });
  }

  // Header: a slightly firmer ground once the page is scrolled (colour only).
  var siteHead = document.getElementById('site-head');
  if (siteHead) {
    var markScrolled = function () { siteHead.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', markScrolled, { passive: true });
    markScrolled();
  }

  /* ---------------------------------------------------------------------
     1b. Accordions — animate native <details> open and close (height,
         opacity and a 4px settle). Rapid clicks reverse from the current
         height; nothing is left with a fixed height afterwards, so resizing
         an open accordion is safe. Reduced motion: native instant toggle.
     --------------------------------------------------------------------- */
  var ACC_MS = 380, ACC_EASE = 'cubic-bezier(.22,.61,.36,1)';
  document.querySelectorAll('details.accordion').forEach(function (d) {
    var summary = d.querySelector(':scope > summary');
    var body = d.querySelector(':scope > .accordion__body');
    if (!summary || !body || !body.animate) return;
    var anim = null;
    var finish = function (open) {
      anim = null;
      d.open = open;
      d.classList.remove('is-animating', 'is-closing');
      body.style.height = body.style.opacity = body.style.transform = body.style.paddingBottom = '';
    };
    summary.addEventListener('click', function (e) {
      if (reduce.matches) return;           // native toggle, no motion
      e.preventDefault();
      var closing = d.open && !d.classList.contains('is-closing');
      // A closed <details> may still report its content's box (Chrome keeps
      // layout for hidden details content), so a closed one starts at 0.
      var from = d.open ? body.getBoundingClientRect().height : 0;
      var pad = anim ? getComputedStyle(body).paddingBottom : null;
      if (anim) anim.cancel();
      var padFull = getComputedStyle(body).paddingBottom;   // resting padding
      if (pad === null) pad = d.open ? padFull : '0px';
      d.classList.add('is-animating');
      if (closing) {
        d.classList.add('is-closing');
        anim = body.animate(
          [{ height: from + 'px', paddingBottom: pad, opacity: 1, transform: 'none' },
           { height: '0px', paddingBottom: '0px', opacity: 0, transform: 'translateY(-4px)' }],
          { duration: ACC_MS, easing: ACC_EASE });
        anim.onfinish = function () { finish(false); };
      } else {
        d.classList.remove('is-closing');
        d.open = true;
        var to = body.scrollHeight;
        anim = body.animate(
          [{ height: (from || 0) + 'px', paddingBottom: pad, opacity: from ? 1 : 0, transform: from ? 'none' : 'translateY(-4px)' },
           { height: to + 'px', paddingBottom: padFull, opacity: 1, transform: 'none' }],
          { duration: ACC_MS, easing: ACC_EASE });
        anim.onfinish = function () { finish(true); };
      }
    });
  });

  /* ---------------------------------------------------------------------
     2. Reveal engine — IntersectionObserver adds .is-in once; the CSS in
        motion-ready mode uses that to transition from a JS-added start
        state. Nothing is hidden until root carries .motion-ready.
     --------------------------------------------------------------------- */
  if (!reduce.matches && 'IntersectionObserver' in window) {
    root.classList.add('motion-ready');
    var targets = document.querySelectorAll('[data-reveal], [data-seq], [data-hl], [data-reveal-img]');
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
     3. Interior pages — sticky section nav scroll-spy (no-op without one).
        From 1100px the nav is a slim fixed index in the left gutter; below
        that it is a horizontal bar under the header (its height is
        --subnav-h). A section is current once its top passes the bottom of
        the sticky bars; at the very bottom the last reached section wins.
     --------------------------------------------------------------------- */
  var subnav = document.querySelector('.subnav');
  var subnavLinks = document.querySelectorAll('.subnav [data-section]');
  if (subnav && subnavLinks.length) {
    var head = document.getElementById('site-head');
    var sectionIds = Array.prototype.map.call(subnavLinks, function (a) { return a.getAttribute('data-section'); });
    var setActive = function () {
      var barH = parseFloat(getComputedStyle(document.body).getPropertyValue('--subnav-h')) || 0;
      var line = Math.max((head ? head.offsetHeight : 0) + barH + 24, window.innerHeight * 0.3);
      var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      var current = sectionIds[0];
      sectionIds.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var top = el.getBoundingClientRect().top;
        if (top < line || (atBottom && top < window.innerHeight * 0.6)) current = id;
      });
      subnavLinks.forEach(function (a) {
        var on = a.getAttribute('data-section') === current;
        if (on && a.getAttribute('aria-current') !== 'location') {
          // Keep the active item in view in the horizontally scrolling bar.
          var bar = a.closest('ul');
          if (bar && bar.scrollWidth > bar.clientWidth) {
            // Move only as far as needed to bring the active item into view.
            var pad = 20, itemL = a.parentNode.offsetLeft - bar.offsetLeft, itemR = itemL + a.offsetWidth;
            var target = null;
            if (itemL - pad < bar.scrollLeft) target = itemL - pad;
            else if (itemR + pad > bar.scrollLeft + bar.clientWidth) target = itemR + pad - bar.clientWidth;
            if (target !== null) {
              if (bar.scrollTo) bar.scrollTo({ left: Math.max(0, target), behavior: reduce.matches ? 'auto' : 'smooth' });
              else bar.scrollLeft = Math.max(0, target);
            }
          }
        }
        a.setAttribute('aria-current', on ? 'location' : 'false');
      });
    };
    window.addEventListener('scroll', function () { window.requestAnimationFrame(setActive); }, { passive: true });
    window.addEventListener('resize', setActive);
    setActive();
  }

  /* ---------------------------------------------------------------------
     3b. FACE (Approach) — progressive tab selector. Without JS the four
         panels stay stacked and fully readable.
     --------------------------------------------------------------------- */
  var face = document.querySelector('[data-face]');
  if (face) {
    var tablist = face.querySelector('.face__tabs');
    var tabs = Array.prototype.slice.call(face.querySelectorAll('.face__tab'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    tablist.setAttribute('role', 'tablist');
    tabs.forEach(function (t, i) {
      t.setAttribute('role', 'tab');
      panels[i].setAttribute('role', 'tabpanel');
      panels[i].setAttribute('aria-labelledby', t.id);
      panels[i].setAttribute('tabindex', '0');
    });
    var select = function (i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
      });
      if (focus) tabs[i].focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, k = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') k = (i + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') k = (i - 1 + n) % n;
        else if (e.key === 'Home') k = 0;
        else if (e.key === 'End') k = n - 1;
        if (k !== null) { e.preventDefault(); select(k, true); }
      });
    });
    tablist.hidden = false;
    face.classList.add('is-tabs');
    select(0, false);
  }

  /* ---------------------------------------------------------------------
     3c. Balanced photo/text pairs — set --balance-h from the text block's
         rendered height so the photo matches it (CSS keeps the natural
         ratio and only applies this in the two-column layout).
     --------------------------------------------------------------------- */
  if ('ResizeObserver' in window) {
    document.querySelectorAll('.editorial--balanced').forEach(function (ed) {
      var parts = Array.prototype.filter.call(ed.children, function (c) { return !c.classList.contains('editorial__media'); });
      var measure = function () {
        var top = Infinity, bottom = -Infinity;
        parts.forEach(function (p) { var b = p.getBoundingClientRect(); if (b.height) { top = Math.min(top, b.top); bottom = Math.max(bottom, b.bottom); } });
        if (bottom > top) ed.style.setProperty('--balance-h', Math.round((bottom - top) * 1.08) + 'px');
      };
      var ro = new ResizeObserver(function () { window.requestAnimationFrame(measure); });
      parts.forEach(function (p) { ro.observe(p); });
      measure();
    });
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

    var FLEX_VALUE = 'Flexible / later';

    // Dropdown-based picker: a day <select> and a time <select>, rebuilt from
    // buildDays() so the choices are always the next real days from *today*
    // (recomputed on every page load — nothing here goes stale) in the
    // visitor's own time zone.
    function renderSlots() {
      var built = buildDays();
      if (tzNote) {
        tzNote.textContent = 'Shown in your time · ' + built.tzLabel + (built.isIST ? '.' : ', with India time (IST) beneath each.');
      }
      slotsWrap.innerHTML = '';

      var row = document.createElement('div');
      row.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px';

      var dayField = document.createElement('div');
      dayField.className = 'ffield';
      var dayLabel = document.createElement('label');
      dayLabel.className = 'flabel'; dayLabel.htmlFor = 'f-call-day'; dayLabel.textContent = 'Day';
      var daySelect = document.createElement('select');
      daySelect.className = 'finput'; daySelect.id = 'f-call-day';
      built.days.forEach(function (day, i) {
        var opt = document.createElement('option');
        opt.value = String(i); opt.textContent = day.label;
        daySelect.appendChild(opt);
      });
      var flexOpt = document.createElement('option');
      flexOpt.value = 'flex'; flexOpt.textContent = 'I’m flexible, or need a later date';
      daySelect.appendChild(flexOpt);
      dayField.appendChild(dayLabel); dayField.appendChild(daySelect);

      var timeField = document.createElement('div');
      timeField.className = 'ffield';
      var timeLabel = document.createElement('label');
      timeLabel.className = 'flabel'; timeLabel.htmlFor = 'f-call-time'; timeLabel.textContent = 'Time';
      var timeSelect = document.createElement('select');
      timeSelect.className = 'finput'; timeSelect.id = 'f-call-time';
      timeField.appendChild(timeLabel); timeField.appendChild(timeSelect);

      function updateSlotValue() {
        if (daySelect.value === 'flex') {
          slotInput.value = FLEX_VALUE;
          return;
        }
        var day = built.days[Number(daySelect.value)];
        var slot = day && day.slots[Number(timeSelect.value)];
        slotInput.value = slot ? slot.value : '';
      }

      function populateTimes() {
        timeSelect.innerHTML = '';
        if (daySelect.value === 'flex') {
          timeSelect.disabled = true;
          var flexTimeOpt = document.createElement('option');
          flexTimeOpt.textContent = 'Any time';
          timeSelect.appendChild(flexTimeOpt);
        } else {
          timeSelect.disabled = false;
          var day = built.days[Number(daySelect.value)];
          (day ? day.slots : []).forEach(function (s, i) {
            var opt = document.createElement('option');
            opt.value = String(i);
            opt.textContent = s.local + ' (' + s.ist + ')';
            timeSelect.appendChild(opt);
          });
        }
        updateSlotValue();
      }

      daySelect.addEventListener('change', populateTimes);
      timeSelect.addEventListener('change', updateSlotValue);
      populateTimes();

      row.appendChild(dayField); row.appendChild(timeField);
      slotsWrap.appendChild(row);
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
      if (btn) { btn.style.minWidth = btn.offsetWidth + 'px'; btn.disabled = true; btn.innerHTML = 'Sending…'; }
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
          if (errors) { errors.hidden = false; errors.textContent = 'The message did not go through. This can be a connection issue. Please try again in a moment.'; }
        });
    });
  }

  /* ---------------------------------------------------------------------
     5. Hash landing. The browser's own jump happens before web fonts and
        images have settled, so the target can drift. Re-land once now and
        again after fonts/load, unless the visitor has scrolled meanwhile.
        `scroll-margin-top` (site.css) keeps it clear of the sticky header.
        A target inside a closed <details> opens it first.
     --------------------------------------------------------------------- */
  function hashTarget() {
    if (!location.hash) return null;
    try { return document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { return null; }
  }
  function revealTarget(t) {
    for (var el = t; el; el = el.parentElement) {
      if (el.tagName === 'DETAILS') el.open = true;
    }
  }
  function land() {
    var t = hashTarget();
    if (!t) return;
    revealTarget(t);
    t.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  if (location.hash) {
    var userMoved = false;
    var stop = function () { userMoved = true; };
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, stop, { once: true, passive: true }); });
    var reland = function () { if (!userMoved) land(); };
    land();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reland);
    window.addEventListener('load', function () { reland(); setTimeout(reland, 150); });
  }
  // In-page links keep their native (smooth) scroll; only a target hidden
  // inside a closed <details> needs opening and re-landing.
  window.addEventListener('hashchange', function () {
    var t = hashTarget();
    if (t && t.closest('details:not([open])')) land();
  });
}());
