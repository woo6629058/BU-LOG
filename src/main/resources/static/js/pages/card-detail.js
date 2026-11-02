import { createArtifactCardBack, createArtifactCardFront } from '../common/artifact-card.js';
import { SAMPLE_CARDS } from '../common/collection-data.js';
import { getRequiredQueryParam } from '../common/url.js';

const SETTLE_DURATION = 450;
const TOAST_DURATION = 2000;
const SHOWCASE_NOTICE = '진열장은 준비 중이에요';
const MAX_TILT = 10;

// 카드 상세에서 볼 수 있는 카드는 수집한 카드뿐이다(번호 순).
// TODO(Frontend B): API 명세 확정 후 카드 상세 API 응답으로 교체한다.
const cards = SAMPLE_CARDS.filter((card) => card.acquired);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const scene = document.querySelector('#detail-scene');
const cardElement = document.querySelector('#detail-card');
const flipButton = document.querySelector('#detail-flip');
const hint = document.querySelector('#detail-hint');
const status = document.querySelector('#detail-status');
const toast = document.querySelector('#detail-toast');

// 가장 가까운 면(180도 배수)으로 붙인 각도.
function snapAngle(degrees) {
  return Math.round(degrees / 180) * 180;
}

// 각도가 뒷면을 향하는지. 누적 각도와 음수 각도도 처리한다.
function isBackFacing(degrees) {
  const normalized = ((degrees % 360) + 360) % 360;
  return normalized > 90 && normalized < 270;
}

// 세로로 끈 거리에 따른 살짝 기울임. ±10도로 제한한다.
function tiltAngle(deltaY) {
  return Math.max(-MAX_TILT, Math.min(MAX_TILT, -deltaY * 0.1));
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderCount(index) {
  const count = document.querySelector('#detail-count');
  const visible = element('span', '', `${index + 1} / ${cards.length}`);
  visible.setAttribute('aria-hidden', 'true');
  count.replaceChildren(visible, element('span', 'visually-hidden', `수집한 카드 ${cards.length}장 중 ${index + 1}번째`));
}

function renderDots(index) {
  const dots = document.querySelector('#detail-dots');
  dots.replaceChildren(...cards.map((_, dotIndex) => element('li', dotIndex === index ? 'is-active' : '')));
  dots.hidden = false;
}

function showError() {
  document.querySelector('#detail-error').hidden = false;
}

// 같은 문구도 다시 읽히도록 비운 뒤 다음 틱에 넣는다.
let statusTimer = null;
function announce(message) {
  clearTimeout(statusTimer);
  status.textContent = '';
  statusTimer = setTimeout(() => { status.textContent = message; }, 50);
}

let toastTimer = null;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-shown');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-shown'), TOAST_DURATION);
  announce(message);
}

// 회전 상태: idle(대기) / dragging(끄는 중) / settling(면에 붙는 중). 진행 중에는 새 회전을 받지 않는다.
let angle = 0;
let mode = 'idle';
let drag = null;
let settleTimer = null;
let shownBack = false;
let front = null;
let back = null;

function applyTransform(rotateY, rotateX, animate) {
  cardElement.classList.toggle('is-animating', animate);
  cardElement.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

// 보이는 면만 보조기술과 키보드에 노출한다.
function updateFaces(degrees) {
  const backFacing = isBackFacing(degrees);
  front.inert = backFacing;
  front.setAttribute('aria-hidden', String(backFacing));
  back.inert = !backFacing;
  back.setAttribute('aria-hidden', String(!backFacing));
}

function updateControls() {
  const backFacing = isBackFacing(angle);
  flipButton.textContent = backFacing ? '앞면 보기' : '뒷면 보기';
  hint.textContent = backFacing ? '다시 돌리면 앞면으로 돌아가요' : '좌우로 드래그해서 카드를 돌려보세요';
  if (backFacing !== shownBack) {
    shownBack = backFacing;
    announce(backFacing ? '뒷면을 보고 있어요' : '앞면을 보고 있어요');
  }
}

// 회전이 끝난 뒤에 보이는 면과 버튼·안내 문구를 확정한다.
function completeSettle() {
  clearTimeout(settleTimer);
  cardElement.classList.remove('is-animating');
  mode = 'idle';
  updateFaces(angle);
  updateControls();
}

function finishSettle() {
  if (mode === 'settling') completeSettle();
}

function settle(target) {
  angle = target;
  if (reducedMotion.matches) {
    applyTransform(angle, 0, false);
    completeSettle();
    return;
  }
  mode = 'settling';
  applyTransform(angle, 0, true);
  // transitionend가 오지 않는 경우(탭 전환 등)에도 상태가 풀리도록 한다.
  clearTimeout(settleTimer);
  settleTimer = setTimeout(finishSettle, SETTLE_DURATION + 100);
}

function endDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const current = drag.current;
  drag = null;
  settle(snapAngle(current));
}

function bindRotation() {
  cardElement.addEventListener('transitionend', (event) => {
    if (event.target === cardElement && event.propertyName === 'transform') finishSettle();
  });

  // 한 번에 하나의 포인터만 카드를 돌린다.
  scene.addEventListener('pointerdown', (event) => {
    if (mode !== 'idle' || drag || !event.isPrimary || event.button !== 0) return;
    drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, start: angle, current: angle };
    mode = 'dragging';
    scene.setPointerCapture(event.pointerId);
    cardElement.classList.remove('is-animating');
  });

  scene.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    // 가로로 끈 거리(px)만큼 돌린다. 1px = 1도, 오른쪽으로 끌면 버튼과 같은 방향.
    drag.current = drag.start + (event.clientX - drag.startX);
    applyTransform(drag.current, tiltAngle(event.clientY - drag.startY), false);
    updateFaces(drag.current);
  });

  // 같은 포인터의 종료 이벤트가 여러 번 와도 한 번만 정리된다.
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    scene.addEventListener(type, endDrag);
  }

  flipButton.addEventListener('click', () => {
    if (mode !== 'idle') return;
    settle(angle + 180);
  });
}

function init() {
  let index = -1;
  try {
    const id = getRequiredQueryParam('id');
    index = cards.findIndex((card) => card.id === id);
  } catch {
    index = -1;
  }
  if (index < 0) {
    showError();
    return;
  }

  const card = cards[index];
  document.title = `${card.name} | BU:LOG`;
  document.querySelector('#detail-title').textContent = card.name;
  renderCount(index);
  renderDots(index);

  front = createArtifactCardFront(card);
  back = createArtifactCardBack(card);
  cardElement.replaceChildren(front, back);
  updateFaces(angle);

  document.querySelector('#detail-stage').hidden = false;
  document.querySelector('#detail-actions').hidden = false;
  document.querySelector('#detail-showcase').addEventListener('click', () => showToast(SHOWCASE_NOTICE));
  bindRotation();
}

init();
