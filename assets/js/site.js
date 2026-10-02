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

  // Calls cb once the image is loaded and decoded (immediately if cached),
  // with a short cap so a slow network never leaves a photo hidden.
  function whenReady(img, cb) {
    var done = false;
    var go = function () { if (!done) { done = true; cb(); } };
    if (!img) return go();
    var decode = function () {
      if (img.decode) img.decode().then(go, go); else go();
    };
    if (img.complete && img.naturalWidth) decode();
    else {
      img.addEventListener('load', decode, { once: true });
      img.addEventListener('error', go, { once: true });
    }
    setTimeout(go, 2500);
  }

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
    // Photos fade in only once decoded (cached images resolve at once).
    var show = function (el) {
      if (el.hasAttribute('data-reveal-img')) {
        whenReady(el.querySelector('img'), function () { el.classList.add('is-in'); });
      } else {
        el.classList.add('is-in');
      }
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    // Photos start a little earlier so they never pop in late.
    var ioImg = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target);
        ioImg.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px 4% 0px', threshold: 0 });
    targets.forEach(function (el) { (el.hasAttribute('data-reveal-img') ? ioImg : io).observe(el); });
    // Anything already on screen arrives without waiting for a scroll.
    setTimeout(function () {
      targets.forEach(function (el) {
        var b = el.getBoundingClientRect();
        if (b.top < window.innerHeight && b.bottom > 0) show(el);
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
        if (!el || !el.getClientRects().length) return;   // hidden section
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
     4. Alignment Call — day/slot picker in the visitor's own time zone.
        IST is the practice's home time zone.
     --------------------------------------------------------------------- */
  var slotsWrap = document.getElementById('call-slots');
  if (slotsWrap) {
    var IST_OFFSET_MIN = 330;
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
    renderSlots();
  }

  // "I'm not sure yet" and the five specific areas are mutually exclusive.
  document.querySelectorAll('[data-exclusive-group]').forEach(function (group) {
    var none = group.querySelector('input[data-exclusive]');
    var boxes = group.querySelectorAll('input[type="checkbox"]');
    if (!none) return;
    boxes.forEach(function (box) {
      box.addEventListener('change', function () {
        if (!box.checked) return;
        boxes.forEach(function (other) {
          if (other !== box && (box === none || other === none)) other.checked = false;
        });
      });
    });
  });

  // Group interest: ?experience=<key> preselects that experience and
  // ?event=YYYY-MM-DD (from a listed session) travels with the enquiry.
  var params = null;
  try { params = new URLSearchParams(location.search); } catch (e) {}
  if (params) {
    var expParam = params.get('experience');
    if (expParam) {
      document.querySelectorAll('input[name="experience"]').forEach(function (r) {
        if (r.dataset.key === expParam) r.checked = true;
      });
    }
    var eventParam = params.get('event');
    var eventInput = document.getElementById('g-event');
    if (eventInput && eventParam && /^\d{4}-\d{2}-\d{2}$/.test(eventParam)) {
      eventInput.value = eventParam;
      eventInput.disabled = false;
      var note = document.getElementById('g-event-note');
      if (note) {
        var d = new Date(eventParam + 'T12:00:00Z');
        var label = isNaN(d) ? eventParam : new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
        note.querySelector('span').textContent = label;
        note.hidden = false;
      }
    }
  }

  /* ---------------------------------------------------------------------
     4b. Web3Forms — one submission handler for every form[data-web3]
         (Alignment Call, Group interest, Collaboration). Each form names its
         own success panel (data-sent) and error box (data-errors); its
         subject and metadata are hidden fields in the markup. Success is
         shown only when Web3Forms explicitly accepts the submission
         (HTTP OK and success === true). On any failure the entered values
         stay in place. Without fetch, the form posts normally.
     --------------------------------------------------------------------- */
  var FAIL_MSG = 'Your message did not go through. Please try again in a moment.';
  document.querySelectorAll('form[data-web3]').forEach(function (form) {
    var sent = document.getElementById(form.getAttribute('data-sent'));
    var errors = document.getElementById(form.getAttribute('data-errors'));
    var endpoint = form.getAttribute('action') || '';
    if (typeof window.fetch !== 'function' || !/web3forms\.com/.test(endpoint)) return;
    var btn = form.querySelector('button[type="submit"]');
    var label = btn ? btn.innerHTML : '';
    var restore = function (msg) {
      if (btn) { btn.disabled = false; btn.innerHTML = label; btn.style.minWidth = ''; }
      if (errors) { errors.textContent = msg; errors.hidden = false; errors.focus(); }
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();                      // native validation has already passed
      if (errors) errors.hidden = true;
      var bot = form.querySelector('input[name="botcheck"]');
      if (bot && bot.checked) return;          // honeypot: drop silently
      if (btn) { btn.style.minWidth = btn.offsetWidth + 'px'; btn.disabled = true; btn.textContent = 'Sending…'; }
      var data = new FormData(form);
      fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: data })
        .then(function (r) {
          return r.json().catch(function () { return null; }).then(function (body) { return { ok: r.ok, body: body }; });
        })
        .then(function (res) {
          if (res.ok && res.body && res.body.success === true) {
            if (sent) {
              var first = String(data.get('name') || '').trim().split(/\s+/)[0];
              sent.querySelectorAll('[data-sent-name]').forEach(function (el) { el.textContent = first; });
              var slotEl = sent.querySelector('[data-sent-slot]');
              var slot = data.get('slot');
              if (slotEl && slot) { slotEl.hidden = false; slotEl.querySelector('span').textContent = slot; }
            }
            form.hidden = true;
            if (sent) { sent.hidden = false; sent.focus(); }
          } else {
            restore((res.body && res.body.message) ? 'Your message did not go through: ' + res.body.message : FAIL_MSG);
          }
        })
        .catch(function () {
          restore('Your message did not go through. This can be a connection issue. Please try again in a moment.');
        });
    });
  });

  /* ---------------------------------------------------------------------
     4c. Training archive strips — native horizontal scroll with snap.
         Small previous/next buttons appear on wide screens only; they are
         disabled at either end. No autoplay, no looping.
     --------------------------------------------------------------------- */
  document.querySelectorAll('[data-archive]').forEach(function (strip) {
    var track = strip.querySelector('.archive__track');
    var nav = strip.querySelector('.archive__nav');
    if (!track || !nav) return;
    var prev = nav.querySelector('[data-dir="-1"]');
    var next = nav.querySelector('[data-dir="1"]');
    var update = function () {
      var max = track.scrollWidth - track.clientWidth;
      nav.hidden = max <= 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
    };
    var step = function (dir) {
      var item = track.querySelector('.archive__item');
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      var w = item ? item.getBoundingClientRect().width + gap : track.clientWidth;
      track.scrollBy({ left: dir * w, behavior: reduce.matches ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

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
