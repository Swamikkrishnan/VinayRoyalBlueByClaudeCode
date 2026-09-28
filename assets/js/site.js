/* =========================================================================
   Vinay Swaminathan — behaviour

   Two rules hold throughout:
   1. Nothing is hidden by CSS until this file confirms the matching system
      is running. A blocked or broken script leaves every word visible.
   2. Every effect answers to prefers-reduced-motion.
   ========================================================================= */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------------------
     1. Reveals — one entrance per element, then it is left alone
     --------------------------------------------------------------------- */
  var revealSel = '[data-reveal], [data-reveal-group], .lines, .rule, .figure, .wheel-draw, ' +
                  '.word-field, .diagram-body, .diagram-cycle';
  var targets = document.querySelectorAll(revealSel);

  var showAll = function () {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('is-in'); });
  };

  if (targets.length && 'IntersectionObserver' in window && !reduce.matches) {
    try {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });

      // Only now may CSS hide anything.
      root.classList.add('reveal-ready');

      Array.prototype.forEach.call(targets, function (el) { io.observe(el); });

      // Anything already on screen arrives without waiting for a scroll.
      window.setTimeout(function () {
        Array.prototype.forEach.call(targets, function (el) {
          var b = el.getBoundingClientRect();
          if (b.top < window.innerHeight && b.bottom > 0) el.classList.add('is-in');
        });
      }, 80);

      // Safety net: never leave anything invisible.
      window.setTimeout(showAll, 4000);
    } catch (err) {
      root.classList.remove('reveal-ready');
      showAll();
    }
  } else {
    showAll();
  }

  if (typeof reduce.addEventListener === 'function') {
    reduce.addEventListener('change', function (e) {
      if (e.matches) { root.classList.remove('reveal-ready'); showAll(); }
    });
  }

  /* ---------------------------------------------------------------------
     2. Header — quieter going down, returns coming up, with a reading line
     --------------------------------------------------------------------- */
  var head = document.getElementById('site-head');
  if (head) {
    var lastY = window.scrollY;
    var ticking = false;

    var onScroll = function () {
      var y = window.scrollY;
      head.classList.toggle('is-scrolled', y > 24);

      var doc = document.documentElement;
      var max = (doc.scrollHeight - window.innerHeight) || 1;
      head.style.setProperty('--progress', Math.min(1, Math.max(0, y / max)).toFixed(4));

      var goingDown = y > lastY;
      var pastHero = y > 220;
      var menuOpen = head.classList.contains('is-open');
      head.classList.toggle('is-hidden', goingDown && pastHero && !menuOpen);

      lastY = y;
    };

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; onScroll(); });
    }, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------------------
     3. Navigation
     No JS: the nav carries no hidden attribute, so it stays open and usable.
     --------------------------------------------------------------------- */
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    var mobile = window.matchMedia('(max-width: 860px)');

    var setOpen = function (open, returnFocus) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.hidden = !open;
      if (head) head.classList.toggle('is-open', open);
      if (!open && returnFocus) toggle.focus();
    };

    var sync = function () {
      if (mobile.matches) {
        if (toggle.getAttribute('aria-expanded') !== 'true') setOpen(false, false);
      } else {
        nav.hidden = false;
        nav.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'false');
        if (head) head.classList.remove('is-open');
      }
    };

    sync();
    if (typeof mobile.addEventListener === 'function') mobile.addEventListener('change', sync);
    else if (typeof mobile.addListener === 'function') mobile.addListener(sync);
    window.addEventListener('resize', sync, { passive: true });

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true', false);
    });
    nav.addEventListener('click', function (e) {
      if (mobile.matches && e.target.closest('a')) setOpen(false, false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobile.matches && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false, true);
      }
    });
    document.addEventListener('click', function (e) {
      if (!mobile.matches || toggle.getAttribute('aria-expanded') !== 'true') return;
      if (!nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false, false);
    });
  }

  /* ---------------------------------------------------------------------
     4. FACE — four letters, one open at a time
     Fail-open: the rail is hidden and all four panels are shown until this
     runs, so the whole framework reads without JavaScript.
     --------------------------------------------------------------------- */
  var face = document.getElementById('face');
  if (face) {
    var keys = Array.prototype.slice.call(face.querySelectorAll('.face__key'));
    var panels = Array.prototype.slice.call(face.querySelectorAll('.face__panel'));

    if (keys.length && keys.length === panels.length) {
      var open = function (stage, moveFocus) {
        keys.forEach(function (k) {
          var on = k.dataset.stage === stage;
          k.setAttribute('aria-selected', on ? 'true' : 'false');
          k.tabIndex = on ? 0 : -1;
          if (on && moveFocus) k.focus();
        });
        panels.forEach(function (p) {
          var on = p.dataset.stage === stage;
          p.hidden = !on;
          if (on) {
            p.removeAttribute('data-opening');
            void p.offsetWidth;
            p.setAttribute('data-opening', '');
          }
        });
      };

      keys.forEach(function (k, i) {
        k.addEventListener('click', function () { open(k.dataset.stage, false); });
        k.addEventListener('keydown', function (e) {
          var next = null;
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = keys[(i + 1) % keys.length];
          else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = keys[(i - 1 + keys.length) % keys.length];
          else if (e.key === 'Home') next = keys[0];
          else if (e.key === 'End') next = keys[keys.length - 1];
          if (!next) return;
          e.preventDefault();
          open(next.dataset.stage, true);
        });
      });

      face.classList.add('face-ready');
      open(keys[0].dataset.stage, false);
    }
  }

  /* ---------------------------------------------------------------------
     5. Return CTA — a quiet, dismissible way back to the Alignment Call
     Fail-open: markup carries `hidden`; only shown once this runs, so with
     no JS there is no undismissable overlay.
     --------------------------------------------------------------------- */
  var recall = document.getElementById('recall');
  if (recall) {
    var STORE = 'vs-recall-dismissed';
    var dismissed = false;
    try { dismissed = window.sessionStorage.getItem(STORE) === '1'; } catch (e) {}

    if (!dismissed) {
      recall.hidden = false;
      var callSection = document.getElementById('alignment-call');
      var nearCall = false;

      var syncRecall = function () {
        var show = window.scrollY > window.innerHeight * 0.9 && !nearCall;
        recall.classList.toggle('is-shown', show);
      };

      if (callSection && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          nearCall = entries[0].isIntersecting;
          syncRecall();
        }, { rootMargin: '0px 0px -20% 0px' }).observe(callSection);
      }

      var rTicking = false;
      window.addEventListener('scroll', function () {
        if (rTicking) return;
        rTicking = true;
        window.requestAnimationFrame(function () { rTicking = false; syncRecall(); });
      }, { passive: true });
      syncRecall();

      var dismissBtn = recall.querySelector('.recall__dismiss');
      if (dismissBtn) {
        dismissBtn.addEventListener('click', function () {
          recall.classList.remove('is-shown');
          try { window.sessionStorage.setItem(STORE, '1'); } catch (e) {}
          window.setTimeout(function () { recall.hidden = true; }, 600);
        });
      }
    }
  }

  /* ---------------------------------------------------------------------
     6. Alignment Call form
     Native validation stays in charge. With JS: inline field messages, then
     a background POST to Web3Forms so the acknowledgement shows in place.
     Without JS: the form posts natively and `redirect` carries ?sent=1 back.
     --------------------------------------------------------------------- */
  var sent = document.getElementById('form-sent');
  var form = document.getElementById('alignment-form');

  if (sent && /(?:^|[?&])sent=1(?:&|$)/.test(window.location.search)) {
    sent.hidden = false;
    if (form) form.hidden = true;
    sent.setAttribute('tabindex', '-1');
    sent.focus();
  }

  var summary = document.getElementById('form-errors');
  if (form && summary) {
    var list = summary.querySelector('ul');
    var pending = [];
    var render = null;

    var labelFor = function (f) {
      if (f.getAttribute('data-error-label')) return f.getAttribute('data-error-label');
      if (f.type === 'radio' || f.type === 'checkbox') {
        var group = f.closest('fieldset');
        var legend = group && group.querySelector('legend');
        if (legend) return legend.textContent.replace('*', '').trim();
      }
      var lab = form.querySelector('label[for="' + f.id + '"]');
      return lab ? lab.textContent.replace('*', '').trim() : 'This field';
    };

    // Per-field inline message, sitting under the control it belongs to.
    var inlineFor = function (f) {
      var host = f.closest('.field') || f.closest('.consent') || f.parentNode;
      if (!host) return null;
      var node = host.querySelector('.field__error');
      if (!node) {
        node = document.createElement('p');
        node.className = 'field__error';
        node.hidden = true;
        host.appendChild(node);
      }
      return node;
    };

    var messageFor = function (f) {
      if (f.validity.valueMissing) {
        if (f.type === 'checkbox') return 'Please tick this to continue.';
        if (f.type === 'radio') return 'Please choose one.';
        return 'Please fill this in.';
      }
      if (f.validity.typeMismatch && f.type === 'email') return 'Please check the email address.';
      if (f.validity.tooLong) return 'That is a little too long.';
      return 'Please check this field.';
    };

    var markField = function (f, bad) {
      var node = inlineFor(f);
      if (f.type !== 'radio' && f.type !== 'checkbox') {
        f.setAttribute('aria-invalid', bad ? 'true' : 'false');
      }
      if (!node) return;
      if (bad) {
        node.textContent = messageFor(f);
        node.hidden = false;
        if (!node.id) node.id = (f.id || f.name) + '-error';
        f.setAttribute('aria-describedby',
          (f.getAttribute('aria-describedby') ? f.getAttribute('aria-describedby') + ' ' : '') + node.id);
      } else {
        node.hidden = true;
        node.textContent = '';
      }
    };

    var checkField = function (f) {
      if (f.type === 'hidden' || f.disabled || f.name === 'website') return;
      if (f.willValidate === false) return;
      markField(f, !f.checkValidity());
    };

    // "invalid" fires per field before the browser blocks the submit, and it
    // does not bubble — hence capture.
    form.addEventListener('invalid', function (e) {
      markField(e.target, true);
      if (pending.indexOf(e.target) === -1) pending.push(e.target);
      if (render) return;
      render = window.setTimeout(function () {
        render = null;
        var seen = {}, items = [];
        pending.forEach(function (f) {
          var key = f.name || f.id;
          if (seen[key]) return;
          seen[key] = true;
          if (!f.id) f.id = 'field-' + key;
          items.push('<li><a href="#' + f.id + '">' + labelFor(f) + '</a></li>');
        });
        pending = [];
        list.innerHTML = items.join('');
        summary.hidden = false;
      }, 0);
    }, true);

    // Re-check on the way out of a field, and live once it has been flagged.
    form.addEventListener('blur', function (e) {
      if (e.target && e.target.matches('input, textarea, select')) checkField(e.target);
    }, true);
    form.addEventListener('input', function (e) {
      var f = e.target;
      if (f && f.getAttribute('aria-invalid') === 'true') checkField(f);
    });
    form.addEventListener('change', function (e) {
      var f = e.target;
      if (f && (f.type === 'checkbox' || f.type === 'radio')) {
        var node = inlineFor(f);
        if (node && f.checkValidity()) { node.hidden = true; node.textContent = ''; }
      }
    });

    summary.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var t = document.getElementById(a.getAttribute('href').slice(1));
      if (!t) return;
      e.preventDefault();
      t.focus();
    });

    /* --- Background submit to Web3Forms --------------------------------- */
    var endpoint = form.getAttribute('action') || '';
    var canAjax = /web3forms\.com/.test(endpoint) &&
                  typeof window.fetch === 'function' &&
                  typeof window.FormData === 'function';
    var submitting = false;

    var showError = function (msg) {
      list.innerHTML = '<li>' + msg + '</li>';
      var h = summary.querySelector('h2');
      if (h) h.textContent = 'Something went wrong';
      summary.hidden = false;
      summary.setAttribute('tabindex', '-1');
      summary.focus();
    };

    form.addEventListener('submit', function (e) {
      summary.hidden = true;
      list.innerHTML = '';
      var h = summary.querySelector('h2');
      if (h) h.textContent = 'Please check a few things';

      if (!canAjax || submitting) return;          // let the native POST proceed
      if (!form.checkValidity()) return;            // "invalid" handler takes over

      // Honeypot: if it is filled, quietly pretend success.
      var hp = form.querySelector('input[name="website"]');
      if (hp && hp.value) { e.preventDefault(); reveal(); return; }

      e.preventDefault();
      submitting = true;
      var btn = form.querySelector('button[type="submit"]');
      var btnLabel = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = 'Sending&hellip;'; }

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          return { ok: r.ok, data: data };
        });
      }).then(function (res) {
        if (res.ok && (res.data.success === true || res.data.success === undefined)) {
          reveal();
        } else {
          restore(btn, btnLabel);
          showError((res.data && res.data.message) ||
            'The message did not go through. Please try again, or email vinay directly.');
        }
      }).catch(function () {
        restore(btn, btnLabel);
        showError('The message did not go through — this can be a connection issue. Please try again in a moment.');
      });
    });

    function restore(btn, label) {
      submitting = false;
      if (btn) { btn.disabled = false; btn.innerHTML = label; }
    }

    function reveal() {
      submitting = false;
      if (sent) {
        sent.hidden = false;
        form.hidden = true;
        sent.setAttribute('tabindex', '-1');
        sent.scrollIntoView({ block: 'center', behavior: reduce.matches ? 'auto' : 'smooth' });
        sent.focus();
      }
    }
  }
}());
