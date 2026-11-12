import { NOTICE_EVENT, mountTabBar } from '../common/tab-bar.js';
import { artifactFigure } from '../common/artifact-figure.js';
import { countUp, reducedMotion, rise } from '../common/motion.js';
import {
  ROOMS,
  SAMPLE_RECORDS,
  acquiredSet,
  summarizeAll,
  summarizeRoom,
} from '../common/collection-data.js';

mountTabBar({ active: 'showcase' });

const SHELF_SIZE = 3;
const TOAST_DURATION = 2200;
const acquired = acquiredSet(SAMPLE_RECORDS);
const hallId = (roomId) => `showcase-hall-${roomId}`;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderTotal() {
  const { filled, total } = summarizeAll(ROOMS, acquired);
  countUp(document.querySelector('#showcase-filled'), filled);
  document.querySelector('#showcase-total').textContent = total;
  document.querySelector('#showcase-count-label').textContent = `${total}개 중 ${filled}개 모음`;
}

/* 짧은 알림: 탭바의 '준비 중' 알림과 겹치지 않게 서로 닫아 준다 (NOTICE_EVENT). */

const toast = document.querySelector('#showcase-toast');
const status = document.querySelector('#showcase-status');
let toastTimer = null;
let statusTimer = null;

function hideToast() {
  clearTimeout(toastTimer);
  toast.classList.remove('is-shown');
}

function showToast(text) {
  document.dispatchEvent(new CustomEvent(NOTICE_EVENT, { detail: { source: 'showcase' } }));
  toast.textContent = text;
  toast.classList.add('is-shown');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, TOAST_DURATION);

  // 같은 문구도 다시 읽히도록 비운 뒤 넣는다.
  clearTimeout(statusTimer);
  status.textContent = '';
  statusTimer = setTimeout(() => { status.textContent = text; }, 50);
}

document.addEventListener(NOTICE_EVENT, (event) => {
  if (event.detail?.source !== 'showcase') hideToast();
});

// 아직 모으지 않은 칸을 누르면 실루엣이 살짝 흔들린다.
function nudge(node) {
  if (reducedMotion()) return;
  node.animate(
    [{ transform: 'rotate(0)' }, { transform: 'rotate(-9deg)' }, { transform: 'rotate(7deg)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(0)' }],
    { duration: 420, easing: 'ease-out' },
  );
}

function renderItem(item, room) {
  const li = element('li', 'showcase__slot');
  if (acquired.has(item.exhibitId)) {
    const link = element('a', 'showcase__item art-pressable');
    link.href = `/pages/artifact-detail.html?exhibitId=${encodeURIComponent(item.exhibitId)}`;
    // 유물 상세의 무대 그림과 같은 이름 후보: 화면이 바뀔 때 유물이 무대로 날아가듯 이어진다 (page-transition.js).
    const figure = artifactFigure(item);
    figure.dataset.vtName = `artifact-${item.exhibitId}`;
    link.append(figure, element('span', 'showcase__name', item.artifactName));
    li.append(link);
  } else {
    const empty = element('button', 'showcase__item art-pressable is-missing');
    empty.type = 'button';
    const silhouette = artifactFigure(item, { silhouette: true });
    empty.append(silhouette, element('span', 'showcase__name', '???'));
    empty.lastChild.setAttribute('aria-hidden', 'true');
    empty.append(element('span', 'visually-hidden', '아직 모으지 않은 유물'));
    empty.addEventListener('click', () => {
      nudge(silhouette);
      showToast(`${room.name}에서 QR을 찾아 미션을 풀면 진열돼요`);
    });
    li.append(empty);
  }
  return li;
}

function renderHall(room, index) {
  const { filled, total } = summarizeRoom(room, acquired);
  const section = element('section', 'showcase__hall');
  section.id = hallId(room.id);
  const titleId = `hall-${room.id}`;
  section.setAttribute('aria-labelledby', titleId);

  const header = element('div', 'showcase__hall-header');
  const title = element('h2', 'showcase__hall-title', room.name);
  title.id = titleId;
  const count = element('p', 'showcase__hall-count', `${filled} / ${total}`);
  count.setAttribute('aria-label', `${total}개 중 ${filled}개 모음`);
  header.append(title, count);

  // 선반 한 줄에 3칸씩 놓는다.
  const cabinet = element('div', 'showcase__cabinet');
  for (let start = 0; start < room.regions.length; start += SHELF_SIZE) {
    const shelf = element('ul', 'showcase__shelf');
    shelf.append(...room.regions.slice(start, start + SHELF_SIZE).map((item) => renderItem(item, room)));
    cabinet.append(shelf);
  }

  section.append(header, cabinet);
  return rise(section, index);
}

