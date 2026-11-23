// 홈 배너 전용: 수집 데이터 로딩과 별개로 탐색·자동 재생을 준비한다.
export function mountHomeCarousel(root) {
  if (!root) return;

  const slides = [...root.querySelectorAll('[data-carousel-slide]')];
  const dots = [...root.querySelectorAll('[data-carousel-dot]')];
  if (slides.length < 2) return;

  const viewport = root.querySelector('[data-carousel-slides]');
  const toggle = root.querySelector('[data-carousel-toggle]');
  const toggleLabel = root.querySelector('[data-carousel-toggle-label]');
  const current = root.querySelector('[data-carousel-current]');
  const status = root.querySelector('[data-carousel-status]');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const interval = 3500;
  let index = 0;
  let autoplay = !motionPreference.matches;
  let hovered = false;
  let inView = !('IntersectionObserver' in window);
  let pageHidden = false;
  let timer;
  let gesture;
  let suppressClickUntil = 0;

  function syncPlayback() {
    window.clearTimeout(timer);
    const running = autoplay && !hovered && !gesture && inView && !pageHidden
      && !document.hidden && !document.documentElement.classList.contains('auth-checking');
    // 재생 의도와 일시적인 대기(마우스·화면 밖)를 구분해 버튼 동작을 일정하게 유지한다.
    root.dataset.playing = String(autoplay);
    root.dataset.rotating = String(running);
    toggle.setAttribute('aria-label', autoplay ? '배너 자동 재생 멈추기' : '배너 자동 재생 시작하기');
    toggleLabel.textContent = autoplay ? '멈춤' : '재생';
    if (running) timer = window.setTimeout(() => showSlide(index + 1), interval);
  }

  function showSlide(next, manual = false) {
    const previous = slides[index];
    index = (next + slides.length) % slides.length;
    if (manual) autoplay = false;
    // 링크를 읽던 중 키보드로 넘겼다면 사라질 링크에 포커스를 남기지 않는다.
    if (previous !== slides[index] && previous.contains(document.activeElement)) dots[index].focus();
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.hidden = !active;
      slide.inert = !active;
      slide.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach((dot, dotIndex) => {
      if (dotIndex === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    root.dataset.activeSlide = String(index);
    current.textContent = String(index + 1).padStart(2, '0');
    if (manual) status.textContent = `${index + 1} / ${slides.length}, ${slides[index].dataset.carouselTitle}`;
    syncPlayback();
  }

  root.querySelector('[data-carousel-prev]').addEventListener('click', () => showSlide(index - 1, true));
  root.querySelector('[data-carousel-next]').addEventListener('click', () => showSlide(index + 1, true));
  dots.forEach((dot, dotIndex) => dot.addEventListener('click', () => showSlide(dotIndex, true)));
  toggle.addEventListener('click', () => {
    autoplay = !autoplay;
    syncPlayback();
  });

  root.addEventListener('focusin', (event) => {
    if (toggle.contains(event.target)) return;
    autoplay = false;
    syncPlayback();
  });
  root.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showSlide(index + (event.key === 'ArrowRight' ? 1 : -1), true);
  });
  root.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'mouse') return;
    hovered = true;
    syncPlayback();
  });
  root.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'mouse') return;
    hovered = false;
    syncPlayback();
  });

  viewport.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.pointerType === 'mouse') return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
    syncPlayback();
  });
  window.addEventListener('pointerup', (event) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    gesture = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      suppressClickUntil = performance.now() + 500;
      showSlide(index + (dx < 0 ? 1 : -1), true);
    } else {
      syncPlayback();
    }
  });
  window.addEventListener('pointercancel', (event) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    gesture = null;
    syncPlayback();
  });
  viewport.addEventListener('click', (event) => {
    if (performance.now() >= suppressClickUntil) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClickUntil = 0;
  }, true);

  document.addEventListener('visibilitychange', syncPlayback);
  window.addEventListener('pagehide', () => {
    pageHidden = true;
    gesture = null;
    syncPlayback();
  });
  window.addEventListener('pageshow', () => {
    pageHidden = false;
    syncPlayback();
  });
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) autoplay = false;
    syncPlayback();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= 0.25;
      syncPlayback();
    }, { threshold: [0, 0.25] }).observe(root);
  }
  if (document.documentElement.classList.contains('auth-checking')) {
    const observer = new MutationObserver(() => {
      if (document.documentElement.classList.contains('auth-checking')) return;
      observer.disconnect();
      syncPlayback();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  showSlide(0);
  root.querySelector('.home-carousel__controls').hidden = false;
}
