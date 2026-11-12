import { mountTabBar } from '../common/tab-bar.js';
import { renderScene } from '../common/scene.js';
import { countUp, rise } from '../common/motion.js';
import {
  ROOMS,
  SAMPLE_RECORDS,
  acquiredSet,
  findRoom,
  summarizeAll,
  summarizeRoom,
} from '../common/collection-data.js';

mountTabBar({ active: 'picture-book' });

const HINT_TEXT = '전시실에서 이 유물의 QR을 찾아 미션을 풀어 보세요';

// 주소에 아는 전시실이 있으면 그 전시실 화면, 없으면 6곳 전체 보기.
const params = new URLSearchParams(window.location.search);
const room = findRoom(ROOMS, params.get('room'));
const focus = params.get('focus');
const acquired = acquiredSet(SAMPLE_RECORDS);

const roomUrl = (roomId) => `/pages/picture-book.html?room=${encodeURIComponent(roomId)}`;
// TODO(Frontend B): QR·퀴즈 흐름이 연결되면 지운다. 채우기 화면을 미리 보기 위한 임시 링크.
const demoFillUrl = (item) => `/pages/fill-result.html?exhibitId=${encodeURIComponent(item.exhibitId)}`;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderTotal() {
  const { filled, total } = summarizeAll(ROOMS, acquired);
  countUp(document.querySelector('#book-filled'), filled);
  document.querySelector('#book-total').textContent = total;
  document.querySelector('#book-count-label').textContent = `전체 ${total}칸 중 ${filled}칸 채움`;
}

// 전체 보기의 액자 그림과 전시실 보기의 큰 그림에 같은 이름 후보를 달아, 화면이 바뀔 때 그림이 커지며 이어지게 한다.
// 실제 이름은 이동할 때 짝이 맞는 그림에만 붙는다 (js/common/page-transition.js).
const sceneTransitionName = (roomId) => `scene-${roomId}`;

/* 전체 보기 */

function renderFrame(item, index) {
  const { filled, total, complete } = summarizeRoom(item, acquired);
  const li = element('li');
  const state = complete ? ' is-complete' : filled > 0 ? ' is-active' : '';
  const link = element('a', `book__frame art-pressable${state}`);
  link.href = roomUrl(item.id);

  const scene = renderScene(item, acquired);
  scene.setAttribute('aria-hidden', 'true');
  scene.dataset.vtName = sceneTransitionName(item.id);

  const meta = element('span', 'book__frame-meta');
  meta.append(
    element('span', 'book__frame-name', item.shortName),
    element('span', 'book__frame-count', complete ? '완성' : `${filled} / ${total}`),
  );
  meta.lastChild.setAttribute('aria-hidden', 'true');

  link.append(
    scene,
    meta,
    element('span', 'book__frame-title', item.sceneTitle),
    element('span', 'visually-hidden', complete ? ', 그림 완성' : `, ${total}칸 중 ${filled}칸 채움`),
  );
  li.append(link);
  return rise(li, index);
}

function renderOverview() {
  document.querySelector('#book-grid').replaceChildren(...ROOMS.map(renderFrame));
  document.querySelector('#book-overview').hidden = false;
}

/* 전시실 보기 */

function renderChips() {
  const chips = ROOMS.map((item) => {
    const li = element('li');
    const link = element('a', 'art-chip', item.shortName);
    link.href = roomUrl(item.id);
    if (item.id === room.id) link.setAttribute('aria-current', 'page');
    li.append(link);
    return li;
  });
  document.querySelector('#book-chips').replaceChildren(...chips);
  document.querySelector('#book-chips .art-chip[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
}

function renderRegion(item, message) {
  const li = element('li');
  const done = acquired.has(item.exhibitId);
  const control = done ? element('a', 'book__region art-pressable is-done') : element('button', 'book__region art-pressable');
  const order = element('span', 'book__region-order', String(item.order));
  order.setAttribute('aria-hidden', 'true');
  control.append(order, element('span', 'visually-hidden', `${item.order}번 `), element('span', 'book__region-title', item.title));

  if (done) {
    control.href = `/pages/artifact-detail.html?exhibitId=${encodeURIComponent(item.exhibitId)}`;
    control.append(element('span', 'visually-hidden', ', 채움, 유물 보기'));
  } else {
    control.type = 'button';
    control.append(element('span', 'visually-hidden', ', 아직 비어 있음'));
    control.addEventListener('click', () => {
      // 같은 문구도 다시 읽히도록 비운 뒤 넣는다.
      message.textContent = '';
      setTimeout(() => { message.textContent = `${item.order}번 ${item.title}: ${HINT_TEXT}`; }, 50);
    });
  }
  li.append(control);
  return li;
}

function renderHall() {
  const { filled, total, complete } = summarizeRoom(room, acquired);
  const focusExhibitId = room.regions.some((item) => item.exhibitId === focus) ? focus : null;

  document.title = `${room.shortName} 그림 도감 | BU:LOG`;
  // 뒤로가기 버튼 자리와 겹치지 않게 나뭇가지 장식을 뗀다.
  document.querySelector('#book').classList.replace('art-sky--branch', 'is-hall');
  document.querySelector('#book-back').hidden = false;
  document.querySelector('#book-room-name').textContent = room.name;
  document.querySelector('#book-scene-title').textContent = room.sceneTitle;
  document.querySelector('#book-scene-count').textContent = complete ? '완성' : `${filled} / ${total}`;
  const scene = renderScene(room, acquired, { focusExhibitId, regionHref: demoFillUrl });
  scene.dataset.vtName = sceneTransitionName(room.id);
  document.querySelector('#book-scene').replaceChildren(scene);
  document.querySelector('#book-demo-hint').hidden = complete;

  const message = document.querySelector('#book-message');
  message.textContent = complete ? `${room.sceneTitle} 그림 완성!` : '';
  message.classList.toggle('is-complete', complete);
  document.querySelector('#book-regions').replaceChildren(...room.regions.map((item, index) => rise(renderRegion(item, message), index)));

  renderChips();
  document.querySelector('#book-hall').hidden = false;
}

renderTotal();
if (room) renderHall();
else renderOverview();
