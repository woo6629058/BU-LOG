import { NOTICE_EVENT, mountTabBar } from '../common/tab-bar.js';
import { createArtifactCardFront, createArtifactCardSlot } from '../common/artifact-card.js';
import {
  ALL_ROOMS,
  SAMPLE_CARDS,
  SAMPLE_ROOMS,
  filterCards,
  findBannerRoom,
  slotStatesOf,
  summarize,
} from '../common/collection-data.js';

mountTabBar({ active: 'cardbook' });

const LEAVE_DURATION = 180;
const STAGGER_STEP = 60;
const MAX_STAGGER_STEPS = 8;
const SHINE_OFFSET = 400;
const TOAST_DURATION = 2500;

const rooms = SAMPLE_ROOMS;
const cards = SAMPLE_CARDS;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// 미획득 카드의 자리 상태(다음 유물·잠긴 카드)는 필터와 관계없이 전체 카드로 정한다.
const slotStates = slotStatesOf(cards);

const filters = document.querySelector('#archive-filters');
const grid = document.querySelector('#archive-grid');
const empty = document.querySelector('#archive-empty');
const status = document.querySelector('#archive-status');
const toast = document.querySelector('#archive-toast');

// 마지막으로 선택한 필터와 실제 화면에 그려진 목록을 따로 관리한다.
let selectedRoomId = ALL_ROOMS;
let renderedCards = [];
let transitionToken = 0;
let observer = null;
let toastTimer = null;
let announceTimer = null;

function canAnimate() {
  return !reducedMotion.matches && 'IntersectionObserver' in window;
}

function roomLabel(roomId) {
  return rooms.find((room) => room.id === roomId)?.name ?? '전체';
}

// 같은 문구도 다시 읽히도록 비운 뒤 다음 틱에 넣는다.
function announce(message) {
  clearTimeout(announceTimer);
  status.textContent = '';
  announceTimer = setTimeout(() => { status.textContent = message; }, 50);
}

function renderSummary() {
  const { acquired, total } = summarize(cards);
  document.querySelector('#archive-acquired').textContent = acquired;
  document.querySelector('#archive-total').textContent = total;
  document.querySelector('#archive-count-label').textContent = `${total}장 중 ${acquired}장 수집`;
}

function renderBanner(roomId) {
  const banner = document.querySelector('#archive-banner');
  const closest = findBannerRoom(rooms, cards, roomId);
  banner.hidden = !closest;
  if (closest) {
    banner.textContent = `${closest.room.name} 세트 완성까지 ${closest.remaining}장! 완성하면 보너스 카드를 드려요`;
  }
}

function renderFilters() {
  const options = [{ id: ALL_ROOMS, shortName: '전체' }, ...rooms];
  filters.replaceChildren(...options.map((room) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'archive-filter';
    button.dataset.room = room.id;
    button.textContent = room.shortName;
    button.setAttribute('aria-pressed', String(room.id === selectedRoomId));
    return button;
  }));
}

function revealItem(item, delay) {
  item.style.setProperty('--delay', `${delay}ms`);
  item.style.setProperty('--card-shine-delay', `${delay + SHINE_OFFSET}ms`);
  item.classList.remove('is-pending');
  observer?.unobserve(item);
}

// 화면에 들어온 카드부터 순서대로 떠오르게 한다.
function observeItems() {
  observer?.disconnect();
  observer = null;
  if (!canAnimate()) return;

  observer = new IntersectionObserver((entries) => {
    entries
      .filter((entry) => entry.isIntersecting)
      .forEach((entry, index) => revealItem(entry.target, Math.min(index, MAX_STAGGER_STEPS) * STAGGER_STEP));
  }, { threshold: 0.15 });
  grid.querySelectorAll('.archive__item.is-pending').forEach((item) => observer.observe(item));
}

function renderItem(card, index, pending) {
  const item = document.createElement('li');
  item.className = `archive__item${pending ? ' is-pending' : ''}`;
  item.dataset.index = String(index);
  const holder = document.createElement('div');
  holder.className = 'artifact-card';
  holder.append(card.acquired
    ? createArtifactCardFront(card, { headingLevel: 2 })
    : createArtifactCardSlot({ state: slotStates.get(card.number), roomName: card.roomName }, { interactive: true }));
  item.append(holder);
  return item;
}

