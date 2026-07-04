// custom cursor: a little lipstick that leaves a sparkle trail
const blob = document.getElementById('cursorBlob');
const sparkleColors = ['#ff2fa0', '#ffe14d', '#b18cff', '#4fd8ff', '#5cf29e'];
const sparkleSymbols = ['✦', '✧', '✨'];
let lastSparkleX = 0, lastSparkleY = 0;
const SPARKLE_MIN_DIST = 28;
const SPARKLE_MAX_LIVE = 25; // safety cap so a fast mouse-shake can't pile up unbounded DOM nodes
const liveSparkles = [];

window.addEventListener('mousemove', (e) => {
  blob.style.left = e.clientX + 'px';
  blob.style.top = e.clientY + 'px';

  const dx = e.clientX - lastSparkleX;
  const dy = e.clientY - lastSparkleY;
  if (Math.hypot(dx, dy) < SPARKLE_MIN_DIST) return;
  lastSparkleX = e.clientX;
  lastSparkleY = e.clientY;

  if (liveSparkles.length >= SPARKLE_MAX_LIVE) {
    liveSparkles.shift().remove();
  }

  const sparkle = document.createElement('span');
  sparkle.className = 'cursor-sparkle';
  sparkle.textContent = sparkleSymbols[Math.floor(Math.random() * sparkleSymbols.length)];
  sparkle.style.left = (e.clientX + (Math.random() * 16 - 8)) + 'px';
  sparkle.style.top = (e.clientY + (Math.random() * 16 - 8)) + 'px';
  sparkle.style.color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
  sparkle.style.fontSize = (0.7 + Math.random() * 0.6) + 'rem';
  document.body.appendChild(sparkle);
  liveSparkles.push(sparkle);
  setTimeout(() => {
    const idx = liveSparkles.indexOf(sparkle);
    if (idx !== -1) liveSparkles.splice(idx, 1);
    sparkle.remove();
  }, 700);
});

// hero "open me" box, spills products across the hero
const heroBox = document.getElementById('heroBox');
const heroSpill = document.getElementById('heroSpill');
const heroBoxReset = document.getElementById('heroBoxReset');
const heroBoxWrap = document.getElementById('heroBoxWrap');
heroBox.addEventListener('click', () => {
  // push the bag down first to make real room, so the spilled ring never crowds the title above
  if (heroBoxWrap) heroBoxWrap.classList.add('opened-gap');
  heroBox.classList.add('opened');
  heroSpill.classList.add('burst');
  setTimeout(() => {
    heroBox.classList.add('hidden');
    if (heroBoxReset) heroBoxReset.classList.add('show');
  }, 550);
});

// "back to the bag" — undo the spill and reset the box
if (heroBoxReset) {
  heroBoxReset.addEventListener('click', () => {
    heroBoxReset.classList.remove('show');
    heroSpill.classList.remove('burst');
    document.querySelectorAll('.spill-item.flipped').forEach(item => item.classList.remove('flipped'));
    heroBox.classList.remove('opened', 'hidden');
    if (heroBoxWrap) heroBoxWrap.classList.remove('opened-gap');
    if (heroSpillHint) heroSpillHint.style.display = '';
  });
}

// spilled product icons — click to flip and reveal the skill
document.querySelectorAll('.spill-item').forEach(item => {
  item.addEventListener('click', () => {
    item.classList.toggle('flipped');
  });
});

// spill flip hint fades out once someone's flipped at least one item
const heroSpillHint = document.getElementById('heroSpillHint');
if (heroSpillHint) {
  heroSpill.addEventListener('click', () => {
    heroSpillHint.style.display = 'none';
  }, { once: true });
}

