/* =========================================================================
   Vinay Swaminathan — behaviour (2026 redesign)
   Content is visible in plain HTML/CSS by default; this file only adds a
   one-shot entrance animation, the header/nav toggle, the interior pages'
   sticky section nav, the Approach FACE selector, the Alignment Call
   scheduler + submission, the Get in touch chooser, a settle-safe hash
   landing, and open/close motion for the native <details> accordions
   (which still work without JS).
   ========================================================================= */
(function () {
  'use strict';
  var root = document.documentElement;
  window.__siteJs = true;                 // tells the inline head script we arrived
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Calls cb once the image is loaded and decoded (immediately if cached).
  // A generous cap means a very slow network still never leaves a photo
  // hidden, without revealing half-loaded photos on ordinary connections.
  function whenReady(img, cb, cap) {
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
    setTimeout(go, cap || 8000);
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
      root.classList.toggle('nav-is-open', open);
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

  // Header: transparent at the top of the page; the translucent navy glass
  // arrives once the page has scrolled about 24px (one rAF per frame).
  var siteHead = document.getElementById('site-head');
  if (siteHead) {
    var headTick = false;
    var markScrolled = function () { headTick = false; siteHead.classList.toggle('is-scrolled', window.scrollY > 12); };
    window.addEventListener('scroll', function () {
      if (!headTick) { headTick = true; window.requestAnimationFrame(markScrolled); }
    }, { passive: true });
    window.addEventListener('pageshow', markScrolled);   // restored scroll positions
    markScrolled();
  }

  // Homepage: the moment the visitor scrolls down from the top, the hero
  // sigil flies up into the header and "Vinay Swaminathan" slides right to
  // make room, so the docked header matches every other page:
  // [sigil] Vinay Swaminathan. Back at the very top it flies home and the
  // name slides back. One fixed-length animation, identical however fast the
  // scroll. A fixed-position clone does the flying (transform + opacity
  // only); geometry is measured on load/resize, never per frame.
  var heroSig = document.querySelector('.page-home .home-hero__sigil');
  var brandImg = document.querySelector('.page-home .brand img');
  var brandName = document.querySelector('.page-home .brand__name');
  if (heroSig && brandImg && brandName) {
    var DUR = 650, EASE = 'cubic-bezier(.45, 0, .2, 1)', SHIFT = 40;
    var sigWrap = heroSig.parentNode;
    var sFly = heroSig.cloneNode(false);
    sFly.removeAttribute('fetchpriority');
    sFly.className = 'home-hero__sigil sigil-flight';
    sFly.setAttribute('aria-hidden', 'true');
    document.body.appendChild(sFly);
    var geo = null, docked = false, anims = [], token = 0, tick = false, handing = false, leaving = false, pendingFly = null;
    var past = function () { return window.scrollY > 2; };
    var X = function (on) { return on ? 'translateX(' + SHIFT + 'px)' : 'translateX(0px)'; };
    var measure = function () {
      if (anims.length) return;                       // never re-measure mid-flight
      var y = window.scrollY, sr = heroSig.getBoundingClientRect(), tr = brandImg.getBoundingClientRect();
      if (!sr.width || !tr.width) return;
      geo = { x: sr.left, y: sr.top + y, k: tr.width / sr.width, tx: tr.left, ty: tr.top };
      sFly.style.width = sr.width + 'px'; sFly.style.height = sr.height + 'px';
      if (pendingFly !== null) { var d = pendingFly; pendingFly = null; fly(d); }
    };
    var at = function (home) {
      return home ? 'translate3d(' + geo.x + 'px,' + (geo.y - window.scrollY) + 'px,0) scale(1)'
                  : 'translate3d(' + geo.tx + 'px,' + geo.ty + 'px,0) scale(' + geo.k + ')';
    };
    var cancelAll = function () {
      anims.forEach(function (an) { an.cancel(); }); anims = [];
      [sFly, brandName].forEach(function (el) { if (el.getAnimations) el.getAnimations().forEach(function (an) { an.cancel(); }); });
    };
    var rest = function (d) {                       // the settled state, no clone
      sFly.style.opacity = '0';
      heroSig.style.opacity = d ? '0' : '';
      sigWrap.style.setProperty('--glow-o', d ? '0' : '1');
      brandImg.style.opacity = d ? '1' : '0';
      brandName.style.opacity = '1';
      brandName.style.transform = d ? X(true) : '';
    };
    var fly = function (toDock, onDone) {
      if (!geo) measure();
      if (reduce.matches) { cancelAll(); rest(toDock); if (onDone) onDone(); return; }
      if (!geo) { pendingFly = toDock; return; }
      var my = ++token;
      var mid = anims.length > 0;
      // Scrolled during the opening: the copy starts at however far the hero
      // sigil has faded in, and the hero's opening completes underneath.
      var sO = mid ? 1 : +window.getComputedStyle(sigWrap).opacity;
      sigWrap.style.transition = 'none'; sigWrap.classList.add('is-in');
      heroSig.style.transition = 'none';
      var fromT = mid ? window.getComputedStyle(sFly).transform : at(toDock);
      var fromN = window.getComputedStyle(brandName).transform;
      if (!fromN || fromN === 'none') fromN = X(false);
      cancelAll();
      heroSig.style.opacity = '0'; brandImg.style.opacity = '0';
      sigWrap.style.setProperty('--glow-o', toDock ? '0' : '1');
      sFly.style.transform = fromT;
      sFly.style.opacity = toDock && sO < .99 ? String(sO) : '1';
      anims.push(sFly.animate([{ transform: fromT }, { transform: at(!toDock) }], { duration: DUR, easing: EASE, fill: 'forwards' }));
      if (toDock && sO < .99) anims.push(sFly.animate([{ opacity: sO }, { opacity: 1, offset: .45 }, { opacity: 1 }], { duration: DUR, fill: 'forwards' }));
      anims.push(brandName.animate([{ transform: fromN }, { transform: X(toDock) }], { duration: DUR, easing: EASE, fill: 'forwards' }));
      anims[0].onfinish = function () {
        if (my !== token) return;
        cancelAll();
        rest(toDock);                                  // same frame as the clone leaves: no flash
        if (onDone) onDone();
      };
    };
    var check = function () {
      tick = false;
      if (handing) return;                           // a page hand-off is running; it settles itself
      var want = past();
      if (want !== docked) { docked = want; fly(want); }
    };
    window.addEventListener('scroll', function () {
      if (!tick) { tick = true; window.requestAnimationFrame(check); }
    }, { passive: true });
    var remeasure = function () { measure(); if (!anims.length && !handing) rest(docked); };
    window.addEventListener('resize', remeasure);
    window.addEventListener('orientationchange', function () { setTimeout(remeasure, 120); });
    window.addEventListener('load', function () { remeasure(); setTimeout(remeasure, 1600); setTimeout(remeasure, 3200); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);

    // Page switches. The docked header already matches other pages, so only
    // leaving from the top needs a hand-off (the sigil rises, the name steps
    // aside); arriving at the top plays it in reverse.
    var isHome = function (path) { return /(^|\/)(index\.html)?$/.test(path); };
    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('a[href]');
      if (!link || leaving || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (link.target === '_blank' || link.hasAttribute('download') || link.hasAttribute('data-contact-open')) return;
      var url = new URL(link.href, location.href);
      if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
      if (isHome(url.pathname)) {                        // Home / the name, from the homepage itself
        if (url.hash || window.scrollY < 3) return;
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
        return;
      }
      if (docked && !anims.length) return;              // header already matches the next page
      if (reduce.matches || !geo) return;               // plain navigation
      e.preventDefault(); leaving = true; handing = true;
      fly(true, function () { location.href = url.href; });
    });
    var settle = function () {
      cancelAll();
      handing = false;
      docked = past();
      rest(docked);
    };
    window.addEventListener('pageshow', function (e) {   // back to a cached homepage: settle cleanly
      if (!e.persisted) return;
      leaving = false; token++; settle();
    });
    var cameFromPage = false;
    try {
      var ref = document.referrer ? new URL(document.referrer) : null;
      cameFromPage = !!ref && ref.origin === location.origin && !isHome(ref.pathname);
      // Only a real link click from another page counts: a refresh or Back /
      // Forward keeps the old referrer, but should open like a fresh visit.
      var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
      if (nav.type && nav.type !== 'navigate') cameFromPage = false;
    } catch (err) { cameFromPage = false; }
    docked = past();
    rest(docked); measure();
    if (cameFromPage && !reduce.matches && !docked && !location.hash) {
      // Start as the previous page ended — [sigil] Vinay Swaminathan — then,
      // once the page has settled, the sigil drops into the hero.
      handing = true;
      rest(true);
      sigWrap.style.transition = 'none'; sigWrap.style.opacity = '1'; sigWrap.style.transform = 'none';
      var arrive = function () {
        measure();
        if (!geo || past()) return settle();
        docked = true;
        fly(false, function () { handing = false; docked = past(); if (docked) fly(true); });
      };
      var whenSettled = function () {
        (typeof assetsReady !== 'undefined' ? assetsReady : Promise.resolve()).then(function () {
          window.requestAnimationFrame(function () { window.requestAnimationFrame(arrive); });
        });
      };
      if (document.readyState === 'complete') whenSettled();
      else window.addEventListener('load', whenSettled, { once: true });
    }
  }


  /* ---------------------------------------------------------------------
     1b. Accordions — animate native <details> open and close (height,
         opacity and a 4px settle). Rapid clicks reverse from the current
         height; nothing is left with a fixed height afterwards, so resizing
         an open accordion is safe. Reduced motion: native instant toggle.
     --------------------------------------------------------------------- */
  // Some disclosures start open on wider screens only (1:1 Availability, Scope).
  if (window.matchMedia('(min-width: 769px)').matches) {
    document.querySelectorAll('details[data-open-desktop]').forEach(function (d) { d.open = true; });
  }
  var ACC_MS = 444, ACC_EASE = 'cubic-bezier(.3,.7,.3,1)';   // calm, same speed open and close
  // Lists of parallel options (marked data-one-open: the 1:1 sessions and
  // immersions, the Background qualification lists) keep one item open at a
  // time. Narrative "Read more" sections (Approach, Story) and the reference
  // panels stay independent on purpose.
  var setAcc = function (d, open, animate) {
    if (d._acc) d._acc(open, animate); else d.open = open;
  };
  var pinWhile = function (el, ms) {        // keep el still while something above it collapses
    var top = el.getBoundingClientRect().top, end = performance.now() + ms + 60;
    var step = function () {
      var dy = el.getBoundingClientRect().top - top;
      if (Math.abs(dy) > .5) window.scrollBy(0, dy);
      if (performance.now() < end) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  };
  var closeSiblings = function (d, animate) {
    var group = d.parentElement && d.closest('[data-one-open]');
    if (!group) return;
    var closed = false;
    group.querySelectorAll('details.accordion').forEach(function (o) {
      if (o !== d && o.open && !o.classList.contains('is-closing') && o.closest('[data-one-open]') === group) { setAcc(o, false, animate); closed = true; }
    });
    if (closed && animate) pinWhile(d.querySelector(':scope > summary') || d, ACC_MS);
  };
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
    d._acc = function (open, animate) {
      var isOpen = d.open && !d.classList.contains('is-closing');
      if (open === isOpen) return;
      if (!animate || reduce.matches) {
        if (anim) anim.cancel();
        finish(open);
        return;
      }
      var closing = !open;
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
    };
    summary.addEventListener('click', function (e) {
      e.preventDefault();
      var opening = !(d.open && !d.classList.contains('is-closing'));
      if (opening) closeSiblings(d, true);
      d._acc(opening, true);
    });
  });
  // A link to a session (#body … on the 1:1 page, from the homepage or from
  // within the page) opens that session's details and closes any other.
  var openForTarget = function (t, animate) {
    if (!t || !t.closest('[data-one-open]')) return;
    var d = t.matches('details.accordion') ? t : t.querySelector('details.accordion');
    if (!d || d.closest('[data-one-open]') !== t.closest('[data-one-open]')) return;
    closeSiblings(d, animate);
    setAcc(d, true, animate);
  };
  var hashEl = function () {
    if (!location.hash) return null;
    try { return document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { return null; }
  };
  openForTarget(hashEl(), false);
  window.addEventListener('pageshow', function (e) { if (e.persisted) openForTarget(hashEl(), false); });
  window.addEventListener('hashchange', function () { openForTarget(hashEl(), true); });
  document.addEventListener('click', function (e) {           // same hash clicked again: no hashchange fires
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a && a.getAttribute('href') === location.hash) openForTarget(hashEl(), true);
  });

  /* ---------------------------------------------------------------------
     1b. Background assets — preload only the textures this page uses (each
         field, its transition art, the five-area connector), then add
         .assets-ready so the CSS fades them in. A 1.3s cap means a slow or
         failed request never leaves the page bare.
     --------------------------------------------------------------------- */
  var assetsReady = new Promise(function (resolve) {
    var finish = function () { root.classList.add('assets-ready'); resolve(); };
    setTimeout(finish, 1300);
    var urls = {};
    var collect = function (el, pseudo) {
      var bi = window.getComputedStyle(el, pseudo).backgroundImage || '';
      bi.replace(/url\(["']?([^"')]+)["']?\)/g, function (m, u) { urls[u] = true; return m; });
    };
    Array.prototype.forEach.call(document.querySelectorAll('.bg-1, .bg-2, .bg-3, .bg-4'), function (el) {
      collect(el, null); collect(el, '::before'); collect(el, '::after');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.areas'), function (el) { collect(el, '::before'); });
    var list = Object.keys(urls), left = list.length;
    if (!left) return finish();
    list.forEach(function (u) {
      var im = new Image();
      im.onload = im.onerror = function () { if (--left === 0) finish(); };
      im.src = u;
    });
  });

  // Photographs keep their space and fade in once decoded (CSS holds them at 0).
  Array.prototype.forEach.call(document.querySelectorAll('.editorial__media img, .story__portrait img'), function (img) {
    whenReady(img, function () { img.classList.add('is-loaded'); });
  });

  /* ---------------------------------------------------------------------
     2. Reveal engine — IntersectionObserver adds .is-in once; the CSS in
        motion-ready mode uses that to transition from a JS-added start
        state. Nothing is hidden until root carries .motion-ready.
     --------------------------------------------------------------------- */
  // One photo rule for the whole site (figure[data-reveal-img]): a photo
  // fades in only when it is near view,
  // fully loaded and decoded, and after any section fade around it has
  // finished. So every photo gets the identical fade on every device and
  // connection, cached or not.
  var T0 = performance.now();
  if (!reduce.matches && 'IntersectionObserver' in window) {
    root.classList.add('motion-ready');
    var targets = document.querySelectorAll('[data-reveal], [data-seq], [data-reveal-img]');
    // Cascade: the readable blocks inside each section, in reading order.
    // Layout wrappers are opened up; lists, figures, dropdowns, forms,
    // and other composed pieces count as one block each.
    var KEEP = 'p,h1,h2,h3,h4,ul,ol,dl,figure,details,form,svg,a,button,.btn-row,[data-stagger],.face,.accordion-group,.metrics,.quad,.pair,.form-sent,.form-errors,.link-list,.sessions,.contact-form';
    document.querySelectorAll('[data-reveal]').forEach(function (box) {
      var items = [];
      var collect = function (el, depth) {
        Array.prototype.forEach.call(el.children, function (c) {
          if (c.hasAttribute('data-reveal-img') || c.hasAttribute('data-reveal') || c.tagName === 'SCRIPT') return;
          if (depth < 4 && !c.matches(KEEP) && c.children.length > 1) collect(c, depth + 1);
          else items.push(c);
        });
      };
      collect(box, 0);
      if (!items.length) items = [box];
      // Start times in reading order: a block waits for the one above it, and
      // for every item of a staggered list above it.
      var cs = getComputedStyle(document.documentElement);
      var step = parseFloat(cs.getPropertyValue('--cascade')) || 160;
      var stag = parseFloat(cs.getPropertyValue('--stagger')) || 120;
      var at = 0, CAP = 900;   // long sections never keep their last block waiting
      items.forEach(function (it) {
        it.classList.add('rv-item');
        it.style.setProperty('--cd', Math.round(Math.min(at, CAP)) + 'ms');
        var list = it.matches('[data-stagger]') ? it : null;
        at += step + (list ? 100 + Math.max(0, Math.min(list.children.length, 7) - 1) * stag : 0);
      });
      box.dataset.span = Math.round(Math.min(at, CAP));
      box.classList.add('rv-ready');
    });
    // Page openings: each line a beat after the one before, in reading order.
    var SEQ_STEP = 170, seqCount = 0;
    document.querySelectorAll('main section').forEach(function (sec) {
      var lines = sec.querySelectorAll('[data-seq]');
      if (lines.length && !seqCount) seqCount = lines.length;
      // A line may name its own moment (data-seq-at, ms): the homepage hero runs
      // sigil, then title, then subtitle, whatever the DOM order.
      lines.forEach(function (el, i) { el.style.setProperty('--sd', (el.hasAttribute('data-seq-at') ? +el.getAttribute('data-seq-at') : i * SEQ_STEP) + 'ms'); });
    });
    var OPENING_PHOTO = SEQ_STEP * Math.max(0, Math.min(seqCount, 5) - 1) + 160;  // after the last line starts (from T0)
    // Stagger index for list / grid items (capped so long lists stay calm).
    document.querySelectorAll('[data-stagger]').forEach(function (list) {
      Array.prototype.forEach.call(list.children, function (item, i) { item.style.setProperty('--i', Math.min(i, 6)); });
    });
    var msOf = function (el) {
      var v = getComputedStyle(el).getPropertyValue('--rv-dur').trim();
      return v ? parseFloat(v) * (/ms$/.test(v) ? 1 : 1000) : 555;
    };
    var reveal = function (el) {
      if (el.classList.contains('is-in')) return;
      el.dataset.inAt = Date.now();
      el.classList.add('is-in');
    };
    // Sections that start together go one after another (top to bottom), so
    // their cascades never interleave. The wait is capped to stay responsive.
    var nextSlot = 0;
    var revealSection = function (el) {
      if (el.classList.contains('is-in') || el.dataset.queued) return;
      // ...but never more than 600ms behind: a fast fling never leaves text waiting.
      var now = Date.now(), start = Math.max(now, Math.min(nextSlot, now + 600));
      nextSlot = start + Math.min(1400, Number(el.dataset.span) || 160);
      if (start - now < 20) return reveal(el);
      el.dataset.queued = '1';
      setTimeout(function () { reveal(el); }, start - now);
    };
    // A photo inside a revealing section waits for that section's own fade;
    // a standalone photo (page openings) follows its text a beat later.
    var showPhoto = function (fig, extra) {
      if (fig.dataset.pending) return;
      fig.dataset.pending = '1';
      whenReady(fig.querySelector('img'), function () {
        var parent = fig.parentElement;
        var host = parent && (parent.closest('[data-reveal]') || parent.querySelector(':scope > [data-reveal]'));
        var go = function () { window.requestAnimationFrame(function () { reveal(fig); }); };
        var wait = 200;
        var seqs = !host && fig.closest('section') ? fig.closest('section').querySelectorAll('[data-seq]') : [];
        if (seqs.length) {
          // opening lines start 220ms apart from ~80ms after load; the photo follows the last
          wait = OPENING_PHOTO - (performance.now() - T0);
        } else if (host) {
          // never start a section early on a photo's account: wait for its text
          if (!host.classList.contains('is-in')) { setTimeout(function () { fig.dataset.pending = ''; showPhoto(fig, extra); }, 150); return; }
          var first = host.querySelector('.rv-item');
          var above = first && fig.getBoundingClientRect().top < first.getBoundingClientRect().top - 40;
          wait = (above ? 0 : msOf(host) * 0.6) - (Date.now() - Number(host.dataset.inAt || 0));
        }
        wait = Math.max(0, wait) + (extra || 0);
        if (wait > 0) setTimeout(go, wait); else go();
      });
    };
    var opening = true;                       // until the opening pass has run
    var endOpening = function () {
      if (!opening) return;
      opening = false;
      targets.forEach(function (el) {                    // anything scrolled to meanwhile
        if (el.hasAttribute('data-reveal-img') || el.classList.contains('is-in')) return;
        var b = el.getBoundingClientRect();
        if (b.top < window.innerHeight * 0.88 && b.bottom > 0) { if (el.hasAttribute('data-seq')) reveal(el); else revealSection(el); }
      });
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (opening && !entry.target.hasAttribute('data-seq')) return;  // handled by the opening pass
        if (entry.target.hasAttribute('data-seq')) reveal(entry.target); else revealSection(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    // Photos start a little earlier.
    var photoIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        showPhoto(entry.target);
        photoIO.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px 4% 0px', threshold: 0 });
    targets.forEach(function (el) {
      if (!el.hasAttribute('data-reveal-img')) io.observe(el);
      else photoIO.observe(el);
    });
    // Anything already on screen arrives without waiting for a scroll: the
    // page opening (data-seq) first, then any section below it that is also
    // in view, after the opening has had its moment.
    // The opening waits for the page to settle (web fonts and the first heavy
    // frame of layout and image decoding), so its first fade is never lost in
    // a dropped frame. T0 marks the moment it begins.
    var afterSettle = function (fn) {
      var go = function () { window.requestAnimationFrame(function () { window.requestAnimationFrame(fn); }); };
      var done = false, once = function () {
        if (done) return; done = true;
        // Texture first, then the words. The homepage hero lets its background
        // fade most of the way in before the sigil appears.
        assetsReady.then(function () { setTimeout(go, document.querySelector('.page-home') ? 420 : 180); });
      };
      // The first heavy frame ends just before the load event; cap the wait
      // so a slow image never holds the opening back.
      if (document.readyState === 'complete') once();
      else window.addEventListener('load', once, { once: true });
      setTimeout(once, 900);
    };
    afterSettle(function () {
      T0 = performance.now();
      setTimeout(endOpening, OPENING_PHOTO + 150);
      var seqShown = false;
      targets.forEach(function (el) {
        if (el.hasAttribute('data-reveal-img')) return;   // photos have their own path
        var b = el.getBoundingClientRect();
        if (!(b.top < window.innerHeight && b.bottom > 0)) return;
        if (el.hasAttribute('data-seq')) { reveal(el); seqShown = true; }
      });
      setTimeout(function () {
        targets.forEach(function (el) {
          if (el.hasAttribute('data-reveal-img') || el.hasAttribute('data-seq')) return;
          var b = el.getBoundingClientRect();
          if (b.top < window.innerHeight && b.bottom > 0) revealSection(el);
        });
      }, seqShown ? SEQ_STEP * Math.max(0, Math.min(seqCount, 5) - 1) : 0);   // as the last opening line begins
    });
    // Safety net: text already scrolled past (e.g. after a jump link) is never
    // left invisible. Content further down keeps its normal fade.
    setTimeout(function () {
      targets.forEach(function (el) {
        if (el.hasAttribute('data-reveal-img')) return;
        if (el.getBoundingClientRect().top < window.innerHeight) reveal(el);
      });
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
            else if (itemR + pad + 36 > bar.scrollLeft + bar.clientWidth) target = itemR + pad + 36 - bar.clientWidth;   // clear the more-arrow
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

    // Phones / tablets: show when more sections sit off-screen (edge fade and
    // a brass arrow that slides the bar along); otherwise keep it plain.
    var bar = subnav.querySelector('ul');
    var more = document.createElement('button');
    more.type = 'button';
    more.className = 'subnav__more';
    more.setAttribute('aria-label', 'More sections');
    more.innerHTML = '<span aria-hidden="true">&rsaquo;</span>';
    subnav.appendChild(more);
    var markBar = function () {
      var max = bar.scrollWidth - bar.clientWidth;
      subnav.classList.toggle('has-more', max > 4 && bar.scrollLeft < max - 4);
      subnav.classList.toggle('is-scrolled', bar.scrollLeft > 4);
    };
    more.addEventListener('click', function () {
      bar.scrollBy({ left: Math.round(bar.clientWidth * 0.7), behavior: reduce.matches ? 'auto' : 'smooth' });
    });
    bar.addEventListener('scroll', function () { window.requestAnimationFrame(markBar); }, { passive: true });
    window.addEventListener('resize', markBar);
    markBar();
  }

  /* ---------------------------------------------------------------------
     3b. FACE (Approach) — desktop: a centred F A C E row with the chosen
         letter's panel below; phones: a letter rail on the left, the panel
         on the right. Real disclosure buttons (aria-expanded); nothing
         is open until the visitor chooses a letter, and choosing the open
         letter closes it again. Without JS the four panels stay stacked
         and fully readable, and the rail stays hidden.
     --------------------------------------------------------------------- */
  var face = document.querySelector('[data-face]');
  if (face) {
    var rail = face.querySelector('.face__rail');
    var hint = face.querySelector('.face__hint');
    var btns = Array.prototype.slice.call(face.querySelectorAll('.face__btn'));
    var panels = btns.map(function (b) { return document.getElementById(b.getAttribute('aria-controls')); });
    panels.forEach(function (p, i) { p.setAttribute('role', 'region'); p.setAttribute('aria-labelledby', btns[i].id); });
    var current = -1;
    var open = function (i) {
      current = i;
      btns.forEach(function (b, k) {
        b.setAttribute('aria-expanded', k === i ? 'true' : 'false');
        b.classList.toggle('is-active', k === i);
        panels[k].hidden = k !== i;
      });
      face.classList.toggle('has-open', i >= 0);
    };
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { open(current === i ? -1 : i); });
      b.addEventListener('keydown', function (e) {   // arrows move between letters
        var n = btns.length, k = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') k = (i + 1) % n;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') k = (i - 1 + n) % n;
        if (k !== null) { e.preventDefault(); btns[k].focus(); }
      });
    });
    rail.hidden = false;
    if (hint) hint.hidden = false;
    face.classList.add('is-js');
    open(0);   // F is open on arrival, on every screen size
  }

  /* ---------------------------------------------------------------------
     4. Form helpers. A fieldset[data-require-one] needs at least one box
        ticked (native validation message on the first box).
     --------------------------------------------------------------------- */
  document.querySelectorAll('fieldset[data-require-one]').forEach(function (set) {
    var boxes = set.querySelectorAll('input[type="checkbox"]');
    var check = function () {
      var any = Array.prototype.some.call(boxes, function (b) { return b.checked; });
      boxes[0].setCustomValidity(any ? '' : set.getAttribute('data-require-one'));
    };
    boxes.forEach(function (b) { b.addEventListener('change', check); });
    check();
  });

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
      // Fields in form order. A fieldset[data-join="Label"] is sent as one
      // readable line ("Monday, Wednesday, Saturday"), not raw repeated values.
      var data = new FormData();
      var joined = [];
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.disabled || el.type === 'submit') return;
        var set = el.closest('fieldset[data-join]');
        if (set) {
          if (joined.indexOf(set) > -1) return;
          joined.push(set);
          var picked = Array.prototype.filter.call(set.querySelectorAll('input:checked'), Boolean)
            .map(function (b) { return b.value; });
          data.append(set.getAttribute('data-join'), picked.length ? picked.join(', ') : 'Not specified');
          return;
        }
        if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
        data.append(el.name, el.value);
      });
      fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: data })
        .then(function (r) {
          return r.json().catch(function () { return null; }).then(function (body) { return { ok: r.ok, body: body }; });
        })
        .then(function (res) {
          if (res.ok && res.body && res.body.success === true) {
            if (sent) {
              var first = String(data.get('name') || '').trim().split(/\s+/)[0];
              sent.querySelectorAll('[data-sent-name]').forEach(function (el) { el.textContent = first; });
              var availEl = sent.querySelector('[data-sent-availability]');
              var days = data.get('Preferred days'), time = data.get('Preferred time');
              if (availEl && days && time) { availEl.hidden = false; availEl.querySelector('span').textContent = days + ' · ' + time; }
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
     4d. Get in touch — one persistent, understated contact entry. A small
         pill (on every page, the forms included)
         and any [data-contact-open] link open a short chooser: a modal
         <dialog> (popover on wide screens, bottom sheet on phones). Escape,
         the close button or the backdrop close it; focus returns to the
         control that opened it. Without JS the links simply go to the
         Alignment Call form.
     --------------------------------------------------------------------- */
  var CHOICES = [['1:1 work', 'alignment.html'], ['Group experiences', 'group-interest.html'], ['Collaboration', 'collaborate.html']];
  var sheet = document.createElement('dialog');
  if (typeof sheet.showModal === 'function') {
    sheet.className = 'contact-sheet';
    sheet.setAttribute('aria-labelledby', 'contact-q');
    sheet.innerHTML = '<div class="contact-sheet__panel">' +
      '<button type="button" class="contact-sheet__close" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
      '<h2 class="contact-sheet__q" id="contact-q">What are you reaching out about?</h2>' +
      '<ul class="contact-sheet__choices">' + CHOICES.map(function (c) {
        return '<li><a href="' + c[1] + '">' + c[0] + ' <span aria-hidden="true">&rarr;</span></a></li>';
      }).join('') + '</ul></div>';
    document.body.appendChild(sheet);
    var opener = null, closeTimer = null;
    var openSheet = function (from) {
      if (sheet.open) return;
      clearTimeout(closeTimer);
      opener = from || document.activeElement;
      root.classList.add('contact-open');
      sheet.showModal();
      // Focus the question (not a choice), so no option looks preselected.
      var q = sheet.querySelector('#contact-q'); q.setAttribute('tabindex', '-1'); q.focus({ preventScroll: true });
      window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { sheet.classList.add('is-shown'); }); });
    };
    var closeSheet = function () {
      if (!sheet.open) return;
      sheet.classList.remove('is-shown');
      var done = function () {
        sheet.close();
        root.classList.remove('contact-open');
        if (opener && document.contains(opener) && opener.focus) opener.focus();
      };
      closeTimer = setTimeout(done, reduce.matches ? 0 : 333);
    };
    sheet.addEventListener('cancel', function (e) { e.preventDefault(); closeSheet(); });   // Escape
    // Keep Tab inside the sheet in every browser (Safari's Tab skips links
    // by default, which would otherwise let focus leave a modal dialog).
    sheet.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = Array.prototype.slice.call(sheet.querySelectorAll('a[href], button'));
      var i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    });
    sheet.querySelector('.contact-sheet__close').addEventListener('click', closeSheet);
    sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });   // backdrop
    // Leaving for a form, then coming back (bfcache): never return to an open sheet.
    window.addEventListener('pageshow', function () { root.classList.remove('is-leaving'); if (sheet.open) { sheet.classList.remove('is-shown'); sheet.close(); root.classList.remove('contact-open'); } });
    // Choosing an option: the sheet and page fade out, then the form opens
    // (and fades in with its own page opening).
    sheet.querySelectorAll('.contact-sheet__choices a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || reduce.matches) return;
        e.preventDefault();
        sheet.classList.remove('is-shown');
        root.classList.add('is-leaving');
        setTimeout(function () { window.location.href = a.href; }, 333);
      });
    });
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-contact-open]');
      if (!t) return;
      e.preventDefault();
      openSheet(t.closest('.nav-mobile') ? toggle : t);
    });
    {
      var pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'contact-pill';
      pill.setAttribute('data-contact-open', '');
      pill.setAttribute('aria-haspopup', 'dialog');
      pill.textContent = 'Get in touch';
      document.body.appendChild(pill);
      document.body.classList.add('has-contact-pill');
      // The footer stays slim: the pill steps aside while it is on screen.
      var foot = document.querySelector('.site-foot');
      if (foot && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          root.classList.toggle('foot-in-view', entries[0].isIntersecting);
        }).observe(foot);
      }
    }
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