/* 전시실 칩: 누르면 그 전시실로 부드럽게 스크롤하고, 스크롤하면 지금 보이는 전시실의 칩을 고른다. */

const chipList = document.querySelector('#showcase-chips');
const chipBar = document.querySelector('.showcase__rooms');
const chips = new Map(); // 전시실 id → 칩
let halls = []; // [전시실 id, 진열장 section] (화면 순서)
let stickTop = 0; // 칩 줄이 붙는 위치 (CSS top: 아이폰은 상태표시줄 높이, 노트북은 0)
let current = null;
// 칩을 눌러 스크롤하는 동안과 그 뒤 사용자가 직접 스크롤하기 전까지는 누른 칩을 그대로 둔다.
// (맨 아래 전시실 바로 위 칸을 누르면 끝까지 내려가도 그 칸이 맨 위에 오지 못하기 때문)
let chipScrolling = false;
let settleTimer = null;
const SETTLE_MS = 150; // 이만큼 스크롤이 멈추면 칩을 눌러 시작한 스크롤이 끝난 것으로 본다.

function select(roomId) {
  if (roomId === current) return;
  chips.get(current)?.removeAttribute('aria-current');
  current = roomId;
  const chosen = chips.get(roomId);
  chosen.setAttribute('aria-current', 'true');
  // 고른 칩이 칩 줄 가운데에 오도록 가로로만 넘긴다 (화면 세로 스크롤은 건드리지 않음).
  const left = chosen.offsetLeft - (chipList.clientWidth - chosen.offsetWidth) / 2;
  chipList.scrollTo({ left, behavior: reducedMotion() ? 'auto' : 'smooth' });
}

// 칩 줄 바로 아래를 지난 마지막 전시실이 지금 보이는 전시실이다. 맨 아래까지 내리면 마지막 전시실.
function spy() {
  const line = chipBar.getBoundingClientRect().bottom + 24;
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  let seen = halls[0][0];
  for (const [roomId, hall] of halls) {
    if (hall.getBoundingClientRect().top <= line) seen = roomId;
  }
  select(atBottom ? halls[halls.length - 1][0] : seen);
}

// 칩 줄이 화면 위에 붙었는지: 붙었을 때만 바탕을 깐다 (제자리에서는 뒤 배경 도형이 보이게).
function updateStuck() {
  chipBar.classList.toggle('is-stuck', chipBar.getBoundingClientRect().top <= stickTop + 0.5);
}

function readStickTop() {
  stickTop = parseFloat(getComputedStyle(chipBar).top) || 0;
}

// 칩을 눌러 시작한 스크롤이 ms 동안 더 없으면 끝난 것으로 본다.
function settleChipScroll(ms) {
  clearTimeout(settleTimer);
  settleTimer = setTimeout(() => { chipScrolling = false; }, ms);
}

function renderChips() {
  const items = ROOMS.map((room) => {
    const li = element('li');
    const link = element('a', 'art-chip', room.shortName);
    link.href = `#${hallId(room.id)}`;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      chipScrolling = true;
      select(room.id);
      document.getElementById(hallId(room.id)).scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
      // 이미 제자리라 스크롤이 일어나지 않아도 잠시 뒤에는 풀린다.
      settleChipScroll(SETTLE_MS * 2);
    });
    chips.set(room.id, link);
    li.append(link);
    return li;
  });
  chipList.replaceChildren(...items);
}

let frame = 0;
function onScrollFrame() {
  updateStuck();
  if (!chipScrolling) spy();
}

window.addEventListener('scroll', () => {
  // 칩을 눌러 시작한 스크롤이 이어지는 동안에는 멈출 때까지 기다린다.
  if (chipScrolling) settleChipScroll(SETTLE_MS);
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(onScrollFrame);
}, { passive: true });

window.addEventListener('resize', () => {
  readStickTop();
  onScrollFrame();
});

renderTotal();
renderChips();
const sections = ROOMS.map(renderHall);
document.querySelector('#showcase-halls').replaceChildren(...sections);
halls = ROOMS.map((room, index) => [room.id, sections[index]]);
readStickTop();
onScrollFrame();
