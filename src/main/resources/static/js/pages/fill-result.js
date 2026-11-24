// 그림 채우기 성공: 퀴즈 정답 뒤 퀴즈 화면이 ?exhibitId=…(이미 채운 구역이면 &new=0)로 보낸다.
// 서버 수집 기록에 있는 유물만 채워진 것으로 그린다. 아직 모으지 않은 유물이면 미션 안내를 보여 준다.
import { loadScene, playFill, regionRect, renderScene } from '../common/scene.js';
import { acquiredSet, findRegion, loadCollection, summarizeAll, summarizeRoom } from '../common/collection-data.js';
import { loadFinisher, loadHallOfFame } from '../common/hall-of-fame-data.js';
import { reducedMotion } from '../common/motion.js';

const params = new URLSearchParams(window.location.search);
const exhibitId = params.get('exhibitId');
const isNew = params.get('new') !== '0';
// 전시실 그림과 내 기록을 서버에서 받아 온다 (collection-data.js).
const { rooms: ROOMS, records, failed: loadFailed } = await loadCollection();
const hit = findRegion(ROOMS, exhibitId);
const root = document.querySelector('#result');

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function linkButton(text, href, variant) {
  const link = element('a', `art-button${variant === 'secondary' ? ' art-button--secondary' : ''}`, text);
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

// 기록을 받아 오지 못했을 때: 채웠는지 알 수 없으니 다시 시도하게 한다.
function renderLoadFailed() {
  const box = element('section', 'result__notice');
  const retry = element('button', 'art-button', '다시 불러오기');
  retry.type = 'button';
  retry.addEventListener('click', () => window.location.reload());
  box.append(
    element('h1', 'result__title', '기록을 불러오지 못했어요'),
    element('p', 'result__text', '잠시 뒤 다시 시도해 주세요.'),
    retry,
  );
  root.replaceChildren(box);
}

// 아직 모으지 않은 유물: 주소만 열어서는 채워지지 않는다.
function renderNotFilled({ room, region }) {
  const box = element('section', 'result__notice');
  box.append(
    element('h1', 'result__title', '아직 채우지 않은 구역이에요'),
    element('p', 'result__text', `${region.artifactName}의 QR을 찾아 관찰 미션을 풀면 그림이 채워져요.`),
    linkButton('그림 도감에서 보기', `/pages/picture-book.html?room=${encodeURIComponent(room.id)}`, 'primary'),
  );
  root.replaceChildren(box);
}

function renderResult({ room, region }) {
  const acquired = acquiredSet(records);
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
  root.replaceChildren(eyebrow, title, scene, info, status, actions);

  if (isNew) {
    const celebration = renderCelebration();
    root.append(celebration);
    // 드러날 그림을 받고 화면이 그려진 뒤 연출을 시작하고, 끝나면 축하 연출을 보여 주고 스크린리더에 알린다.
    Promise.all([loadScene(room), new Promise((resolve) => setTimeout(resolve, 300))])
      .then(() => playFill(scene, exhibitId))
      .then(() => {
        placeCelebration(celebration, scene);
        celebration.classList.add('is-playing');
        title.classList.add('is-popping');
        status.textContent = `${region.title} 구역이 채워졌어요`;
        // 24번째 칸을 채웠으면 잎 연출이 끝난 뒤 완주 단계로 넘어간다.
        const all = summarizeAll(ROOMS, acquired);
        if (all.total > 0 && all.filled === all.total) {
          const timer = setTimeout(() => {
            renderAllClear()
              // 원화를 다 불러오면 색종이를 시작한다. 느린 네트워크에서 한 장이 멈춰도 2.5초 뒤에는 시작한다.
              .then((images) => Promise.race([
                Promise.allSettled(images.map((image) => image.decode())),
                new Promise((resolve) => setTimeout(resolve, CONFETTI_WAIT_MS)),
              ]))
              .then(() => { if (!reducedMotion()) startConfetti(root); });
          }, reducedMotion() ? 0 : ALL_CLEAR_DELAY_MS);
          // 넘어가기 전에 버튼을 누르기 시작했으면 화면을 바꾸지 않는다 (누르던 자리에 다른 버튼이 오지 않게).
          const cancel = () => clearTimeout(timer);
          actions.addEventListener('pointerdown', cancel, { once: true });
          actions.addEventListener('keydown', cancel, { once: true });
        }
      });
  }
}

// 완주 단계: 잎 연출(약 1.7초)이 끝난 뒤 나온다.
const ALL_CLEAR_DELAY_MS = 1800;
const CONFETTI_WAIT_MS = 2500;

// 완주 번호·탐험 시간 배지. 배지 자리는 처음부터 비워 두고(보이지 않게) 받으면 글자를 채워 보여 준다.
// 그래서 늦게 받아도 아래 버튼이 밀리지 않는다. 받지 못하면 빈자리로 남는다.
async function fillFinisherStats(stats) {
  const [noBadge, timeBadge] = stats.children;
  try {
    const { myNo } = await loadHallOfFame();
    const finisher = myNo ? await loadFinisher(myNo) : null;
    if (!finisher) return;
    noBadge.textContent = `완주자 No.${finisher.no}`;
    timeBadge.textContent = `탐험 시간 ${finisher.duration}`;
    stats.classList.remove('is-pending');
    stats.removeAttribute('aria-hidden');
  } catch {
    // 배지 없이도 완주 단계는 그대로 보여 준다.
  }
}

// 여섯 전시실 원화(번호·구역선 없음)를 금색 액자에 담아 보여 주고, 명예의 전당으로 이어 준다.
// 원화 img 들을 돌려준다 (다 불러온 뒤 색종이를 시작한다).
async function renderAllClear() {
  const eyebrow = element('p', 'result__eyebrow', 'ALL CLEAR');
  eyebrow.setAttribute('aria-hidden', 'true');
  const title = element('h1', 'result__title', '모든 그림을 완성했어요!');
  title.tabIndex = -1;

  const gallery = element('div', 'result__gallery');
  const images = ROOMS.map((room, index) => {
    const frame = element('figure', 'result__frame');
    frame.style.setProperty('--i', index);
    const image = element('img');
    Object.assign(image, { src: room.scene.originalSrc, alt: `${room.name} 완성 그림`, width: 850, height: 793, decoding: 'async' });
    frame.append(image);
    gallery.append(frame);
    return image;
  });

  const stats = element('div', 'result__stats is-pending');
  stats.setAttribute('aria-hidden', 'true');
  // 자리 잡기용 글자 (받으면 바뀐다): 배지 높이만큼 자리를 미리 차지한다.
  stats.append(
    element('p', 'result__progress is-complete', '완주자 No.0'),
    element('p', 'result__progress', '탐험 시간 0분 00초'),
  );
  const status = element('p', 'visually-hidden');
  status.setAttribute('role', 'status');

  const actions = element('div', 'result__actions');
  actions.append(
    linkButton('명예의 전당 보기', '/pages/hall-of-fame.html', 'primary'),
    linkButton('그림 도감 보기', '/pages/picture-book.html', 'secondary'),
  );

  document.title = '모든 그림 완성 | BU:LOG';
  root.classList.add('is-all-clear');
  root.replaceChildren(eyebrow, title, gallery, stats, status, actions);
  window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
  title.focus({ preventScroll: true });
  title.classList.add('is-popping');
  status.textContent = '모든 그림을 완성했어요';
  fillFinisherStats(stats);
  return images;
}

// 색종이: 캔버스 한 장에 그려 가볍게 떨어뜨린다. 내용 뒤(배경 위)로 지나가고, 다 떨어지면 그리기를 멈춘다.
const CONFETTI_COLORS = ['#FF6FA0', '#B286F5', '#5FC4EE', '#FFD23F', '#6FD28B', '#FF9F4A', '#FF6B6B'];
const CONFETTI_COUNT = 80;
const between = (min, max) => min + Math.random() * (max - min);

function startConfetti(container) {
  const canvas = element('canvas', 'result__confetti');
  canvas.setAttribute('aria-hidden', 'true');
  container.prepend(canvas);
  const context = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    ({ width, height } = canvas.getBoundingClientRect());
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  // 긴 띠 6×14, 조각 10×6, 점 지름 8
  const pieces = Array.from({ length: CONFETTI_COUNT }, (_, index) => {
    const shape = Math.random();
    const dot = shape > 0.8;
    const long = shape < 0.45;
    return {
      x: between(0, width), y: between(-height * 0.5, -10),
      fall: between(70, 120), // 떨어지는 속도(px/초)
      swayAmp: between(10, 26), swaySpeed: between(1.6, 2.8), phase: between(0, Math.PI * 2),
      spin: between(-2.4, 2.4), angle: between(0, Math.PI * 2),
      flipSpeed: between(2, 4), // 팔랑임(뒤집힘) 속도
      w: dot ? 8 : long ? 6 : 10, h: dot ? 8 : long ? 14 : 6,
      dot, color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    };
  });

  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    context.clearRect(0, 0, width, height);
    let falling = 0;
    for (const piece of pieces) {
      piece.y += piece.fall * dt;
      piece.angle += piece.spin * dt;
      piece.phase += piece.swaySpeed * dt;
      if (piece.y > height + 20) continue;
      falling += 1;
      context.save();
      context.globalAlpha = Math.min(1, (height + 20 - piece.y) / 120); // 바닥 가까이에서 스르륵 사라진다
      context.translate(piece.x + Math.sin(piece.phase) * piece.swayAmp, piece.y);
      context.rotate(piece.angle);
      context.scale(1, Math.cos((piece.phase * piece.flipSpeed) / piece.swaySpeed));
      context.fillStyle = piece.color;
      if (piece.dot) {
        context.beginPath();
        context.arc(0, 0, piece.w / 2, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
      }
      context.restore();
    }
    if (falling) {
      requestAnimationFrame(tick);
    } else {
      window.removeEventListener('resize', resize);
      canvas.remove();
    }
  };
  requestAnimationFrame(tick);
}

if (!hit) renderUnknown();
else if (loadFailed) renderLoadFailed();
else if (!acquiredSet(records).has(exhibitId)) renderNotFilled(hit);
else renderResult(hit);
