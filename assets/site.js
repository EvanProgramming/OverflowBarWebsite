(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const sources = video => { for (const source of video.querySelectorAll('source[data-src]')) { source.src = source.dataset.src; source.removeAttribute('data-src'); } };
  const activeVideos = new Set();
  function resetButton(container, button) {
    container.classList.remove('is-playing');
    const text = button?.querySelector('span');
    if (text) text.textContent = button.hasAttribute('data-demo-play') ? 'See it open' : 'Play recording';
    button?.setAttribute('aria-label', button.hasAttribute('data-demo-play') ? 'Play the real second-row recording' : 'Play product recording');
    button?.setAttribute('aria-pressed', 'false');
  }
  function pauseAll(except) {
    for (const video of activeVideos) if (video !== except) video.pause();
  }
  function setupPlayer(video, button, container) {
    if (!video || !button || !container) return;
    let started = false;
    let completed = false;
    button.hidden = false;
    activeVideos.add(video);
    button.addEventListener('click', async () => {
      if (!video.paused) { video.pause(); return; }
      pauseAll(video);
      button.disabled = true;
      try {
        const unloaded = video.querySelector('source[data-src]');
        if (unloaded) { sources(video); video.load(); }
        if (completed) { video.currentTime = 0; completed = false; }
        await video.play();
      } catch {
        resetButton(container, button);
        const text = button.querySelector('span');
        if (text) text.textContent = 'Play unavailable · try again';
      } finally { button.disabled = false; }
    });
    video.addEventListener('play', () => {
      started = true;
      container.classList.add('is-playing');
      button.setAttribute('aria-label', 'Pause product recording');
      button.setAttribute('aria-pressed', 'true');
      const text = button.querySelector('span');
      if (text) text.textContent = 'Pause';
    });
    video.addEventListener('pause', () => {
      if (!started || video.ended) return;
      button.setAttribute('aria-label', 'Resume product recording');
      button.setAttribute('aria-pressed', 'false');
      const text = button.querySelector('span');
      if (text) text.textContent = 'Resume';
    });
    video.addEventListener('ended', () => {
      completed = true;
      resetButton(container, button);
      const text = button.querySelector('span');
      if (text) text.textContent = 'Replay';
    });
    video.addEventListener('error', () => resetButton(container, button));
  }
  for (const media of document.querySelectorAll('.scene-media')) setupPlayer(media.querySelector('video'), media.querySelector('[data-video-play]'), media);
  const demo = document.querySelector('[data-row-demo]');
  if (demo) {
    const video = demo.querySelector('[data-demo-video]');
    demo.querySelector('.demo-segment').hidden = false;
    setupPlayer(video, demo.querySelector('[data-demo-play]'), demo.querySelector('.hero-stage'));
    for (const button of demo.querySelectorAll('[data-row-state]')) button.addEventListener('click', () => {
      video.pause();
      resetButton(demo.querySelector('.hero-stage'), demo.querySelector('[data-demo-play]'));
      const open = button.dataset.rowState === 'open';
      const image = demo.querySelector('[data-row-image]');
      image.src = open ? '/assets/row-open.webp' : '/assets/row-closed.webp';
      image.alt = open ? 'OverflowBar open with selected icons in a second row below the Mac menu bar' : 'The Mac menu bar with the OverflowBar second row closed';
      for (const candidate of demo.querySelectorAll('[data-row-state]')) candidate.setAttribute('aria-pressed', String(candidate === button));
      demo.querySelector('[data-row-status]').textContent = open ? 'Your selected icons, one click away.' : 'Tucked away. A clearer menu bar.';
    });
    video.addEventListener('ended', () => demo.querySelector('[data-row-state="open"]').click());
  }
  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver(entries => { for (const entry of entries) if (!entry.isIntersecting) entry.target.pause(); }, { threshold: .1 });
    for (const video of activeVideos) visibility.observe(video);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseAll(); });
  const story = document.querySelector('.story');
  if (story) {
    const frames = [...story.querySelectorAll('[data-scene-frame]')];
    const steps = [...story.querySelectorAll('[data-scene]')];
    const visual = story.querySelector('.story-visual');
    const wide = matchMedia('(min-width: 900px)');
    let desktop = false, ticking = false, current = 'select';
    const setScene = name => {
      if (name === current) return;
      current = name;
      pauseAll();
      for (const frame of frames) {
        const active = frame.dataset.sceneFrame === name;
        frame.classList.toggle('is-active', active);
        if (desktop) frame.inert = !active;
      }
      for (const step of steps) step.classList.toggle('is-current', step.dataset.scene === name);
    };
    const update = () => {
      ticking = false;
      if (!desktop) return;
      let nearest = steps[0], distance = Infinity;
      for (const step of steps) {
        const bounds = step.getBoundingClientRect();
        const next = Math.abs(bounds.top + bounds.height / 2 - innerHeight / 2);
        if (next < distance) { nearest = step; distance = next; }
      }
      setScene(nearest.dataset.scene);
    };
    const layout = () => {
      desktop = wide.matches && !reduced.matches;
      document.documentElement.classList.toggle('story-motion', desktop);
      pauseAll();
      for (const frame of frames) {
        if (desktop) visual.append(frame);
        else steps.find(step => step.dataset.scene === frame.dataset.sceneFrame).append(frame);
        frame.inert = desktop && frame.dataset.sceneFrame !== current;
      }
      update();
    };
    wide.addEventListener('change', layout);
    reduced.addEventListener('change', layout);
    addEventListener('scroll', () => { if (desktop && !ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', () => { if (desktop) update(); }, { passive: true });
    layout();
  }
  for (const button of document.querySelectorAll('[data-copy]')) {
    button.hidden = false;
    button.addEventListener('click', async () => {
    const block = button.closest('.code-block');
    const text = block.querySelector('code').textContent;
    const status = block.querySelector('[data-copy-status]');
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied';
      status.textContent = 'Both commands copied.';
      setTimeout(() => { button.textContent = 'Copy commands'; status.textContent = ''; }, 3000);
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(block.querySelector('code'));
      selection.removeAllRanges(); selection.addRange(range);
      status.textContent = 'Commands selected. Copy with your keyboard.';
    }
    });
  }
})();