// swipe cards
const swipeDeck = document.getElementById('swipeDeck');
if (swipeDeck) {
  const swipeCards = Array.from(swipeDeck.querySelectorAll('.swipe-card'));
  const swipeEnd = document.getElementById('swipeEnd');
  const swipeControls = document.querySelector('.swipe-controls');
  let topIndex = 0;

  function renderStack() {
    swipeEnd.classList.remove('show');
    swipeControls.style.display = 'flex';
    swipeCards.forEach((card, i) => {
      card.classList.remove('swipe-out-right', 'swipe-out-left');
      const rel = i - topIndex;
      if (rel < 0) { card.style.display = 'none'; return; }
      card.style.display = 'flex';
      card.style.zIndex = swipeCards.length - rel;
      const rot = rel === 0 ? 0 : (rel % 2 === 0 ? -3 : 3);
      card.style.transform = `translateY(${rel * 16}px) scale(${1 - rel * 0.06}) rotate(${rot}deg)`;
      card.style.opacity = rel > 2 ? 0 : 1;
      card.style.filter = rel === 0 ? 'none' : 'saturate(0.6)';
    });
    if (topIndex >= swipeCards.length) {
      swipeEnd.classList.add('show');
      swipeControls.style.display = 'none';
    }
  }

  function swipeTop(direction) {
    if (topIndex >= swipeCards.length) return;
    const card = swipeCards[topIndex];
    card.classList.add(direction === 'right' ? 'swipe-out-right' : 'swipe-out-left');
    topIndex++;
    setTimeout(renderStack, 350);
  }

  document.getElementById('swipeYes').addEventListener('click', () => swipeTop('right'));
  document.getElementById('swipeNope').addEventListener('click', () => swipeTop('left'));
  document.getElementById('swipeRestart').addEventListener('click', () => {
    topIndex = 0;
    renderStack();
  });

  // drag-to-swipe: mouse + touch, via Pointer Events
  const SWIPE_THRESHOLD = 100;
  let dragState = null;

  swipeCards.forEach(card => {
    card.addEventListener('pointerdown', (e) => {
      if (card !== swipeCards[topIndex]) return;
      dragState = { startX: e.clientX, card };
      card.classList.add('dragging');
      card.setPointerCapture(e.pointerId);
    });

    card.addEventListener('pointermove', (e) => {
      if (!dragState || dragState.card !== card) return;
      const dx = e.clientX - dragState.startX;
      const rot = dx / 18;
      card.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;
      const likeStamp = card.querySelector('.swipe-stamp-like');
      const nopeStamp = card.querySelector('.swipe-stamp-nope');
      const progress = Math.min(Math.abs(dx) / SWIPE_THRESHOLD, 1);
      if (dx > 4) {
        likeStamp.style.opacity = progress;
        nopeStamp.style.opacity = 0;
      } else if (dx < -4) {
        nopeStamp.style.opacity = progress;
        likeStamp.style.opacity = 0;
      } else {
        likeStamp.style.opacity = 0;
        nopeStamp.style.opacity = 0;
      }
    });

    const endDrag = (e) => {
      if (!dragState || dragState.card !== card) return;
      const dx = e.clientX - dragState.startX;
      dragState = null;
      card.classList.remove('dragging');
      card.querySelectorAll('.swipe-stamp').forEach(s => s.style.opacity = 0);
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        swipeTop(dx > 0 ? 'right' : 'left');
      } else {
        renderStack();
      }
    };
    card.addEventListener('pointerup', endDrag);
    card.addEventListener('pointercancel', endDrag);
  });

  renderStack();
}

// roadmap: winding path that draws itself as you scroll down it
const roadWrap = document.getElementById('roadWrap');
const roadPathFg = document.getElementById('roadPathFg');
if (roadWrap && roadPathFg) {
  const pathLength = roadPathFg.getTotalLength();
  roadPathFg.style.strokeDasharray = pathLength;
  roadPathFg.style.strokeDashoffset = pathLength;

  function updateRoadDraw() {
    const rect = roadWrap.getBoundingClientRect();
    const viewH = window.innerHeight;
    // progress 0 -> 1 as the wrap travels from just entering the bottom of the viewport to its end reaching the top
    const progress = (viewH * 0.85 - rect.top) / (rect.height + viewH * 0.7);
    const clamped = Math.min(1, Math.max(0, progress));
    roadPathFg.style.strokeDashoffset = pathLength * (1 - clamped);
  }
  // throttle scroll/resize work to one reflow-read per animation frame instead of once per raw event
  let roadDrawScheduled = false;
  function scheduleRoadDraw() {
    if (roadDrawScheduled) return;
    roadDrawScheduled = true;
    requestAnimationFrame(() => {
      updateRoadDraw();
      roadDrawScheduled = false;
    });
  }
  window.addEventListener('scroll', scheduleRoadDraw, { passive: true });
  window.addEventListener('resize', scheduleRoadDraw);
  updateRoadDraw();

  // reveal each stop (dot + card) as it comes into view
  const roadObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.road-node').forEach(node => roadObserver.observe(node));

  // click a road card to expand it and reveal more detail
  document.querySelectorAll('.road-card').forEach(card => {
    card.addEventListener('click', () => {
      const wasExpanded = card.classList.contains('expanded');
      document.querySelectorAll('.road-card.expanded').forEach(c => c.classList.remove('expanded'));
      if (!wasExpanded) card.classList.add('expanded');
    });
  });
}

// faves: staggered reveal on scroll into view
const faveCards = document.querySelectorAll('.fave-card');
if (faveCards.length) {
  const faveObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const i = Array.from(faveCards).indexOf(card);
        card.style.transitionDelay = `${(i % 4) * 90}ms`;
        card.classList.add('in-view');
        faveObserver.unobserve(card);
      }
    });
  }, { threshold: 0.2 });
  faveCards.forEach(card => faveObserver.observe(card));
}

