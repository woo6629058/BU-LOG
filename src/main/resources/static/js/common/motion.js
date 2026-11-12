// 모바일 앱 같은 작은 움직임: 홈·그림 도감·진열장에서 쓴다.
// 목록 등장·누름 반응·막대 채우기는 CSS 클래스(art-rise·art-pressable·art-fill, css/components/art-theme.css)로 하고,
// 여기서는 CSS로 할 수 없는 숫자 올라가기만 맡는다.

// 움직임 줄이기 설정 (화면 스크립트도 함께 쓴다)
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 홈은 로그인 확인이 끝날 때까지(html.auth-checking) 화면을 가린다. 화면이 보인 뒤에 callback을 부른다.
function afterReveal(callback) {
  const root = document.documentElement;
  if (!root.classList.contains('auth-checking')) {
    callback();
    return;
  }
  const observer = new MutationObserver(() => {
    if (root.classList.contains('auth-checking')) return;
    observer.disconnect();
    callback();
  });
  observer.observe(root, { attributes: true, attributeFilter: ['class'] });
}

// 숫자를 0부터 value까지 올린다 (처음엔 빠르게, 끝에서 천천히).
// 읽기용 문구는 따로 두고 이 숫자는 aria-hidden 안에 둔다 (올라가는 동안 스크린리더가 읽지 않게).
export function countUp(node, value, { duration = 700 } = {}) {
  node.textContent = String(value);
  if (reducedMotion() || value <= 0) return;

  node.textContent = '0';
  afterReveal(() => {
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      node.textContent = String(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// 목록 등장 애니메이션: 순서대로 조금씩 늦게 나타나도록 클래스와 순서를 붙인다.
export function rise(node, index = 0) {
  node.classList.add('art-rise');
  node.style.setProperty('--i', String(index));
  return node;
}
