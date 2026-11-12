// 그림 채우기 성공: 퀴즈 정답 뒤 퀴즈 화면이 ?exhibitId=…(이미 채운 구역이면 &new=0)로 보낸다.
// 샘플 기록과 별개로, 주소의 유물은 방금 채워졌다고 보고 그린다.
import { loadScene, playFill, regionRect, renderScene } from '../common/scene.js';
import { ROOMS, SAMPLE_RECORDS, acquiredSet, findRegion, summarizeRoom } from '../common/collection-data.js';

const params = new URLSearchParams(window.location.search);
const exhibitId = params.get('exhibitId');
const isNew = params.get('new') !== '0';
const hit = findRegion(ROOMS, exhibitId);
const root = document.querySelector('#result');

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function linkButton(text, href, variant) {
  const link = element('a', `result__button result__button--${variant} art-button art-pressable${variant === 'secondary' ? ' art-button--secondary' : ''}`, text);
  link.href = href;
  return link;
}

// 축하 연출: 그림이 채워진 뒤 방금 채운 구역에서 잎·꽃 에셋이 터지듯 퍼졌다가 사라진다.
// [모양, 가로 이동(px), 세로 이동(px), 회전(deg)] — 채운 구역 가운데에서 출발한다.
const CELEBRATION_PIECES = [
  ['leaf', -112, -20, -50], ['flower', -84, 46, -18], ['leaf', -54, -66, 24],
  ['flower', -26, 62, 12], ['leaf', 26, -72, -30], ['flower', 56, 54, 16],
  ['leaf', 88, -34, 48], ['flower', 112, 18, -12], ['leaf', -100, 76, 70], ['leaf', 100, 80, -64],
];

// 연출 묶음을 채운 구역의 가운데(.result 기준 좌표)에 놓는다. 구역을 못 찾으면 그림 가운데.
function placeCelebration(box, scene) {
  const area = regionRect(scene, exhibitId) ?? scene.getBoundingClientRect();
  const origin = root.getBoundingClientRect();
  box.style.left = `${area.left + area.width / 2 - origin.left}px`;
  box.style.top = `${area.top + area.height / 2 - origin.top}px`;
}

function renderCelebration() {
  const box = element('div', 'result__celebrate');
  box.setAttribute('aria-hidden', 'true');
  CELEBRATION_PIECES.forEach(([kind, x, y, rotate], index) => {
    const piece = element('span', `result__piece result__piece--${kind}`);
    piece.style.setProperty('--x', `${x}px`);
    piece.style.setProperty('--y', `${y}px`);
    piece.style.setProperty('--r', `${rotate}deg`);
    piece.style.setProperty('--delay', `${index * 35}ms`);
    box.append(piece);
  });
  return box;
}

function renderUnknown() {
  const box = element('section', 'result__notice');
  box.append(
    element('h1', 'result__title', '어떤 유물인지 알 수 없어요'),
    element('p', 'result__text', '주소가 바르지 않거나 없는 유물이에요.'),
    linkButton('홈으로 가기', '/', 'primary'),
  );
  root.replaceChildren(box);
}

function renderResult({ room, region }) {
  const acquired = acquiredSet(SAMPLE_RECORDS);
  acquired.add(exhibitId);
  const { filled, total, complete } = summarizeRoom(room, acquired);

  // 새로 채운 구역은 비운 상태로 그린 뒤 채우기 연출을 재생한다.
  const before = new Set(acquired);
  if (isNew) before.delete(exhibitId);
  const scene = renderScene(room, before, {
    label: `${room.sceneTitle} 그림, ${total}칸 중 ${filled}칸 채움`,
  });
  // 그림 도감의 전시실 그림과 같은 이름 후보: '그림 도감에서 보기'를 누르면 그림이 그대로 이어진다 (page-transition.js).
  scene.dataset.vtName = `scene-${room.id}`;

  const eyebrow = element('p', 'result__eyebrow', isNew ? 'MISSION CLEAR' : 'ALREADY FILLED');
  eyebrow.setAttribute('aria-hidden', 'true');
  const title = element('h1', 'result__title', isNew ? '그림 속 빈자리가 채워졌어요!' : '이미 채운 구역이에요');

  const info = element('div', 'result__info');
  info.append(
    element('h2', 'result__name', region.artifactName),
    element('p', 'result__room', `${room.name} · ${region.order}번 ${region.title}`),
    element('p', `result__progress${complete ? ' is-complete' : ''}`, complete ? `${room.sceneTitle} 그림 완성!` : `${room.shortName} 그림 ${filled} / ${total}`),
  );

  const status = element('p', 'visually-hidden');
  status.setAttribute('role', 'status');

  const actions = element('div', 'result__actions');
  actions.append(
    linkButton('그림 도감에서 보기', `/pages/picture-book.html?room=${encodeURIComponent(room.id)}&focus=${encodeURIComponent(exhibitId)}`, 'primary'),
    linkButton('진열장 보러 가기', '/pages/showcase.html', 'secondary'),
  );

  document.title = `${region.artifactName} 채움 | BU:LOG`;
  const celebration = isNew ? renderCelebration() : null;
  root.replaceChildren(eyebrow, title, scene, info, status, actions);
  if (celebration) root.append(celebration);

  if (isNew) {
    // 드러날 그림을 받고 화면이 그려진 뒤 연출을 시작하고, 끝나면 축하 연출을 보여 주고 스크린리더에 알린다.
    Promise.all([loadScene(room), new Promise((resolve) => setTimeout(resolve, 300))])
      .then(() => playFill(scene, exhibitId))
      .then(() => {
        placeCelebration(celebration, scene);
        celebration.classList.add('is-playing');
        title.classList.add('is-popping');
        status.textContent = `${region.title} 구역이 채워졌어요`;
      });
  }
}

if (hit) renderResult(hit);
else renderUnknown();
