/* ===============================================================
   media-modal.js
   Ventana emergente para "Nuestros Medios".
   - La ventana crece desde la tarjeta que se tocó y regresa a ella al cerrar.
   - data-media="figma"  -> prototipo de Figma en un iframe (data-embed / data-open)
   - data-media="video"  -> video (data-src, data-poster) o, si se prefiere,
                            un iframe de YouTube/Vimeo (data-embed)
   - Cierra con ✕, ESC o clic fuera. Respeta "reducir movimiento".
   =============================================================== */
(function () {
  'use strict';

  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-media]'));
  if (!cards.length) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var canAnimate = typeof Element.prototype.animate === 'function';

  /* ---------- estructura del modal ---------- */
  var root = document.createElement('div');
  root.className = 'mm';
  root.hidden = true;
  root.innerHTML =
    '<div class="mm-backdrop"></div>' +
    '<div class="mm-panel" role="dialog" aria-modal="true" aria-labelledby="mmTitle">' +
      '<header class="mm-head">' +
        '<h2 class="mm-title" id="mmTitle"></h2>' +
        '<a class="mm-ext" target="_blank" rel="noopener" hidden>Abrir aparte &#8599;</a>' +
        '<button type="button" class="mm-close" aria-label="Cerrar">&#10005;</button>' +
      '</header>' +
      '<div class="mm-body">' +
        '<div class="mm-stage"><div class="mm-spinner" aria-hidden="true"></div></div>' +
        '<p class="mm-caption"></p>' +
      '</div>' +
    '</div>';
  document.body.appendChild(root);

  var backdrop = root.querySelector('.mm-backdrop');
  var panel    = root.querySelector('.mm-panel');
  var head     = root.querySelector('.mm-head');
  var body     = root.querySelector('.mm-body');
  var stage    = root.querySelector('.mm-stage');
  var spinner  = root.querySelector('.mm-spinner');
  var titleEl  = root.querySelector('.mm-title');
  var extLink  = root.querySelector('.mm-ext');
  var captionEl = root.querySelector('.mm-caption');
  var closeBtn = root.querySelector('.mm-close');

  var isOpen = false, closing = false, activeCard = null, video = null;

  /* ---------- contenido según el tipo ---------- */
  function clearStage() {
    if (video) {
      try { video.pause(); } catch (e) {}
      video.removeAttribute('src');
      try { video.load(); } catch (e) {}
      video = null;
    }
    Array.prototype.slice.call(stage.children).forEach(function (n) {
      if (n !== spinner) stage.removeChild(n);
    });
  }

  function showMissing() {
    spinner.classList.add('is-hidden');
    var box = document.createElement('div');
    box.className = 'mm-missing';
    box.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
      '<strong>Este video estará disponible muy pronto</strong>' +
      '<span>Estamos preparando la versión final.</span>';
    stage.appendChild(box);
  }

  function buildIframe(url, allow) {
    var f = document.createElement('iframe');
    f.src = url;
    f.title = titleEl.textContent;
    f.setAttribute('allowfullscreen', '');
    f.setAttribute('allow', allow || 'fullscreen');
    f.addEventListener('load', function () { spinner.classList.add('is-hidden'); });
    stage.appendChild(f);
  }

  function buildStage(card) {
    var kind = card.getAttribute('data-media');
    spinner.classList.remove('is-hidden');
    extLink.hidden = true;

    if (kind === 'figma') {
      var open = card.getAttribute('data-open');
      if (open) { extLink.href = open; extLink.hidden = false; }
      buildIframe(card.getAttribute('data-embed'), 'fullscreen; clipboard-write');
      return;
    }

    var embed = card.getAttribute('data-embed');
    if (embed) { buildIframe(embed, 'autoplay; fullscreen; picture-in-picture'); return; }

    var src = card.getAttribute('data-src');
    if (!src) { showMissing(); return; }

    video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.preload = 'auto';
    var poster = card.getAttribute('data-poster');
    if (poster) video.poster = poster;
    video.addEventListener('loadeddata', function () { spinner.classList.add('is-hidden'); });
    video.addEventListener('playing',    function () { spinner.classList.add('is-hidden'); });
    video.addEventListener('error', function () {
      if (!video) return;
      var v = video;
      if (v.parentNode) v.parentNode.removeChild(v);
      video = null;
      showMissing();
    });
    stage.appendChild(video);
    video.src = src;
    /* se llama dentro del mismo toque del usuario para que el navegador permita el sonido */
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* si se bloquea, quedan los controles */ });
  }

  /* ---------- animaciones ---------- */
  function visible(r) {
    return r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
  }

  function animateIn(card) {
    if (!canAnimate) return;
    if (reduceMotion.matches) {
      backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      return;
    }
    var from = card.getBoundingClientRect();
    var to = panel.getBoundingClientRect();
    var start;
    if (visible(from) && to.width && to.height) {
      start = 'translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px) ' +
              'scale(' + (from.width / to.width) + ',' + (from.height / to.height) + ')';
    } else {
      start = 'translateY(24px) scale(.92)';
    }
    var ease = 'cubic-bezier(.22,.9,.24,1)';
    backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out', fill: 'backwards' });
    panel.animate(
      [{ transform: start, opacity: .55, borderRadius: '10px' },
       { transform: 'translate(0,0) scale(1,1)', opacity: 1, borderRadius: '18px' }],
      { duration: 600, easing: ease, fill: 'backwards' });
    [head, body].forEach(function (el, i) {
      el.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
                 { duration: 420, delay: 260 + i * 70, easing: 'ease-out', fill: 'backwards' });
    });
  }

  function animateOut(card) {
    if (!canAnimate) return Promise.resolve();
    var anims = [];
    if (reduceMotion.matches) {
      anims.push(backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }));
      anims.push(panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }));
    } else {
      var from = card.getBoundingClientRect();
      var to = panel.getBoundingClientRect();
      var end;
      if (visible(from) && to.width && to.height) {
        end = 'translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px) ' +
              'scale(' + (from.width / to.width) + ',' + (from.height / to.height) + ')';
      } else {
        end = 'translateY(24px) scale(.92)';
      }
      anims.push(head.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' }));
      anims.push(body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' }));
      anims.push(panel.animate(
        [{ transform: 'translate(0,0) scale(1,1)', opacity: 1, borderRadius: '18px' },
         { transform: end, opacity: .4, borderRadius: '10px' }],
        { duration: 440, delay: 60, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }));
      anims.push(backdrop.animate([{ opacity: 1 }, { opacity: 0 }],
        { duration: 380, delay: 120, easing: 'ease-in', fill: 'forwards' }));
    }
    return Promise.all(anims.map(function (a) { return a.finished; })).catch(function () {});
  }

  /* ---------- abrir / cerrar ---------- */
  function openModal(card) {
    if (isOpen) return;
    isOpen = true;
    activeCard = card;

    titleEl.textContent = card.getAttribute('data-title') || (card.querySelector('h3') || {}).textContent || '';
    var d = card.querySelector('.media-description');
    captionEl.textContent = d ? d.textContent.replace(/\s+/g, ' ').trim() : '';
    panel.setAttribute('data-kind', card.getAttribute('data-media'));

    clearStage();
    root.hidden = false;
    document.body.classList.add('mm-lock');
    buildStage(card);
    animateIn(card);
    closeBtn.focus({ preventScroll: true });
  }

  function closeModal() {
    if (!isOpen || closing) return;
    closing = true;
    if (video) { try { video.pause(); } catch (e) {} }
    var card = activeCard;
    animateOut(card).then(function () {
      [backdrop, panel, head, body].forEach(function (el) {
        if (el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); });
      });
      root.hidden = true;
      clearStage();
      document.body.classList.remove('mm-lock');
      isOpen = false;
      closing = false;
      if (card) card.focus({ preventScroll: true });
    });
  }

  /* ---------- eventos ---------- */
  cards.forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      openModal(card);
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card); }
    });
  });

  closeBtn.addEventListener('click', closeModal);
  root.addEventListener('click', function (e) { if (!panel.contains(e.target)) closeModal(); });

  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
    if (e.key === 'Tab') {
      var items = Array.prototype.slice.call(panel.querySelectorAll('button, a[href]:not([hidden]), video[controls]'));
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
