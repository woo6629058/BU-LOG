// 그림 채우기 성공: 퀴즈 정답 뒤 퀴즈 화면이 ?exhibitId=…(이미 채운 구역이면 &new=0)로 보낸다.
// 샘플 기록과 별개로, 주소의 유물은 방금 채워졌다고 보고 그린다.
import { loadScene, playFill, renderScene } from '../common/scene.js';
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
  const link = element('a', `result__button result__button--${variant}`, text);
  link.href = href;
  return link;
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
  root.replaceChildren(eyebrow, title, scene, info, status, actions);

  if (isNew) {
    // 드러날 그림을 받고 화면이 그려진 뒤 연출을 시작하고, 끝나면 스크린리더에 알린다.
    Promise.all([loadScene(room), new Promise((resolve) => setTimeout(resolve, 300))])
      .then(() => playFill(scene, exhibitId))
      .then(() => {
        status.textContent = `${region.title} 구역이 채워졌어요`;
      });
  }
}

if (hit) renderResult(hit);
else renderUnknown();
