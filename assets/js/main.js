/* ==========================================================================
   Rich Exotic Rentals — page behaviour
   Depends on assets/js/config.js (window.RER_CONFIG)
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.RER_CONFIG || {};
  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------------------
     Analytics — loaded only when an ID is configured, so an unconfigured
     site makes zero third-party requests.
     ---------------------------------------------------------------------- */
  function loadAnalytics() {
    if (CFG.googleAnalyticsId) {
      var ga = document.createElement('script');
      ga.async = true;
      ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CFG.googleAnalyticsId);
      document.head.appendChild(ga);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', CFG.googleAnalyticsId);
    }

    if (CFG.metaPixelId) {
      /* eslint-disable */
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      window.fbq('init', CFG.metaPixelId);
      window.fbq('track', 'PageView');
    }
  }

  // Fire a conversion event on both platforms, when either is present.
  function track(name, params) {
    params = params || {};
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
    if (typeof window.fbq === 'function') {
      var standard = { Lead: 1, Contact: 1, Schedule: 1 };
      if (standard[name]) window.fbq('track', name, params);
      else window.fbq('trackCustom', name, params);
    }
  }

  /* ----------------------------------------------------------------------
     Contact details — a single source of truth in config.js
     ---------------------------------------------------------------------- */
  function applyConfig() {
    var telHref = CFG.phoneE164 ? 'tel:' + CFG.phoneE164 : null;
    var smsNum  = CFG.smsE164 || CFG.phoneE164;
    // iOS wants sms:number&body=, everything else wants sms:number?body=
    var smsSep  = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) ? '&' : '?';
    var smsHref = smsNum
      ? 'sms:' + smsNum + (CFG.smsBody ? smsSep + 'body=' + encodeURIComponent(CFG.smsBody) : '')
      : null;

    if (telHref) {
      $$('[data-role="call-link"]').forEach(function (el) {
        el.setAttribute('href', telHref);
      });
    }
    if (smsHref) {
      $$('[data-role="sms-link"]').forEach(function (el) {
        el.setAttribute('href', smsHref);
      });
    }
    if (CFG.email) {
      $$('[data-role="email-link"]').forEach(function (el) {
        el.setAttribute('href', 'mailto:' + CFG.email);
      });
      $$('[data-role="email-display"]').forEach(function (el) { el.textContent = CFG.email; });
    }
    if (CFG.phoneDisplay) {
      $$('[data-role="phone-display"]').forEach(function (el) { el.textContent = CFG.phoneDisplay; });
    }
    if (CFG.serviceArea) {
      $$('[data-role="service-area"]').forEach(function (el) { el.textContent = CFG.serviceArea; });
    }
    if (CFG.instagram) {
      $$('[data-role="instagram-link"]').forEach(function (el) { el.setAttribute('href', CFG.instagram); });
    }
    if (CFG.facebook) {
      $$('[data-role="facebook-link"]').forEach(function (el) { el.setAttribute('href', CFG.facebook); });
    }

    var year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ----------------------------------------------------------------------
     Header + sticky CTA
     ---------------------------------------------------------------------- */
  function initChrome() {
    var header = $('#siteHeader');
    var sticky = $('#stickyCta');
    var hero   = $('.hero');

    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      if (header) header.classList.toggle('is-stuck', y > 24);
      if (sticky) {
        var trigger = hero ? hero.offsetHeight * 0.6 : 480;
        sticky.classList.toggle('is-visible', y > trigger);
      }
    }

    // Reserve space at the bottom of the page so the sticky bar never
    // covers the last line of the footer on mobile.
    function sizeSticky() {
      if (!sticky) return;
      var h = window.innerWidth < 768 ? sticky.offsetHeight : 0;
      document.documentElement.style.setProperty('--sticky-h', h + 'px');
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', sizeSticky);
    sizeSticky();
    onScroll();
  }

  /* ----------------------------------------------------------------------
     Scroll reveal
     ---------------------------------------------------------------------- */
  function initReveal() {
    var targets = $$('[data-reveal]');
    if (!targets.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------------------
     CTA wiring — clicking a vehicle button pre-selects it in the form
     ---------------------------------------------------------------------- */
  function initCtas() {
    var vehicleSelect = $('#vehicle');

    $$('[data-cta]').forEach(function (el) {
      el.addEventListener('click', function () {
        track('cta_click', { cta: el.getAttribute('data-cta') });
        if (/call|text/.test(el.getAttribute('data-cta') || '')) track('Contact');
      });
    });

    $$('[data-vehicle]').forEach(function (el) {
      el.addEventListener('click', function () {
        if (!vehicleSelect) return;
        vehicleSelect.value = el.getAttribute('data-vehicle');
        flash(vehicleSelect);
      });
    });

    var priorityBtn = $('[data-priority]');
    if (priorityBtn) {
      priorityBtn.addEventListener('click', function () {
        var notes = $('#notes');
        if (notes && !notes.value) {
          notes.value = 'Please add me to the priority list for upcoming vehicles.';
        }
        if (vehicleSelect) flash(vehicleSelect);
      });
    }

    function flash(el) {
      // Draw the eye to the field the click just filled in.
      window.setTimeout(function () {
        el.style.transition = 'box-shadow .5s ease';
        el.style.boxShadow = '0 0 0 3px rgba(201,162,39,.35)';
        window.setTimeout(function () { el.style.boxShadow = ''; }, 1400);
      }, 650);
    }
  }

  /* ----------------------------------------------------------------------
     Booking form
     ---------------------------------------------------------------------- */
  function initForm() {
    var form = $('#bookingForm');
    if (!form) return;

    var statusBox   = $('#formStatus');
    var successBox  = $('#formSuccess');
    var recap       = $('#successRecap');
    var submitBtn   = form.querySelector('button[type="submit"]');
    var submitLabel = form.querySelector('[data-submit-label]');
    var resetBtn    = $('#resetForm');

    var pickup      = $('#pickupDate');
    var ret         = $('#returnDate');
    var fulfilment  = $('#fulfilment');
    var deliveryFld = $('#deliveryField');
    var deliveryIn  = $('#deliveryAddress');
    var ageIn       = $('#driverAge');

    var minAge     = Number(CFG.minimumDriverAge) || 21;
    var leadDays   = Number(CFG.minimumLeadTimeDays) || 0;
    var maxDays    = Number(CFG.maximumRentalDays) || 90;

    /* --- Date bounds --------------------------------------------------- */
    function toISO(d) {
      return d.getFullYear() + '-' +
             String(d.getMonth() + 1).padStart(2, '0') + '-' +
             String(d.getDate()).padStart(2, '0');
    }
    var earliest = new Date();
    earliest.setHours(0, 0, 0, 0);
    earliest.setDate(earliest.getDate() + leadDays);
    if (pickup) pickup.min = toISO(earliest);
    if (ret) ret.min = toISO(earliest);

    if (pickup && ret) {
      pickup.addEventListener('change', function () {
        ret.min = pickup.value || toISO(earliest);
        // Keep the range coherent rather than making the visitor fix it.
        if (ret.value && ret.value < pickup.value) ret.value = pickup.value;
        clearError(ret);
      });
    }

    /* --- Conditional delivery address ---------------------------------- */
    function syncDelivery() {
      var wantsDelivery = fulfilment && /delivery/i.test(fulfilment.value);
      if (!deliveryFld) return;
      deliveryFld.classList.toggle('is-visible', !!wantsDelivery);
      if (deliveryIn) {
        deliveryIn.required = !!wantsDelivery;
        if (!wantsDelivery) { deliveryIn.value = ''; clearError(deliveryIn); }
      }
    }
    if (fulfilment) fulfilment.addEventListener('change', syncDelivery);
    syncDelivery();

    /* --- Validation ---------------------------------------------------- */
    function fieldOf(input) { return input.closest('.field'); }

    function setError(input, message) {
      var field = fieldOf(input);
      if (!field) return;
      field.classList.add('has-error');
      input.setAttribute('aria-invalid', 'true');
      if (message) {
        var slot = field.querySelector('[data-error-slot]') || field.querySelector('.field-error span');
        if (slot) slot.textContent = message;
      }
    }

    function clearError(input) {
      var field = fieldOf(input);
      if (!field) return;
      field.classList.remove('has-error');
      input.removeAttribute('aria-invalid');
    }

    function validateField(input) {
      var v = (input.value || '').trim();

      if (input.required && !v) { setError(input); return false; }
      if (!v) { clearError(input); return true; }

      if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) {
        setError(input); return false;
      }

      if (input.type === 'tel') {
        var digits = v.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 15) { setError(input); return false; }
      }

      if (input === ageIn) {
        var age = Number(v);
        if (!Number.isFinite(age) || age < minAge) {
          setError(input, 'Our minimum driver age is ' + minAge + '. Contact us if you have questions.');
          return false;
        }
        if (age > 99) { setError(input, 'Please enter a valid age.'); return false; }
      }

      if (input === ret && pickup && pickup.value && v) {
        if (v < pickup.value) {
          setError(input, 'The return date must be on or after the pickup date.');
          return false;
        }
        var span = (new Date(v) - new Date(pickup.value)) / 86400000;
        if (span > maxDays) {
          setError(input, 'For rentals longer than ' + maxDays + ' days, please contact us directly.');
          return false;
        }
      }

      if (input === pickup && v < toISO(earliest)) {
        setError(input, 'Please choose a date from ' + toISO(earliest) + ' onward.');
        return false;
      }

      clearError(input);
      return true;
    }

    // Validate on blur, but only clear errors while typing — re-validating on
    // every keystroke scolds people mid-input.
    $$('input, select, textarea', form).forEach(function (input) {
      if (input.name === 'company') return;
      input.addEventListener('blur', function () { validateField(input); });
      input.addEventListener('input', function () {
        if (fieldOf(input) && fieldOf(input).classList.contains('has-error')) clearError(input);
      });
      if (input.tagName === 'SELECT') {
        input.addEventListener('change', function () { validateField(input); });
      }
    });

    function validateAll() {
      var firstBad = null;
      $$('input, select, textarea', form).forEach(function (input) {
        if (input.name === 'company') return;
        if (!validateField(input) && !firstBad) firstBad = input;
      });
      return firstBad;
    }

    /* --- Status messaging ---------------------------------------------- */
    function showStatus(kind, message) {
      if (!statusBox) return;
      if (!message) { statusBox.innerHTML = ''; return; }
      var icon = kind === 'error' ? 'i-alert' : 'i-check-circle';
      statusBox.innerHTML =
        '<div class="alert alert--' + kind + '">' +
          '<svg aria-hidden="true"><use href="#' + icon + '"/></svg>' +
          '<span>' + message + '</span>' +
        '</div>';
    }

    function loading(on) {
      if (!submitBtn) return;
      submitBtn.disabled = on;
      submitBtn.style.opacity = on ? '0.65' : '';
      if (submitLabel) submitLabel.textContent = on ? 'Sending…' : 'Request My Reservation';
    }

    /* --- Submit --------------------------------------------------------- */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showStatus(null, '');

      var firstBad = validateAll();
      if (firstBad) {
        showStatus('error', 'Please check the highlighted fields and try again.');
        firstBad.focus();
        firstBad.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        track('form_validation_failed', { field: firstBad.name });
        return;
      }

      var data = {};
      new FormData(form).forEach(function (value, key) { data[key] = String(value).trim(); });

      // Honeypot: a bot filled the hidden field. Show the normal confirmation
      // so it learns nothing, but never transmit.
      if (data.company) { succeed(data); return; }
      delete data.company;

      data.submittedAt = new Date().toISOString();
      data.source = window.location.href;
      data.pageTitle = document.title;

      var endpoint = CFG.formEndpoint;
      if (!endpoint) {
        console.warn(
          '[Rich Exotic Rentals] No formEndpoint is set in assets/js/config.js — ' +
          'this submission was NOT transmitted. See README.md § "Wiring up notifications".',
          data
        );
        succeed(data, true);
        return;
      }

      loading(true);
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Request failed with status ' + res.status);
          succeed(data);
        })
        .catch(function (err) {
          console.error('[Rich Exotic Rentals] Booking submission failed:', err);
          showStatus('error',
            'We could not send your request just now. Please try again, or call us at ' +
            '<a href="tel:' + (CFG.phoneE164 || '') + '">' + (CFG.phoneDisplay || 'our booking line') + '</a>.');
          track('form_submit_failed');
        })
        .then(function () { loading(false); });
    });

    function succeed(data, unconfigured) {
      track('Lead', { vehicle: data.vehicle, occasion: data.occasion });
      track('booking_request_submitted', { vehicle: data.vehicle });

      if (recap) {
        var rows = [
          ['Vehicle', data.vehicle],
          ['Pickup', formatDate(data.pickupDate)],
          ['Return', formatDate(data.returnDate)],
          ['Handover', data.fulfilment]
        ].filter(function (r) { return r[1]; });

        recap.innerHTML = rows.map(function (r) {
          return '<div><dt>' + r[0] + '</dt><dd>' + escapeHtml(r[1]) + '</dd></div>';
        }).join('');
      }

      form.classList.add('form-hidden');
      if (successBox) {
        successBox.classList.add('is-visible');
        if (unconfigured) {
          var note = document.createElement('p');
          note.style.cssText = 'margin-top:1.5rem;font-size:.8rem;color:#9b9ba2';
          note.innerHTML = '<strong>Site owner:</strong> no <code>formEndpoint</code> is configured, ' +
                           'so this request was not delivered. See README.md.';
          successBox.appendChild(note);
        }
        successBox.focus();
        successBox.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
    }

    function formatDate(iso) {
      if (!iso) return '';
      var parts = iso.split('-');
      if (parts.length !== 3) return iso;
      var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        form.reset();
        syncDelivery();
        showStatus(null, '');
        $$('.field.has-error', form).forEach(function (f) { f.classList.remove('has-error'); });
        form.classList.remove('form-hidden');
        if (successBox) successBox.classList.remove('is-visible');
        form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    }
  }

  /* ---------------------------------------------------------------------- */
  function init() {
    loadAnalytics();
    applyConfig();
    initChrome();
    initReveal();
    initCtas();
    initForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