// 목록 요소는 유지하고 안쪽만 교체한다.
function renderGrid(roomId) {
  const pending = canAnimate();
  renderedCards = filterCards(cards, roomId);
  grid.replaceChildren(...renderedCards.map((card, index) => renderItem(card, index, pending)));
  grid.hidden = renderedCards.length === 0;
  empty.hidden = renderedCards.length > 0;
  observeItems();
}

function hideToast() {
  clearTimeout(toastTimer);
  toast.classList.remove('is-shown');
}

function showToast(message) {
  document.dispatchEvent(new CustomEvent(NOTICE_EVENT, { detail: { source: 'archive' } }));
  toast.textContent = message;
  toast.classList.add('is-shown');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, TOAST_DURATION);
  announce(message);
}

function slotMessage(card) {
  if (slotStates.get(card?.number) === 'next') {
    return card.roomName
      ? `아직 발견하지 못한 유물이에요. ${card.roomName}에서 QR을 찾아 미션에 도전해 보세요`
      : '아직 발견하지 못한 유물이에요.';
  }
  return card?.roomName
    ? `아직 잠긴 유물이에요. ${card.roomName}의 이전 유물을 먼저 모아 보세요`
    : '아직 잠긴 유물이에요.';
}

function shake(element) {
  if (!element || reducedMotion.matches) return;
  element.classList.remove('is-shaking');
  void element.offsetWidth; // 연속으로 눌러도 처음부터 다시 흔들리게 한다.
  element.classList.add('is-shaking');
  element.addEventListener('animationend', () => element.classList.remove('is-shaking'), { once: true });
}

function selectRoom(roomId) {
  if (roomId === selectedRoomId) return;
  selectedRoomId = roomId;
  for (const button of filters.querySelectorAll('.archive-filter')) {
    button.setAttribute('aria-pressed', String(button.dataset.room === roomId));
  }
  hideToast();

  // 연속으로 눌러도 마지막 선택만 그린다.
  const token = ++transitionToken;
  const swap = () => {
    if (token !== transitionToken) return;
    renderGrid(roomId);
    renderBanner(roomId);
    grid.classList.remove('is-leaving');
    grid.inert = false;
    const { acquired, total } = summarize(renderedCards);
    announce(`${roomLabel(roomId)} 카드 ${total}장 중 ${acquired}장 수집`);
  };

  // 교체될 목록 안에 포커스가 있으면 선택한 필터로 옮긴다.
  if (grid.contains(document.activeElement)) {
    filters.querySelector(`[data-room="${CSS.escape(roomId)}"]`)?.focus();
  }

  if (reducedMotion.matches || grid.hidden) {
    swap();
    return;
  }

  grid.inert = true;
  grid.classList.add('is-leaving');
  setTimeout(swap, LEAVE_DURATION);
}

filters.addEventListener('click', (event) => {
  const button = event.target.closest('.archive-filter');
  if (!button) return;
  selectRoom(button.dataset.room);
  // 페이지가 세로로 움직이지 않도록 필터 영역 안에서만 드러낸다.
  button.scrollIntoView({ block: 'nearest', inline: 'nearest' });
});

grid.addEventListener('click', (event) => {
  const button = event.target.closest('button.artifact-slot');
  if (!button) return;
  const card = renderedCards[Number(button.closest('.archive__item')?.dataset.index)];
  shake(button.querySelector('.artifact-slot__mark'));
  showToast(slotMessage(card));
});

// 등장 전인 카드로 포커스가 이동하면 관찰을 멈추고 등장 처리한다. 즉시 표시는 CSS :focus-within이 맡는다.
grid.addEventListener('focusin', (event) => {
  const item = event.target.closest('.archive__item.is-pending');
  if (item) revealItem(item, 0);
});

// 탭바 안내가 뜨면 카드북 토스트를 닫는다.
document.addEventListener(NOTICE_EVENT, (event) => {
  if (event.detail?.source !== 'archive') hideToast();
});

renderSummary();
renderFilters();
renderGrid(selectedRoomId);
renderBanner(selectedRoomId);
