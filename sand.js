/* Arena cayendo en el hero: granos con gravedad, tamaños y tonos variados,
   que se van acumulando en una pequeña duna al fondo. Usa <canvas>. */
(function () {
  var host = document.querySelector('.hero-sand-overlay');
  if (!host) return;

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var COLORS = ['#f1d9a8', '#e6c488', '#d9b073', '#c99a5e', '#f6e6c3', '#b8864f'];
  var COL_W = 3;                 // ancho (px) de cada columna de la duna
  var W = 0, H = 0, dpr = 1;
  var pile = [];                 // altura de arena acumulada por columna
  var grains = [];
  var maxPile = 0;
  var last = 0, spawnCarry = 0;

  function resize() {
    var r = host.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cols = Math.ceil(W / COL_W) + 2;
    var old = pile;
    pile = new Array(cols).fill(0);
    for (var i = 0; i < Math.min(old.length, cols); i++) pile[i] = old[i];
    maxPile = Math.min(H * 0.14, 70);
  }

  function spawn() {
    var depth = Math.random();                 // 0 = lejos/pequeño, 1 = cerca/grande
    var size = 0.8 + depth * 1.7;
    grains.push({
      x: Math.random() * W,
      y: -4 - Math.random() * 20,
      vx: (Math.random() - 0.5) * 8,           // deriva lateral leve
      vy: 20 + Math.random() * 40,
      g: 380 + depth * 260,                    // gravedad (px/s²)
      size: size,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      alpha: 0.55 + depth * 0.45
    });
  }

  function settle(g) {
    var c = Math.max(0, Math.min(pile.length - 1, Math.round(g.x / COL_W)));
    if (pile[c] < maxPile) {
      pile[c] += 0.7 + g.size * 0.2;
      if (c > 0) pile[c - 1] += 0.3;
      if (c < pile.length - 1) pile[c + 1] += 0.3;
    }
  }

  // Los granos se deslizan: la duna se aplana hasta un ángulo de reposo
  function relax() {
    var slope = 1.4, i, d;
    for (i = 1; i < pile.length - 1; i++) {
      d = pile[i] - pile[i + 1];
      if (d > slope) { pile[i] -= 0.6; pile[i + 1] += 0.6; }
      else if (d < -slope) { pile[i] += 0.6; pile[i + 1] -= 0.6; }
      d = pile[i] - pile[i - 1];
      if (d > slope) { pile[i] -= 0.6; pile[i - 1] += 0.6; }
    }
    // la arena "se escurre" lentamente para que nunca se llene el hero
    for (i = 0; i < pile.length; i++) {
      if (pile[i] > maxPile * 0.92) pile[i] -= 0.5;
      else if (pile[i] > 0) pile[i] -= 0.002;
    }
  }

  function drawPile() {
    if (!pile.length) return;
    var grad = ctx.createLinearGradient(0, H - maxPile, 0, H);
    grad.addColorStop(0, '#e6c488');
    grad.addColorStop(1, '#c99a5e');
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (var i = 0; i < pile.length; i++) ctx.lineTo(i * COL_W, H - pile[i]);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function frame(t) {
    var dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;

    ctx.clearRect(0, 0, W, H);

    // ~0.75 granos por px de ancho por segundo
    spawnCarry += W * 0.75 * dt;
    while (spawnCarry >= 1) { spawn(); spawnCarry--; }

    for (var i = grains.length - 1; i >= 0; i--) {
      var g = grains[i];
      g.vy += g.g * dt;
      if (g.vy > 520) g.vy = 520;
      g.x += g.vx * dt + Math.sin((g.y + i) * 0.05) * 0.15;
      g.y += g.vy * dt;

      var c = Math.max(0, Math.min(pile.length - 1, Math.round(g.x / COL_W)));
      if (g.y >= H - pile[c]) { settle(g); grains.splice(i, 1); continue; }

      ctx.globalAlpha = g.alpha;
      ctx.fillStyle = g.color;
      // estela corta en la dirección de caída: se lee como grano, no como círculo
      ctx.fillRect(g.x, g.y, g.size, g.size + Math.min(g.vy * 0.005, 1.4));
    }
    ctx.globalAlpha = 1;

    relax(); relax();
    drawPile();
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);

  if (reduceMotion) {
    // Sin animación: solo una duna estática
    for (var i = 0; i < pile.length; i++) {
      pile[i] = maxPile * 0.55 * (0.7 + 0.3 * Math.sin(i * 0.05));
    }
    drawPile();
  } else {
    requestAnimationFrame(frame);
  }
})();
