/* ===============================================================
   sin-viudas.js
   Evita que el último renglón de un texto quede con UNA sola palabra.
   - Une las últimas palabras con un espacio de no separación (nbsp),
     así siempre bajan juntas (si las últimas dos son muy cortas, une tres).
   - Si el título es tan corto que unido no cabe en el ancho (ej. dos
     palabras en celular), reduce un poco la letra solo lo necesario.
   Funciona en todos los navegadores. Se aplica solo a textos, no a la
   navegación ni a los botones.
   =============================================================== */
(function () {
  'use strict';

  var SELECTOR = 'p, h1, h2, h3, h4, h5, h6, li, figcaption, .media-description, ' +
                 '.jerome-title, .jerome-sub, .section-kicker, .jerome-label, .jerome-name';
  var NBSP = '\u00A0';
  var tracked = [];

  function lastTextNode(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return /\S/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var last = null;
    while (walker.nextNode()) last = walker.currentNode;
    return last;
  }

  /* une las últimas palabras del elemento; devuelve true si cambió algo */
  function tie(el) {
    var node = lastTextNode(el);
    if (!node) return false;
    var full = node.nodeValue;
    var t = full.replace(/\s+$/, '');
    var trailing = full.slice(t.length);

    var m = /(\S+)[ \t\n\r]+(\S+)$/.exec(t);
    if (m) {
      t = t.slice(0, m.index) + m[1] + NBSP + m[2];
      /* si las dos últimas son muy cortas ("de la", "y el"), une también la anterior */
      if (m[1].length + m[2].length < 9) {
        t = t.replace(/(\S+)[ \t\n\r]+(\S+\u00A0\S+)$/, '$1' + NBSP + '$2');
      }
      node.nodeValue = t + trailing;
      return true;
    }
    /* una sola palabra en este nodo y pegada a algo anterior (ej. <span>Etiqueta:</span> palabra) */
    if (/^[ \t\n\r]+\S/.test(t) && node.previousSibling) {
      node.nodeValue = t.replace(/^[ \t\n\r]+/, NBSP) + trailing;
      return true;
    }
    return false;
  }

  /* ¿el texto unido se sale del espacio disponible? */
  function overflows(el) {
    if (el.scrollWidth > el.clientWidth + 1) return true;
    var p = el.parentElement;
    if (!p) return false;
    var cs = getComputedStyle(p);
    var inner = p.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    return el.offsetWidth > inner + 1;
  }

  function fit(el) {
    el.style.fontSize = '';
    var p = el.parentElement;
    if (p && /flex/.test(getComputedStyle(p).display)) el.style.minWidth = '0';
    if (!overflows(el)) return;
    var base = parseFloat(getComputedStyle(el).fontSize);
    var size = base, min = base * 0.68;
    while (overflows(el) && size > min) {
      size *= 0.95;
      el.style.fontSize = size + 'px';
    }
  }

  function fix(el) {
    if (!el || el.closest('nav, script, style, textarea, pre, code, button')) return;
    if (!el.__sv) {
      if (!tie(el)) return;
      el.__sv = true;
      tracked.push(el);
    }
    if (el.getClientRects().length) fit(el);
  }

  function all(root) {
    (root || document).querySelectorAll(SELECTOR).forEach(fix);
  }

  function refit() {
    tracked.forEach(function (el) { if (el.isConnected && el.getClientRects().length) fit(el); });
  }

  window.sinViudas = { fix: fix, all: all, refit: refit };

  function start() {
    all(document);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
    window.addEventListener('load', refit);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  var timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(refit, 120);
  });
})();
