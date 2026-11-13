// 전시실 그림 그리기: 그림 채우기 성공·그림 도감 화면에서 함께 쓴다.
// 잠긴 그림 위에 컬러 그림을 구역 모양대로 잘라 얹고, 채운 구역만 보이게 한다.
import { summarizeRoom } from './collection-data.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const FILL_FALLBACK_MS = 1200;
const HIGHLIGHT_MS = 2000;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function svg(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

export function describeScene(room, acquired) {
  const { filled, total } = summarizeRoom(room, acquired);
  return `${room.sceneTitle} 그림, ${total}칸 중 ${filled}칸 채움`;
}

// 빈 구역 링크의 읽기용 이름
const regionLinkLabel = (item) => `${item.order}번 ${item.title}, 비어 있음, 채워 보기`;

function renderReveal(room, acquired, label, regionHref) {
  const { width, height, lockedSrc, colorSrc } = room.scene;
  // 구역 링크가 있으면 img 역할 대신 group으로 두어 안쪽 링크가 읽히게 한다.
  const role = regionHref ? 'group' : 'img';
  const root = svg('svg', { viewBox: `0 0 ${width} ${height}`, role, 'aria-label': label });
  const defs = svg('defs', {});
  root.append(defs, svg('image', { href: lockedSrc, width, height }));

  for (const item of room.regions) {
    const clipId = `scene-${room.id}-${item.order}`;
    const clip = svg('clipPath', { id: clipId });
    clip.append(svg('path', { d: item.path }));
    defs.append(clip);

    const fill = svg('image', {
      href: colorSrc,
      width,
      height,
      'clip-path': `url(#${clipId})`,
      class: `scene__fill${acquired.has(item.exhibitId) ? '' : ' is-empty'}`,
      'data-exhibit-id': item.exhibitId,
    });
    const outline = svg('path', { d: item.path, class: 'scene__outline', 'data-exhibit-id': item.exhibitId });
    root.append(fill, outline);
  }

  // 빈 구역 링크는 모든 그림 위에 둔다.
  for (const item of room.regions) {
    const href = !acquired.has(item.exhibitId) && regionHref?.(item);
    if (!href) continue;
    const link = svg('a', { href, class: 'scene__link', 'aria-label': regionLinkLabel(item) });
    link.append(svg('path', { d: item.path, class: 'scene__hit' }));
    root.append(link);
  }
  return root;
}

// 전시실 그림을 만든다. focusExhibitId가 그 전시실 구역이면 그 구역을 잠깐 강조한다.
// regionHref(region)가 주소를 주면 빈 구역을 그 주소로 가는 링크로 만든다.
export function renderScene(room, acquired, { focusExhibitId = null, label = describeScene(room, acquired), regionHref = null } = {}) {
  const figure = document.createElement('figure');
  figure.className = `scene scene--${room.scene.type}`;
  figure.style.aspectRatio = `${room.scene.width} / ${room.scene.height}`;
  figure.append(renderReveal(room, acquired, label, regionHref));
  if (focusExhibitId) highlightRegion(figure, focusExhibitId);
  return figure;
}

function regionTarget(sceneEl, exhibitId) {
  return [...sceneEl.querySelectorAll('.scene__fill')].find((node) => node.dataset.exhibitId === exhibitId) ?? null;
}

function outlineTarget(sceneEl, exhibitId) {
  return [...sceneEl.querySelectorAll('.scene__outline')].find((node) => node.dataset.exhibitId === exhibitId) ?? null;
}

// 채우기 연출 전에 드러날 컬러 그림을 받아 둔다.
// 느린 망에서 빈 그림 위로 연출이 지나가지 않게 하되, timeoutMs가 지나면 그냥 진행한다.
export function loadScene(room, timeoutMs = 2500) {
  const image = new Image();
  image.src = room.scene.colorSrc;
  if (image.complete) return Promise.resolve();
  const loaded = new Promise((resolve) => {
    image.addEventListener('load', resolve, { once: true });
    image.addEventListener('error', resolve, { once: true });
  });
  const timeout = new Promise((resolve) => setTimeout(resolve, timeoutMs));
  return Promise.race([loaded, timeout]);
}

// 비어 있는 구역을 채우는 연출. 동작 줄이기 설정이면 바로 채운다.
export function playFill(sceneEl, exhibitId) {
  const target = regionTarget(sceneEl, exhibitId);
  if (!target) return Promise.resolve();

  const fill = () => target.classList.remove('is-empty');
  if (reducedMotion()) {
    fill();
    return Promise.resolve();
  }

  // 컬러 조각이 빛나며 나타난다.
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      target.classList.remove('is-filling');
      resolve();
    };
    const timer = setTimeout(done, FILL_FALLBACK_MS);
    target.addEventListener('animationend', done, { once: true });
    target.classList.add('is-filling');
    fill();
    highlightRegion(sceneEl, exhibitId);
  });
}

// 구역이 화면에서 차지하는 영역 (그림 채우기 축하 연출의 출발점). 없는 구역이면 null.
export function regionRect(sceneEl, exhibitId) {
  return outlineTarget(sceneEl, exhibitId)?.getBoundingClientRect() ?? null;
}

// 구역 윤곽을 잠깐 강조한다 (그림에서 위치 보기, 채우기 연출).
export function highlightRegion(sceneEl, exhibitId) {
  const target = outlineTarget(sceneEl, exhibitId);
  if (!target) return;
  target.classList.add('is-highlighted');
  setTimeout(() => target.classList.remove('is-highlighted'), HIGHLIGHT_MS);
}
